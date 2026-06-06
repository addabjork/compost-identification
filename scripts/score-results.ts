/**
 * score-results.ts
 *
 * Compares model outputs in evals/results/ against evals/test-set/labels.json
 * and computes classification accuracy, recall, precision for compostable identification.
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

// ── Types ─────────────────────────────────────────────────────────────────────

type GroundTruthItem = {
  name: string;
  compostable: boolean;
};

type LabelEntry = {
  id: string;
  photo: string;
  ground_truth: GroundTruthItem[];
};

type DetectedItem = {
  name: string;
  compostable: boolean;
  reason: string;
};

type ModelResult = {
  photo_id: string;
  success: boolean;
  items: DetectedItem[] | null;
  latency_ms: number;
};

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

  // Classification accuracy: of matched items, how many got compostable right?
  const correctClassifications = matched.filter(
    (m) => m.detected.compostable === m.truth.compostable
  ).length;
  const classification_accuracy = matchCount > 0 ? correctClassifications / matchCount : 0;

  // Compostable recall: of all truly compostable items, how many did the model find AND correctly label?
  const trueCompostable = groundTruth.filter((g) => g.compostable);
  const correctlyFoundCompostable = matched.filter(
    (m) => m.truth.compostable && m.detected.compostable
  ).length;
  const compostable_recall = trueCompostable.length > 0
    ? correctlyFoundCompostable / trueCompostable.length
    : 0;

  // Compostable precision: of items the model labeled compostable, how many truly are?
  const detectedCompostable = detected.filter((d) => d.compostable);
  const matchedCompostableCorrect = matched.filter(
    (m) => m.detected.compostable && m.truth.compostable
  ).length;
  const compostable_precision = detectedCompostable.length > 0
    ? matchedCompostableCorrect / detectedCompostable.length
    : 0;

  // Non-compostable recall & precision (same logic, inverted)
  const trueNonCompostable = groundTruth.filter((g) => !g.compostable);
  const correctlyFoundNonCompostable = matched.filter(
    (m) => !m.truth.compostable && !m.detected.compostable
  ).length;
  const non_compostable_recall = trueNonCompostable.length > 0
    ? correctlyFoundNonCompostable / trueNonCompostable.length
    : 0;

  const detectedNonCompostable = detected.filter((d) => !d.compostable);
  const matchedNonCompostableCorrect = matched.filter(
    (m) => !m.detected.compostable && !m.truth.compostable
  ).length;
  const non_compostable_precision = detectedNonCompostable.length > 0
    ? matchedNonCompostableCorrect / detectedNonCompostable.length
    : 0;

  return {
    photo_id: '',
    items_identified,
    classification_accuracy,
    compostable_recall,
    compostable_precision,
    non_compostable_recall,
    non_compostable_precision,
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
        compostable_recall: 0,
        compostable_precision: 0,
        non_compostable_recall: 0,
        non_compostable_precision: 0,
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
    compostable_recall: avg(photoScores.map((s) => s.compostable_recall)),
    compostable_precision: avg(photoScores.map((s) => s.compostable_precision)),
    non_compostable_recall: avg(photoScores.map((s) => s.non_compostable_recall)),
    non_compostable_precision: avg(photoScores.map((s) => s.non_compostable_precision)),
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
    pad('Class Acc', 12) +
    pad('Comp Recall', 13) +
    pad('Comp Prec', 12) +
    pad('NonC Recall', 13) +
    pad('NonC Prec', 12) +
    pad('Avg ms', 10) +
    'Fail%',
  );
  console.log('─'.repeat(96));

  for (const s of scores) {
    console.log(
      pad(s.model, 10) +
      pad(pct(s.items_identified), 12) +
      pad(pct(s.classification_accuracy), 12) +
      pad(pct(s.compostable_recall), 13) +
      pad(pct(s.compostable_precision), 12) +
      pad(pct(s.non_compostable_recall), 13) +
      pad(pct(s.non_compostable_precision), 12) +
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
