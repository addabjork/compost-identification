import fs from "fs";
import path from "path";

type PhotoScore = {
  photo_id: string;
  items_identified: number;
  classification_accuracy: number;
  compostable_recall: number;
  compostable_precision: number;
  non_compostable_recall: number;
  non_compostable_precision: number;
  matched: number;
  ground_truth_count: number;
  detected_count: number;
};

type ModelScore = {
  model: string;
  items_identified: number;
  classification_accuracy: number;
  compostable_recall: number;
  compostable_precision: number;
  non_compostable_recall: number;
  non_compostable_precision: number;
  avg_latency_ms: number;
  failure_rate: number;
  per_photo: PhotoScore[];
};

function pct(n: number) {
  return `${(n * 100).toFixed(1)}%`;
}

function loadScores(): ModelScore[] | null {
  const scoresPath = path.join(process.cwd(), "evals/results/scores.json");
  if (!fs.existsSync(scoresPath)) return null;
  return JSON.parse(fs.readFileSync(scoresPath, "utf-8"));
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-900 border border-gray-800 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function colorForScore(score: number) {
  if (score >= 0.8) return "text-green-400";
  if (score >= 0.6) return "text-yellow-400";
  return "text-red-400";
}

export default function Home() {
  const scores = loadScores();

  if (!scores) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <h1 className="text-3xl font-bold">Compost Waste Identifier</h1>
        <p className="mt-2 text-gray-400">Model evaluation dashboard</p>
        <div className="mt-12 rounded-lg border border-gray-800 bg-gray-900 p-8 text-center">
          <p className="text-lg text-gray-300">No results yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Run the eval and scoring scripts first:
          </p>
          <pre className="mt-4 inline-block rounded bg-gray-800 px-4 py-2 text-left text-sm text-gray-300">
            {`npm run eval\nnpm run score`}
          </pre>
        </div>
      </main>
    );
  }

  const best = scores.reduce((a, b) =>
    a.classification_accuracy > b.classification_accuracy ? a : b
  );

  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold">Compost Waste Identifier</h1>
        <p className="mt-2 text-gray-400">
          Comparing {scores.length} vision models on compostable vs
          non-compostable waste classification
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Models tested" value={String(scores.length)} />
        <MetricCard label="Best model" value={best.model} />
        <MetricCard
          label="Best classification"
          value={pct(best.classification_accuracy)}
        />
        <MetricCard
          label="Photos evaluated"
          value={String(best.per_photo.length)}
        />
      </div>

      {/* Main comparison table */}
      <section className="mb-12">
        <h2 className="mb-4 text-xl font-semibold">Model Comparison</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Model</th>
                <th className="px-4 py-3">Items Found</th>
                <th className="px-4 py-3">Class. Accuracy</th>
                <th className="px-4 py-3">Comp. Recall</th>
                <th className="px-4 py-3">Comp. Precision</th>
                <th className="px-4 py-3">Non-C Recall</th>
                <th className="px-4 py-3">Non-C Precision</th>
                <th className="px-4 py-3">Avg Latency</th>
                <th className="px-4 py-3">Fail Rate</th>
              </tr>
            </thead>
            <tbody>
              {scores.map((s) => (
                <tr
                  key={s.model}
                  className="border-b border-gray-800/50 hover:bg-gray-900/50"
                >
                  <td className="px-4 py-3 font-medium">{s.model}</td>
                  <td
                    className={`px-4 py-3 ${colorForScore(s.items_identified)}`}
                  >
                    {pct(s.items_identified)}
                  </td>
                  <td
                    className={`px-4 py-3 ${colorForScore(s.classification_accuracy)}`}
                  >
                    {pct(s.classification_accuracy)}
                  </td>
                  <td
                    className={`px-4 py-3 ${colorForScore(s.compostable_recall)}`}
                  >
                    {pct(s.compostable_recall)}
                  </td>
                  <td
                    className={`px-4 py-3 ${colorForScore(s.compostable_precision)}`}
                  >
                    {pct(s.compostable_precision)}
                  </td>
                  <td
                    className={`px-4 py-3 ${colorForScore(s.non_compostable_recall)}`}
                  >
                    {pct(s.non_compostable_recall)}
                  </td>
                  <td
                    className={`px-4 py-3 ${colorForScore(s.non_compostable_precision)}`}
                  >
                    {pct(s.non_compostable_precision)}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    {Math.round(s.avg_latency_ms)}ms
                  </td>
                  <td
                    className={`px-4 py-3 ${s.failure_rate > 0 ? "text-red-400" : "text-green-400"}`}
                  >
                    {pct(s.failure_rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Per-photo breakdowns */}
      {scores.map((modelScore) => (
        <section key={modelScore.model} className="mb-12">
          <h2 className="mb-4 text-xl font-semibold">
            {modelScore.model} — Per-Photo Results
          </h2>
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Photo</th>
                  <th className="px-4 py-3">Matched</th>
                  <th className="px-4 py-3">Detected</th>
                  <th className="px-4 py-3">Ground Truth</th>
                  <th className="px-4 py-3">Items Found</th>
                  <th className="px-4 py-3">Class. Accuracy</th>
                  <th className="px-4 py-3">Comp. Recall</th>
                  <th className="px-4 py-3">Comp. Precision</th>
                </tr>
              </thead>
              <tbody>
                {modelScore.per_photo.map((p) => (
                  <tr
                    key={p.photo_id}
                    className="border-b border-gray-800/50 hover:bg-gray-900/50"
                  >
                    <td className="px-4 py-3 font-mono text-xs">
                      {p.photo_id}
                    </td>
                    <td className="px-4 py-3">{p.matched}</td>
                    <td className="px-4 py-3">{p.detected_count}</td>
                    <td className="px-4 py-3">{p.ground_truth_count}</td>
                    <td
                      className={`px-4 py-3 ${colorForScore(p.items_identified)}`}
                    >
                      {pct(p.items_identified)}
                    </td>
                    <td
                      className={`px-4 py-3 ${colorForScore(p.classification_accuracy)}`}
                    >
                      {pct(p.classification_accuracy)}
                    </td>
                    <td
                      className={`px-4 py-3 ${colorForScore(p.compostable_recall)}`}
                    >
                      {pct(p.compostable_recall)}
                    </td>
                    <td
                      className={`px-4 py-3 ${colorForScore(p.compostable_precision)}`}
                    >
                      {pct(p.compostable_precision)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </main>
  );
}
