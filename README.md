# NYC Waste Classifier

Using computer vision to measure how much of New York City's public waste is actually compostable or recyclable — and using that data to drive smarter infrastructure decisions.

**Live site:** https://compost-waste-identifier.vercel.app

**Eval results:** https://compost-waste-identifier.vercel.app/results

## Overview

A significant portion of public waste in NYC is compostable or recyclable but currently goes to landfill. This project benchmarks vision models (Claude, GPT-4o, Gemini) on their ability to classify waste items per NYC Department of Sanitation rules, with the goal of quantifying the problem and informing interventions like compost/recycling bin placement.

## Getting Started

```bash
npm install
cp .env.example .env  # Add your API keys
```

### Run evals

```bash
npm run eval            # All models
npm run eval:claude     # Single model
npm run eval:gpt4o
npm run eval:gemini
```

### Score results

```bash
npm run score
```

### Run the dashboard locally

```bash
npm run dev
```

## Project Structure

```
├── app/                  # Next.js dashboard
│   ├── page.tsx          # Project overview
│   └── results/page.tsx  # Eval results dashboard
├── scripts/
│   ├── run-image-evals.ts  # Sends photos to vision models
│   └── score-results.ts    # Scores model outputs against ground truth
├── evals/
│   ├── test-set/
│   │   ├── photos/         # Fixture images
│   │   └── labels.json     # Human-labeled ground truth
│   └── results/            # Model outputs and scores
├── waste_sorting_guide.md  # NYC waste sorting rules reference
└── PRD.md                  # Product requirements document
```
