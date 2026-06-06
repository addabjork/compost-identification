/**
 * score-results.ts
 *
 * Compares model outputs in evals/results/ against evals/test-set/labels.json
 * and computes classification accuracy, plus per-category (compostable, recyclable,
 * landfill) recall and precision.
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

type CategoryMetrics = {
  recall: number;
  precision: number;
};

type PhotoScore = {
  photo_id: string;
  items_identified: number;
  classification_accuracy: number;
  compostable: CategoryMetrics;
  recyclable: CategoryMetrics;
  landfill: CategoryMetrics;
  matched: number;
  ground_truth_count: number;
  detected_count: number;
};

type ModelScore = {
  model: string;
  items_identified: number;
  classification_accuracy: number;
  compostable: CategoryMetrics;
  recyclable: CategoryMetrics;
  landfill: CategoryMetrics;
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

// ── Scoring ───────────────────────────────────────────────────────────────────

function computeCategoryMetrics(
  matched: { detected: DetectedItem; truth: GroundTruthItem }[],
  allDetected: DetectedItem[],
  allTruth: GroundTruthItem[],
  category: Category,
): CategoryMetrics {
  // Recall: of all truly X items, how many did the model find AND correctly label as X?
  const trueCount = allTruth.filter((g) => g.category === category).length;
  const correctlyFound = matched.filter(
    (m) => m.truth.category === category && m.detected.category === category
  ).length;
  const recall = trueCount > 0 ? correctlyFound / trueCount : 0;

  // Precision: of items the model labeled X, how many truly are X?
  const detectedCount = allDetected.filter((d) => d.category === category).length;
  const matchedCorrect = matched.filter(
    (m) => m.detected.category === category && m.truth.category === category
  ).length;
  const precision = detectedCount > 0 ? matchedCorrect / detectedCount : 0;

  return { recall, precision };
}

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
  const items_identified = groundTruth.length > 0 ? matchCount / groundTruth.length : 0;

  // Classification accuracy: of matched items, how many got category right?
  const correctClassifications = matched.filter(
    (m) => m.detected.category === m.truth.category
  ).length;
  const classification_accuracy = matchCount > 0 ? correctClassifications / matchCount : 0;

  return {
    photo_id: '',
    items_identified,
    classification_accuracy,
    compostable: computeCategoryMetrics(matched, detected, groundTruth, 'compostable'),
    recyclable: computeCategoryMetrics(matched, detected, groundTruth, 'recyclable'),
    landfill: computeCategoryMetrics(matched, detected, groundTruth, 'landfill'),
    matched: matchCount,
    ground_truth_count: groundTruth.length,
    detected_count: detected.length,
  };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function avgMetrics(scores: PhotoScore[], category: Category): CategoryMetrics {
  return {
    recall: avg(scores.map((s) => s[category].recall)),
    precision: avg(scores.map((s) => s[category].precision)),
  };
}

function scoreModel(model: string, labels: LabelEntry[]): ModelScore {
  const resultsDir = path.join(RESULTS_DIR, model);
  const photoScores: PhotoScore[] = [];
  const latencies: number[] = [];
  let failures = 0;

  const emptyMetrics: CategoryMetrics = { recall: 0, precision: 0 };

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
        compostable: emptyMetrics,
        recyclable: emptyMetrics,
        landfill: emptyMetrics,
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
    compostable: avgMetrics(photoScores, 'compostable'),
    recyclable: avgMetrics(photoScores, 'recyclable'),
    landfill: avgMetrics(photoScores, 'landfill'),
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
    pad('Comp R', 8) +
    pad('Comp P', 8) +
    pad('Recy R', 8) +
    pad('Recy P', 8) +
    pad('Land R', 8) +
    pad('Land P', 8) +
    pad('Avg ms', 10) +
    'Fail%',
  );
  console.log('─'.repeat(103));

  for (const s of scores) {
    console.log(
      pad(s.model, 10) +
      pad(pct(s.items_identified), 12) +
      pad(pct(s.classification_accuracy), 11) +
      pad(pct(s.compostable.recall), 8) +
      pad(pct(s.compostable.precision), 8) +
      pad(pct(s.recyclable.recall), 8) +
      pad(pct(s.recyclable.precision), 8) +
      pad(pct(s.landfill.recall), 8) +
      pad(pct(s.landfill.precision), 8) +
      pad(Math.round(s.avg_latency_ms), 10) +
      pct(s.failure_rate),
    );
  }

  console.log('\nFull scores saved to evals/results/scores.json');

  // ── Per-photo breakdown for worst performers ──────────────────────────────

  console.log('\n── Lowest classification accuracy photos ──');
  for (const modelScore of scores) {
    const worst = [...modelScore.per_photo]
      .sort((a, b) => a.classification_accuracy - b.classification_accuracy)
      .slice(0, 5);
    console.log(`\n${modelScore.model}:`);
    for (const p of worst) {
      console.log(`  ${p.photo_id}: ${pct(p.classification_accuracy)} accuracy (${p.matched}/${p.ground_truth_count} matched, ${p.detected_count} detected)`);
    }
  }
}

main();
