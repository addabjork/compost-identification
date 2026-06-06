/**
 * run-image-evals.ts
 *
 * Sends each photo in evals/test-set/photos/ to 3 vision models and saves raw outputs.
 * Each model classifies items in the image as compostable or not compostable.
 *
 * Usage:
 *   npx ts-node scripts/run-image-evals.ts
 *
 * Optional: run a single model
 *   npx ts-node scripts/run-image-evals.ts --model claude
 *   npx ts-node scripts/run-image-evals.ts --model gpt4o
 *   npx ts-node scripts/run-image-evals.ts --model gemini
 */

import * as fs from 'fs';
import * as path from 'path';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

// ── Paths ────────────────────────────────────────────────────────────────────

const PHOTOS_DIR = path.resolve(__dirname, '../evals/test-set/photos');
const RESULTS_DIR = path.resolve(__dirname, '../evals/results');

// ── Prompt (identical across all models) ─────────────────────────────────────

const PROMPT = `Analyze this photo and identify all visible waste items.

For each item return:
- name: descriptive name of the item (e.g. "banana peel", "plastic water bottle", "coffee grounds")
- compostable: true if the item can go in a home compost bin, false if not
- reason: brief explanation of why it is or isn't compostable

Compostable items include: fruit/vegetable scraps, coffee grounds/filters, tea bags (paper), eggshells, yard waste, paper towels, cardboard (uncoated), leaves, grass clippings, nutshells, wood chips.

NOT compostable items include: plastic, metal, glass, styrofoam, treated/coated paper, meat, dairy, oils/fats, pet waste, diseased plants, synthetic materials.

Return ONLY a valid JSON array, no other text.
Example: [{"name":"banana peel","compostable":true,"reason":"Fruit scraps break down easily in compost"},{"name":"plastic bag","compostable":false,"reason":"Plastic does not biodegrade in a compost bin"}]`;

// ── Types ─────────────────────────────────────────────────────────────────────

type DetectedItem = {
  name: string;
  compostable: boolean;
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMimeType(filePath: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return 'image/webp';
}

function parseJsonItems(text: string): DetectedItem[] | null {
  try {
    const match = text.match(/\[[\s\S]*\]/);
    const raw = match ? match[0] : text;
    return JSON.parse(raw) as DetectedItem[];
  } catch {
    return null;
  }
}

function saveResult(model: string, result: ModelResult) {
  const dir = path.join(RESULTS_DIR, model);
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, `${result.photo_id}.json`);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
}

function getPhotos(): { id: string; file: string; filePath: string }[] {
  return fs
    .readdirSync(PHOTOS_DIR)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .sort()
    .map((file) => ({
      id: path.basename(file, path.extname(file)),
      file,
      filePath: path.join(PHOTOS_DIR, file),
    }));
}

// ── Claude ────────────────────────────────────────────────────────────────────

async function runClaude(photo: { id: string; file: string; filePath: string }): Promise<ModelResult> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const base64 = fs.readFileSync(photo.filePath).toString('base64');
  const mimeType = getMimeType(photo.filePath);
  const start = Date.now();

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });

    const latency_ms = Date.now() - start;
    const raw = message.content[0].type === 'text' ? message.content[0].text : '';
    const items = parseJsonItems(raw);

    return { model: 'claude', photo_id: photo.id, photo_file: photo.file, latency_ms, success: items !== null, items, raw_response: raw, error: null };
  } catch (err) {
    return { model: 'claude', photo_id: photo.id, photo_file: photo.file, latency_ms: Date.now() - start, success: false, items: null, raw_response: null, error: String(err) };
  }
}

// ── GPT-4o ────────────────────────────────────────────────────────────────────

async function runGpt4o(photo: { id: string; file: string; filePath: string }): Promise<ModelResult> {
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const base64 = fs.readFileSync(photo.filePath).toString('base64');
  const mimeType = getMimeType(photo.filePath);
  const start = Date.now();

  try {
    const response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: PROMPT },
          ],
        },
      ],
    });

    const latency_ms = Date.now() - start;
    const raw = response.choices[0]?.message?.content ?? '';
    const items = parseJsonItems(raw);

    return { model: 'gpt4o', photo_id: photo.id, photo_file: photo.file, latency_ms, success: items !== null, items, raw_response: raw, error: null };
  } catch (err) {
    return { model: 'gpt4o', photo_id: photo.id, photo_file: photo.file, latency_ms: Date.now() - start, success: false, items: null, raw_response: null, error: String(err) };
  }
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function runGemini(photo: { id: string; file: string; filePath: string }): Promise<ModelResult> {
  const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
  const model = client.getGenerativeModel({ model: 'gemini-2.5-flash' });
  const base64 = fs.readFileSync(photo.filePath).toString('base64');
  const mimeType = getMimeType(photo.filePath);
  const start = Date.now();

  try {
    const result = await model.generateContent([
      { inlineData: { mimeType, data: base64 } },
      PROMPT,
    ]);

    const latency_ms = Date.now() - start;
    const raw = result.response.text();
    const items = parseJsonItems(raw);

    return { model: 'gemini', photo_id: photo.id, photo_file: photo.file, latency_ms, success: items !== null, items, raw_response: raw, error: null };
  } catch (err) {
    return { model: 'gemini', photo_id: photo.id, photo_file: photo.file, latency_ms: Date.now() - start, success: false, items: null, raw_response: null, error: String(err) };
  }
}

// ── Runner ────────────────────────────────────────────────────────────────────

const ALL_MODELS = ['claude', 'gpt4o', 'gemini'] as const;
type Model = typeof ALL_MODELS[number];

const MODEL_RUNNERS: Record<Model, (photo: { id: string; file: string; filePath: string }) => Promise<ModelResult>> = {
  claude: runClaude,
  gpt4o: runGpt4o,
  gemini: runGemini,
};

async function main() {
  const args = process.argv.slice(2);
  const modelIdx = args.indexOf('--model');
  const modelArg = modelIdx !== -1 ? args[modelIdx + 1] : undefined;
  const modelsToRun: Model[] = modelArg && ALL_MODELS.includes(modelArg as Model)
    ? [modelArg as Model]
    : [...ALL_MODELS];

  const photos = getPhotos();
  if (photos.length === 0) {
    console.error('No photos found in evals/test-set/photos/');
    console.error('Add .jpg, .png, or .webp images to that directory first.');
    process.exit(1);
  }

  console.log(`Found ${photos.length} photos`);
  console.log(`Running models: ${modelsToRun.join(', ')}\n`);

  for (const model of modelsToRun) {
    console.log(`\n── ${model.toUpperCase()} ──────────────────────────`);
    const runner = MODEL_RUNNERS[model];
    let passed = 0;
    let failed = 0;
    let totalLatency = 0;

    for (const photo of photos) {
      process.stdout.write(`  ${photo.id} ... `);
      const result = await runner(photo);
      saveResult(model, result);
      totalLatency += result.latency_ms;

      if (result.success) {
        passed++;
        console.log(`✓ ${result.items?.length ?? 0} items (${result.latency_ms}ms)`);
      } else {
        failed++;
        console.log(`✗ FAILED — ${result.error}`);
      }
    }

    console.log(`\n  Summary: ${passed} passed, ${failed} failed, avg ${Math.round(totalLatency / photos.length)}ms`);
  }

  console.log('\nDone. Results saved to evals/results/');
}

main().catch(console.error);
