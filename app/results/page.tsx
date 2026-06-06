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

const MODELS = ["claude", "gpt4o", "gemini"] as const;
const RESULTS_DIR = path.join(process.cwd(), "evals/results");
const PHOTOS_DIR = path.join(process.cwd(), "evals/test-set/photos");
const LABELS_PATH = path.join(process.cwd(), "evals/test-set/labels.json");

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
  const labels: LabelEntry[] = JSON.parse(fs.readFileSync(LABELS_PATH, "utf-8"));
  const map: Record<string, GroundTruthItem[]> = {};
  for (const l of labels) {
    map[l.id] = l.ground_truth;
  }
  return map;
}

function GroundTruthCard({ items }: { items: GroundTruthItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
        <p className="text-sm text-gray-500 italic">No labels yet</p>
      </div>
    );
  }

  const compostable = items.filter((i) => i.category === "compostable");
  const recyclable = items.filter((i) => i.category === "recyclable");
  const landfill = items.filter((i) => i.category === "landfill");

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-950/10 p-4">
      <div className="mb-3">
        <span className="text-xs text-gray-500">{items.length} items</span>
      </div>

      {compostable.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-green-500 uppercase tracking-wide">
            Compostable ({compostable.length})
          </p>
          <ul className="space-y-1">
            {compostable.map((item, i) => (
              <li key={i} className="text-sm text-green-400">{item.name}</li>
            ))}
          </ul>
        </div>
      )}

      {recyclable.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-blue-500 uppercase tracking-wide">
            Recyclable ({recyclable.length})
          </p>
          <ul className="space-y-1">
            {recyclable.map((item, i) => (
              <li key={i} className="text-sm text-blue-400">{item.name}</li>
            ))}
          </ul>
        </div>
      )}

      {landfill.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Landfill ({landfill.length})
          </p>
          <ul className="space-y-1">
            {landfill.map((item, i) => (
              <li key={i} className="text-sm text-gray-400">{item.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function categoryColor(category: string) {
  switch (category) {
    case "compostable":
      return "text-green-400";
    case "recyclable":
      return "text-blue-400";
    case "landfill":
      return "text-gray-400";
    default:
      return "text-gray-500";
  }
}

function categoryBadge(category: string) {
  switch (category) {
    case "compostable":
      return "bg-green-500/15 text-green-400 border-green-500/30";
    case "recyclable":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30";
    case "landfill":
      return "bg-gray-500/15 text-gray-400 border-gray-500/30";
    default:
      return "bg-gray-500/15 text-gray-500 border-gray-500/30";
  }
}

function ModelResultCard({ result }: { result: ModelResult | null }) {
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
        <p className="mt-1 text-xs text-red-500/70 truncate">
          {result.error}
        </p>
      </div>
    );
  }

  const compostable = result.items.filter((i) => i.category === "compostable");
  const recyclable = result.items.filter((i) => i.category === "recyclable");
  const landfill = result.items.filter((i) => i.category === "landfill");

  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs text-gray-500">
          {result.items.length} items | {result.latency_ms}ms
        </span>
      </div>

      {compostable.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-green-500 uppercase tracking-wide">
            Compostable ({compostable.length})
          </p>
          <ul className="space-y-1">
            {compostable.map((item, i) => (
              <li key={i} className="text-sm text-green-400">
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {recyclable.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 text-xs font-medium text-blue-500 uppercase tracking-wide">
            Recyclable ({recyclable.length})
          </p>
          <ul className="space-y-1">
            {recyclable.map((item, i) => (
              <li key={i} className="text-sm text-blue-400">
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {landfill.length > 0 && (
        <div>
          <p className="mb-1 text-xs font-medium text-gray-500 uppercase tracking-wide">
            Landfill ({landfill.length})
          </p>
          <ul className="space-y-1">
            {landfill.map((item, i) => (
              <li key={i} className="text-sm text-gray-400">
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function Results() {
  const photos = getPhotos();
  const labelsMap = getLabels();

  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12">
        <h1 className="text-3xl font-bold">Eval Results</h1>
        <p className="mt-2 text-gray-400">
          {photos.length} photos classified by {MODELS.length} models
        </p>
      </div>

      <div className="space-y-12">
        {photos.map((photo) => {
          const results = MODELS.map((model) => ({
            model,
            result: getModelResult(model, photo.id),
          }));
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
                  {results.map(({ model, result }) => (
                    <div key={model}>
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
                        {model}
                      </h3>
                      <ModelResultCard result={result} />
                    </div>
                  ))}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
