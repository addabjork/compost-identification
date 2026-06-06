import fs from "fs";
import path from "path";
import Image from "next/image";

type DetectedItem = {
  name: string;
  category: string;
  reason: string;
};

type ModelResult = {
  model: string;
  photo_id: string;
  photo_file: string;
  latency_ms: number;
  success: boolean;
  items: DetectedItem[] | null;
  raw_response: string | null;
  error: string | null;
};

type GroundTruthItem = {
  name: string;
  category: string;
};

type LabelEntry = {
  id: string;
  photo: string;
  ground_truth: GroundTruthItem[];
};

type CategoryPercentages = {
  compostable: number;
  recyclable: number;
  landfill: number;
};

type PhotoScore = {
  photo_id: string;
  items_identified: number;
  classification_accuracy: number;
  percentage_accuracy: number;
  truth_percentages: CategoryPercentages;
  detected_percentages: CategoryPercentages;
  matched: number;
  ground_truth_count: number;
  detected_count: number;
};

type ModelScore = {
  model: string;
  items_identified: number;
  classification_accuracy: number;
  percentage_accuracy: number;
  avg_latency_ms: number;
  failure_rate: number;
  per_photo: PhotoScore[];
};

const MODELS = ["claude", "gpt4o", "gemini"] as const;
const RESULTS_DIR = path.join(process.cwd(), "evals/results");
const PHOTOS_DIR = path.join(process.cwd(), "evals/test-set/photos");
const LABELS_PATH = path.join(process.cwd(), "evals/test-set/labels.json");
const SCORES_PATH = path.join(process.cwd(), "evals/results/scores.json");

function getPhotos() {
  return fs
    .readdirSync(PHOTOS_DIR)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort()
    .map((file) => ({
      id: path.basename(file, path.extname(file)),
      file,
    }));
}

function getModelResult(model: string, photoId: string): ModelResult | null {
  const resultPath = path.join(RESULTS_DIR, model, `${photoId}.json`);
  if (!fs.existsSync(resultPath)) return null;
  return JSON.parse(fs.readFileSync(resultPath, "utf-8"));
}

function getLabels(): Record<string, GroundTruthItem[]> {
  if (!fs.existsSync(LABELS_PATH)) return {};
  const labels: LabelEntry[] = JSON.parse(
    fs.readFileSync(LABELS_PATH, "utf-8")
  );
  const map: Record<string, GroundTruthItem[]> = {};
  for (const l of labels) {
    map[l.id] = l.ground_truth;
  }
  return map;
}

function getScores(): Record<string, Record<string, PhotoScore>> {
  if (!fs.existsSync(SCORES_PATH)) return {};
  const scores: ModelScore[] = JSON.parse(
    fs.readFileSync(SCORES_PATH, "utf-8")
  );
  const map: Record<string, Record<string, PhotoScore>> = {};
  for (const ms of scores) {
    map[ms.model] = {};
    for (const ps of ms.per_photo) {
      map[ms.model][ps.photo_id] = ps;
    }
  }
  return map;
}

function pct(n: number) {
  return `${(n * 100).toFixed(0)}%`;
}

function colorForScore(score: number) {
  if (score >= 0.8) return "text-green-400";
  if (score >= 0.6) return "text-yellow-400";
  return "text-red-400";
}

