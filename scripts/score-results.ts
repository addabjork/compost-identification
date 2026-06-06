/**
 * score-results.ts
 *
 * Compares model outputs in evals/results/ against evals/test-set/labels.json.
 *
 * Three core metrics per photo:
 * 1. Item identification accuracy — what % of ground truth items did the model find?
 * 2. Category classification accuracy — of matched items, what % got the category right?
 * 3. Category percentage accuracy — how close are the model's compostable/recyclable/landfill
 *    percentages to the human's? (1 - average absolute error across categories)
 *
 * Usage:
 *   npx ts-node scripts/score-results.ts
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Paths ─────────────────────────────────────────────────────────────────────

const LABELS_PATH = path.resolve(__dirname, '../evals/test-set/labels.json');
const RESULTS_DIR = path.resolve(__dirname, '../evals/results');
const SCORES_PATH = path.resolve(__dirname, '../evals/results/scores.json');

const MODELS = ['claude', 'gpt4o', 'gemini'];
const CATEGORIES = ['compostable', 'recyclable', 'landfill'] as const;
type Category = typeof CATEGORIES[number];

// ── Types ─────────────────────────────────────────────────────────────────────

type GroundTruthItem = {
  name: string;
  category: Category;
};

type LabelEntry = {
  id: string;
  photo: string;
  ground_truth: GroundTruthItem[];
};

type DetectedItem = {
  name: string;
  category: string;
  reason: string;
};

type ModelResult = {
  photo_id: string;
  success: boolean;
  items: DetectedItem[] | null;
  latency_ms: number;
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

// ── Fuzzy name matching ───────────────────────────────────────────────────────

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function namesMatch(detected: string, truth: string): boolean {
  const d = normalize(detected);
  const t = normalize(truth);

  if (d === t) return true;
  if (d.includes(t) || t.includes(d)) return true;

  const dWords = new Set(d.split(' '));
  const tWords = new Set(t.split(' '));
  const overlap = [...dWords].filter((w) => tWords.has(w) && w.length > 3);

  return overlap.length > 0;
}

// ── Percentage calculation ────────────────────────────────────────────────────

function computePercentages(items: { category: string }[]): CategoryPercentages {
  if (items.length === 0) return { compostable: 0, recyclable: 0, landfill: 0 };
  const counts = { compostable: 0, recyclable: 0, landfill: 0 };
  for (const item of items) {
    if (item.category in counts) {
      counts[item.category as Category]++;
    }
  }
  return {
    compostable: counts.compostable / items.length,
    recyclable: counts.recyclable / items.length,
    landfill: counts.landfill / items.length,
  };
}

function percentageAccuracy(truth: CategoryPercentages, detected: CategoryPercentages): number {
  // 1 - mean absolute error across the three categories
  const mae = (
    Math.abs(truth.compostable - detected.compostable) +
    Math.abs(truth.recyclable - detected.recyclable) +
    Math.abs(truth.landfill - detected.landfill)
  ) / 3;
  return Math.max(0, 1 - mae);
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function scorePhoto(detected: DetectedItem[], groundTruth: GroundTruthItem[]): PhotoScore {
  const matched: { detected: DetectedItem; truth: GroundTruthItem }[] = [];
  const usedTruth = new Set<number>();

  for (const det of detected) {
    for (let i = 0; i < groundTruth.length; i++) {
      if (usedTruth.has(i)) continue;
      if (namesMatch(det.name, groundTruth[i].name)) {
        matched.push({ detected: det, truth: groundTruth[i] });
        usedTruth.add(i);
        break;
      }
    }
  }

  const matchCount = matched.length;

  // 1. Item identification accuracy
  const items_identified = groundTruth.length > 0 ? matchCount / groundTruth.length : 0;

  // 2. Category classification accuracy (of matched items)
  const correctClassifications = matched.filter(
    (m) => m.detected.category === m.truth.category
  ).length;
  const classification_accuracy = matchCount > 0 ? correctClassifications / matchCount : 0;

  // 3. Category percentage accuracy
  const truth_percentages = computePercentages(groundTruth);
  const detected_percentages = computePercentages(detected);
  const percentage_accuracy = percentageAccuracy(truth_percentages, detected_percentages);

  return {
    photo_id: '',
    items_identified,
    classification_accuracy,
    percentage_accuracy,
    truth_percentages,
    detected_percentages,
    matched: matchCount,
    ground_truth_count: groundTruth.length,
    detected_count: detected.length,
  };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function scoreModel(model: string, labels: LabelEntry[]): ModelScore {
  const resultsDir = path.join(RESULTS_DIR, model);
  const photoScores: PhotoScore[] = [];
  const latencies: number[] = [];
  let failures = 0;

  const zeroPct: CategoryPercentages = { compostable: 0, recyclable: 0, landfill: 0 };

  for (const label of labels) {
    const resultPath = path.join(resultsDir, `${label.id}.json`);

    if (!fs.existsSync(resultPath)) {
      console.warn(`  Missing result: ${label.id}`);
      failures++;
      continue;
    }

    const result: ModelResult = JSON.parse(fs.readFileSync(resultPath, 'utf-8'));
    latencies.push(result.latency_ms);

    if (!result.success || !result.items) {
      failures++;
      photoScores.push({
        photo_id: label.id,
        items_identified: 0,
        classification_accuracy: 0,
        percentage_accuracy: 0,
        truth_percentages: computePercentages(label.ground_truth),
        detected_percentages: zeroPct,
        matched: 0,
        ground_truth_count: label.ground_truth.length,
        detected_count: 0,
      });
      continue;
    }

    const score = scorePhoto(result.items, label.ground_truth);
    photoScores.push({ ...score, photo_id: label.id });
  }

  return {
    model,
    items_identified: avg(photoScores.map((s) => s.items_identified)),
    classification_accuracy: avg(photoScores.map((s) => s.classification_accuracy)),
    percentage_accuracy: avg(photoScores.map((s) => s.percentage_accuracy)),
    avg_latency_ms: avg(latencies),
    failure_rate: failures / labels.length,
    per_photo: photoScores,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main() {
  if (!fs.existsSync(LABELS_PATH)) {
    console.error('No labels file found at evals/test-set/labels.json');
    console.error('Create ground truth labels before scoring.');
    process.exit(1);
  }

  const labels: LabelEntry[] = JSON.parse(fs.readFileSync(LABELS_PATH, 'utf-8'));
  console.log(`Scoring ${labels.length} images across models: ${MODELS.join(', ')}\n`);

  const scores: ModelScore[] = [];

  for (const model of MODELS) {
    process.stdout.write(`Scoring ${model}... `);
    const score = scoreModel(model, labels);
    scores.push(score);
    console.log('done');
  }

  fs.writeFileSync(SCORES_PATH, JSON.stringify(scores, null, 2));

  // ── Print summary table ───────────────────────────────────────────────────

  const pad = (s: string | number, n: number) => String(s).padEnd(n);
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  console.log('\n');
  console.log(
    pad('Model', 10) +
    pad('Items ID\'d', 12) +
    pad('Class Acc', 11) +
    pad('Pct Acc', 10) +
    pad('Avg ms', 10) +
    'Fail%',
  );
  console.log('─'.repeat(55));

  for (const s of scores) {
    console.log(
      pad(s.model, 10) +
      pad(pct(s.items_identified), 12) +
      pad(pct(s.classification_accuracy), 11) +
      pad(pct(s.percentage_accuracy), 10) +
      pad(Math.round(s.avg_latency_ms), 10) +
      pct(s.failure_rate),
    );
  }

  console.log('\nFull scores saved to evals/results/scores.json');

  // ── Per-photo breakdown ───────────────────────────────────────────────────

  console.log('\n── Per-photo breakdown ──');
  for (const modelScore of scores) {
    console.log(`\n${modelScore.model}:`);
    for (const p of modelScore.per_photo) {
      const tp = p.truth_percentages;
      const dp = p.detected_percentages;
      console.log(
        `  ${p.photo_id}: items ${pct(p.items_identified)} | class ${pct(p.classification_accuracy)} | pct ${pct(p.percentage_accuracy)}` +
        ` | truth C${pct(tp.compostable)}/R${pct(tp.recyclable)}/L${pct(tp.landfill)}` +
        ` | model C${pct(dp.compostable)}/R${pct(dp.recyclable)}/L${pct(dp.landfill)}`
      );
    }
  }
}

main();
