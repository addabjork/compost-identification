# Product Requirements Document: NYC Compost & Recycling Waste Identifier

## Problem Statement

A significant portion of public waste in New York City is compostable or recyclable but is currently treated as general landfill trash. There is no systematic way to measure how much recoverable material flows through the city's public trash cans, and no data-driven mechanism to inform interventions — whether that's bin placement, sorting infrastructure, or policy changes.

## Vision

Build a computer vision system that quantifies the proportion of compostable and recyclable material in NYC's public waste stream, and use that data to recommend and prioritize interventions that divert waste from landfill.

## Goals

1. **Measure the problem** — Determine what percentage of public trash is actually compostable or recyclable, broken down by location, time of day, and neighborhood.
2. **Inform interventions** — Use the data to recommend specific actions based on the severity of the problem (e.g., compost bin placement, recycling bin placement, industrial sorting upgrades, policy changes).
3. **Enable real-time classification** — Eventually deploy in-bin cameras that classify waste as it enters public trash cans.

## Users

| User | Need |
|------|------|
| NYC Department of Sanitation | Data on waste composition to inform infrastructure decisions |
| City planners | Location-based insights for bin placement and waste diversion programs |
| Sustainability researchers | Quantified baseline of recoverable waste in the public stream |
| Hardware/operations team | Reliable classification API to integrate with in-bin camera hardware |

## System Overview

The system has three layers, built in phases:

```
Phase 1: Eval & Model Selection (current)
  Fixture images --> [Claude / GPT-4o / Gemini] --> Classification results --> Scoring dashboard

Phase 2: Data Collection Pipeline
  In-field photos --> Upload API --> Classification --> Database --> Analytics dashboard

Phase 3: In-Bin Hardware
  Camera module --> Edge capture --> Server classification --> Real-time reporting
```

## Phase 1: Model Evaluation (Current Phase)

### What we're building

An eval suite that benchmarks vision models on their ability to identify and classify items in waste images as compostable, recyclable, or landfill.

### Requirements

- **Eval runner**: Send fixture images to Claude, GPT-4o, and Gemini with an identical prompt. Record raw responses, parsed items, latency, and success/failure.
- **Scoring engine**: Compare model outputs against human-labeled ground truth. Compute classification accuracy and per-category (compostable, recyclable, landfill) recall and precision.
- **Results dashboard**: Next.js app deployed on Vercel showing model comparison tables, per-photo breakdowns, and summary metrics. Accessible to the full team.
- **Fixture set**: Curated set of photos of NYC public trash cans with human-labeled ground truth for each visible item.

### Classification taxonomy

Each item detected should be classified into one of three categories:

| Category | Examples | Classification |
|----------|----------|---------------|
| Food scraps | Banana peel, apple core, coffee grounds | Compostable |
| Yard/plant waste | Leaves, grass, flowers | Compostable |
| Uncoated paper | Paper towels, napkins, newspaper | Compostable |
| Natural materials | Eggshells, nutshells, wood chips | Compostable |
| Cardboard | Boxes, tubes, shipping material | Recyclable |
| Plastic bottles/containers | Water bottles, soda bottles, detergent bottles | Recyclable |
| Metal | Aluminum cans, tin cans, foil trays | Recyclable |
| Glass | Bottles, jars | Recyclable |
| Paper (clean) | Office paper, magazines, mail | Recyclable |
| Plastic bags/film | Grocery bags, shrink wrap | Landfill |
| Styrofoam | Containers, cups, packing peanuts | Landfill |
| Coated/treated paper | Waxed cups, grease-soaked paper | Landfill |
| Synthetic materials | Clothing, rubber, electronics | Landfill |
| Mixed/contaminated items | Food-soiled plastic, greasy pizza box | Landfill |
| Plastic utensils/straws | Forks, knives, straws, stirrers | Landfill |

### Success criteria for Phase 1

- At least 20 labeled fixture images covering diverse waste compositions
- All three models evaluated and scored
- Dashboard live and shareable
- Clear recommendation on which model to use going forward