function PercentageBar({
  compostable,
  recyclable,
  landfill,
}: CategoryPercentages) {
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-800">
      {compostable > 0 && (
        <div
          className="bg-green-500"
          style={{ width: `${compostable * 100}%` }}
          title={`Compostable: ${pct(compostable)}`}
        />
      )}
      {recyclable > 0 && (
        <div
          className="bg-blue-500"
          style={{ width: `${recyclable * 100}%` }}
          title={`Recyclable: ${pct(recyclable)}`}
        />
      )}
      {landfill > 0 && (
        <div
          className="bg-gray-500"
          style={{ width: `${landfill * 100}%` }}
          title={`Landfill: ${pct(landfill)}`}
        />
      )}
    </div>
  );
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${colorForScore(score)}`}>
        {pct(score)}
      </span>
    </div>
  );
}

function ItemList({ items }: { items: { name: string; category: string }[] }) {
  const compostable = items.filter((i) => i.category === "compostable");
  const recyclable = items.filter((i) => i.category === "recyclable");
  const landfill = items.filter((i) => i.category === "landfill");

  return (
    <>
      {compostable.length > 0 && (
        <div className="mb-2">
          <p className="mb-0.5 text-xs font-medium text-green-500 uppercase tracking-wide">
            Compostable ({compostable.length})
          </p>
          <ul className="space-y-0.5">
            {compostable.map((item, i) => (
              <li key={i} className="text-xs text-green-400">
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {recyclable.length > 0 && (
        <div className="mb-2">
          <p className="mb-0.5 text-xs font-medium text-blue-500 uppercase tracking-wide">
            Recyclable ({recyclable.length})
          </p>
          <ul className="space-y-0.5">
            {recyclable.map((item, i) => (
              <li key={i} className="text-xs text-blue-400">
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {landfill.length > 0 && (
        <div>
          <p className="mb-0.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Landfill ({landfill.length})
          </p>
          <ul className="space-y-0.5">
            {landfill.map((item, i) => (
              <li key={i} className="text-xs text-gray-400">
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

function ModelCard({
  model,
  result,
  score,
}: {
  model: string;
  result: ModelResult | null;
  score: PhotoScore | undefined;
}) {
  if (!result) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <p className="text-sm text-gray-500 italic">No results</p>
      </div>
    );
  }

  if (!result.success || !result.items) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
        <p className="text-sm text-red-400">Failed</p>
        <p className="mt-1 text-xs text-red-500/70 truncate">{result.error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
      {/* Scores */}
      {score && (
        <div className="mb-3 space-y-1 border-b border-gray-800 pb-3">
          <ScoreBadge label="Items found" score={score.items_identified} />
          <ScoreBadge
            label="Category accuracy"
            score={score.classification_accuracy}
          />
          <ScoreBadge label="% accuracy" score={score.percentage_accuracy} />
        </div>
      )}

      {/* Percentage bar */}
      {score && (
        <div className="mb-3">
          <PercentageBar {...score.detected_percentages} />
          <div className="mt-1 flex justify-between text-[10px] text-gray-500">
            <span className="text-green-500">
              C {pct(score.detected_percentages.compostable)}
            </span>
            <span className="text-blue-500">
              R {pct(score.detected_percentages.recyclable)}
            </span>
            <span className="text-gray-400">
              L {pct(score.detected_percentages.landfill)}
            </span>
          </div>
        </div>
      )}

      {/* Item count + latency */}
      <div className="mb-3">
        <span className="text-xs text-gray-500">
          {result.items.length} items | {result.latency_ms}ms
        </span>
      </div>

      {/* Item list */}
      <ItemList items={result.items} />
    </div>
  );
}

function GroundTruthCard({ items }: { items: GroundTruthItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <p className="text-sm text-gray-500 italic">No labels yet</p>
      </div>
    );
  }

  const total = items.length;
  const compostable = items.filter((i) => i.category === "compostable").length;
  const recyclable = items.filter((i) => i.category === "recyclable").length;
  const landfill = items.filter((i) => i.category === "landfill").length;

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-950/10 p-4">
      {/* Percentage bar */}
      <div className="mb-3">
        <PercentageBar
          compostable={compostable / total}
          recyclable={recyclable / total}
          landfill={landfill / total}
        />
        <div className="mt-1 flex justify-between text-[10px] text-gray-500">
          <span className="text-green-500">
            C {pct(compostable / total)}
          </span>
          <span className="text-blue-500">
            R {pct(recyclable / total)}
          </span>
          <span className="text-gray-400">
            L {pct(landfill / total)}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <span className="text-xs text-gray-500">{total} items</span>
      </div>

      <ItemList items={items} />
    </div>
  );
}

export default function Results() {
  const photos = getPhotos();
  const labelsMap = getLabels();
  const scoresMap = getScores();

  // Load aggregate scores for summary
  const modelScores: ModelScore[] = fs.existsSync(SCORES_PATH)
    ? JSON.parse(fs.readFileSync(SCORES_PATH, "utf-8"))
    : [];

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold">Eval Results</h1>
        <p className="mt-2 text-gray-400">
          {photos.length} photos classified by {MODELS.length} models
        </p>
      </div>

      {/* Summary table */}
      {modelScores.length > 0 && (
        <section className="mb-12">
          <div className="overflow-x-auto rounded-lg border border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900 text-left text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Model</th>
                  <th className="px-4 py-3">Items Found</th>
                  <th className="px-4 py-3">Category Acc</th>
                  <th className="px-4 py-3">% Accuracy</th>
                  <th className="px-4 py-3">Avg Latency</th>
                  <th className="px-4 py-3">Fail Rate</th>
                </tr>
              </thead>
              <tbody>
                {modelScores.map((s) => (
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
                      className={`px-4 py-3 ${colorForScore(s.percentage_accuracy)}`}
                    >
                      {pct(s.percentage_accuracy)}
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
          <div className="mt-3 flex gap-4 text-xs text-gray-500">
            <span>
              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1" />
              Compostable
            </span>
            <span>
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500 mr-1" />
              Recyclable
            </span>
            <span>
              <span className="inline-block h-2 w-2 rounded-full bg-gray-500 mr-1" />
              Landfill
            </span>
          </div>
        </section>
      )}

      {/* Per-photo results */}
      <div className="space-y-12">
        {photos.map((photo) => {
          const groundTruth = labelsMap[photo.id] ?? [];

          return (
            <section
              key={photo.id}
              className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden"
            >
              <div className="border-b border-gray-800 bg-gray-900/50 px-6 py-3">
                <h2 className="text-sm font-medium text-gray-300">
                  {photo.id}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-[350px_1fr]">
                {/* Photo on the left */}
                <div className="overflow-hidden rounded-lg border border-gray-800">
                  <Image
                    src={`/photos/${photo.file}`}
                    alt={`Waste photo ${photo.id}`}
                    width={700}
                    height={700}
                    className="w-full object-cover"
                  />
                </div>

                {/* Human labels + model results on the right */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                  <div>
                    <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-amber-400">
                      Human Labels
                    </h3>
                    <GroundTruthCard items={groundTruth} />
                  </div>
                  {MODELS.map((model) => {
                    const result = getModelResult(model, photo.id);
                    const score = scoresMap[model]?.[photo.id];
                    return (
                      <div key={model}>
                        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
                          {model}
                        </h3>
                        <ModelCard
                          model={model}
                          result={result}
                          score={score}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