## Phase 2: Data Collection Pipeline (Next)

### What we're building

A system for field teams to photograph public trash cans across NYC, upload images, and accumulate classified waste data at scale.

### Requirements

- **Upload API**: Accept geotagged photos from mobile devices. Store images with location metadata (lat/lng, nearest intersection, neighborhood, borough).
- **Classification pipeline**: Run the selected model on each uploaded image. Store structured results (items detected, category, confidence).
- **Analytics dashboard**: Aggregate views showing:
  - Compostable/recyclable/landfill percentage by location
  - Heat map of waste composition across the city
  - Time-of-day and day-of-week patterns
  - Ranking of locations by diversion opportunity
- **Intervention recommendations**: Based on configurable thresholds:
  - \>30% compostable at a location --> recommend compost bin placement
  - \>40% recyclable at a location --> recommend recycling bin placement
  - \>60% recoverable (compostable + recyclable) city-wide --> recommend industrial sorting investment

### Data model

```
Photo
  - id
  - image_url
  - lat, lng
  - neighborhood
  - borough
  - captured_at
  - uploaded_at

ClassificationResult
  - id
  - photo_id
  - model_used
  - items: [{ name, category, confidence }]
  - compostable_pct
  - recyclable_pct
  - landfill_pct
  - processed_at

Location
  - id
  - lat, lng
  - address
  - neighborhood
  - borough
  - avg_compostable_pct
  - avg_recyclable_pct
  - avg_landfill_pct
  - sample_count
  - last_sampled_at
```

## Phase 3: In-Bin Hardware (Future)

### What we're building

A camera module that mounts inside or above public trash cans, captures images of waste as it's deposited, and sends them to the classification server.

### Requirements

- **Hardware**: Weatherproof camera module with cellular or WiFi connectivity. Battery or solar powered. Compact enough to retrofit into existing city trash cans.
- **Edge capture**: Triggered by motion or lid opening. Captures image, uploads to server.
- **Real-time classification**: Server processes image and logs results. Sub-5-second turnaround.
- **Alerting**: Notify operations when a bin is full or when waste composition at a location shifts significantly.

### Potential applications beyond measurement

- **Smart bin signage**: Dynamic displays on bins showing "This bin is for compost" when the system detects high compostable rates at that location.
- **Robotic sorting integration**: Feed classification data to sorting robots at transfer stations to improve diversion rates.
- **Citizen engagement**: Public-facing dashboard or app showing neighborhood waste stats and diversion progress.

## Technical Stack

| Component | Technology |
|-----------|-----------|
| Eval scripts | TypeScript, ts-node |
| Vision models | Claude Sonnet, GPT-4o, Gemini Flash |
| Dashboard | Next.js, Tailwind CSS |
| Hosting | Vercel |
| Data storage (Phase 2) | TBD (Postgres via Vercel Marketplace) |
| Image storage (Phase 2) | TBD (Vercel Blob or S3) |
| Hardware (Phase 3) | TBD |

## Open Questions

1. What is the minimum number of samples per location needed to make a reliable recommendation?
2. What is the target cost per classification call, and does that affect model selection?
3. For Phase 3, what is the power budget and connectivity profile for in-bin hardware?
4. Who owns the relationship with NYC Sanitation / city government for data sharing and bin placement authority?
5. Should recyclable sub-categories (plastic, metal, glass, paper) be tracked separately to inform single-stream vs multi-stream recycling recommendations?

## Timeline

| Phase | Milestone | Status |
|-------|-----------|--------|
| 1 | Eval suite built | Done |
| 1 | Fixture photos labeled | In progress |
| 1 | Models evaluated and scored | Not started |
| 1 | Dashboard live on Vercel | Done |
| 1 | Model recommendation | Not started |
| 2 | Upload API + classification pipeline | Not started |
| 2 | Analytics dashboard with location data | Not started |
| 2 | Field data collection (pilot neighborhoods) | Not started |
| 3 | Hardware prototype | Not started |
| 3 | Pilot deployment in bins | Not started |
