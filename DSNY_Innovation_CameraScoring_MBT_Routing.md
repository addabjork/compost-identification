# DSNY Innovation Team — Follow-Up Submission
## Foot-Pedal Bin Camera Scoring + Targeted MBT Routing
**Companion to:** "Monitoring Human Disposal Behavior at Public and Residential Trash Cans"  
**Date:** June 2026

---

## The Core Idea — Restated Precisely

Install a sensor camera inside the hopper (disposal opening) of foot-pedal trash cans to classify each item as it is dropped in, build a per-bin "% compostable" score in real time, and use that score to dynamically route high-scoring bins to a Mechanical Biological Treatment (MBT) facility rather than a landfill — deploying dedicated DSNY trucks to only those bins.

This document evaluates that idea component by component: the camera system, the bin hardware, the scoring logic, the routing logistics, and the MBT endpoint.

---

## Section 1: Framing — Why This Matters

The user's underlying argument deserves direct validation before getting into technical constraints:

**The argument is correct.** Expecting consumer-driven source-separation to close the gap between 75% divertable waste and 20% actual diversion is both unrealistic at scale and arguably inequitable. Education campaigns and fines move behavior at the margins, but the structural reality of a 44-million-pound-per-day city is that a meaningful fraction of compostable material will always enter the refuse stream through public litter baskets — where compost separation is neither required nor operationally possible for pedestrians. Technology that removes the burden of sorting from the human and places it in the collection infrastructure is the right long-term direction. This aligns with how the best-performing countries (South Korea, with a 95% food waste capture rate) approach it: financial structure and infrastructure, not appeals to behavior.

The specific innovation proposed here — a camera score at the bin level, feeding a routing decision — is genuinely novel in the municipal context and worth rigorous examination.

---

## Section 2: The Bin Hardware — Clarifying What Exists in NYC Today

### What's in Times Square

The foot-pedal bins in Times Square are predominantly **BigBelly Smart Max (HC5) units**, operated by the Times Square Business Improvement District (BID), not directly by DSNY. BigBelly is already a "smart" IoT platform: the bins transmit fill-level data, GPS location, collection activity logs, and bin status to BigBelly's CLEAN Management Console in real time. DSNY separately manages approximately 23,000+ street litter baskets citywide, which as of fall 2023 are being replaced with the new **"Better Bin"** (designed by Group Project, named TIME's Best Invention of 2023).

These are two distinct bin types with different relevance to this proposal:

| Feature | BigBelly HC5 (Times Square BIDs) | Better Bin (DSNY standard) |
|---|---|---|
| Foot pedal | Yes (available option) | No — hinged split lid |
| Internal compactor | **Yes — solar powered, 5–10× capacity** | No |
| IoT connectivity | Yes — CLEAN Console, fill level, GPS | No — no electronics currently |
| Operated by | BID / private | DSNY directly |
| Count in NYC | ~Hundreds in BID zones | 23,000+ citywide (rolling out) |
| Liner/bag removable? | Yes — internal bin liner | Yes — internal liner bag |

The **compactor in the BigBelly is the first critical constraint** for this proposal, and it needs to be addressed head-on.

---

## Section 3: The Compaction Problem — and How to Think Around It

### Why It Matters

The BigBelly HC5 uses a solar-powered compaction ram to crush waste periodically throughout the day — that's the whole point of the product, achieving 5–10× standard bin capacity. By the time a sanitation worker arrives to empty a BigBelly, its contents are a compressed, mixed block of waste. Even if your camera scored the bin at 80% compostable over 200 disposal events, the physical contents at collection time cannot be easily routed to a different stream — they've been mechanically compacted into a single mass together.

This does not kill the idea. It reshapes it in two ways:

**Option A — Score for Data Only (at BigBelly bins)**

The camera at the hopper captures every item at the moment of entry — before compaction. The score is accurate. But because the contents can't be cleanly separated at collection, the score is used for **zone-level routing decisions, not bin-level routing**. If BigBelly cameras in a corridor (say, 7th Avenue between 42nd and 50th Street) consistently show 65%+ compostable content, DSNY can establish a dedicated organics collection truck for that zone, routing an entire zone's waste to MBT instead of landfill. The bin-level score becomes an area-level intelligence tool.

**Option B — Apply the Idea to Better Bins, Not BigBellys**

The more surgically correct bin for the bin-level routing concept is the **new DSNY Better Bin**, which has no compactor. The contents remain uncompacted in a removable liner bag. A sanitation worker who sees (via a simple indicator light or app notification) that a bin scored above a compostability threshold could pull that liner into a dedicated organics collection vehicle rather than the regular refuse truck. This is physically possible in a way that BigBelly routing is not, because the material hasn't been mechanically mixed and compacted.

**The recommendation is to pursue Option B as the pilot target.** The Better Bin is DSNY-owned, being rolled out citywide, and has no electronics currently — meaning there is a genuine design-stage opportunity to embed a camera module into new units before they're manufactured at scale.

---

## Section 4: The Camera System — Technical Feasibility

### Placement

The optimal camera placement is at the **top of the bin's chute or disposal opening**, facing downward, capturing each item as it passes through the entry point. This is a well-established position in smart bin prototypes. The camera does not need to see inside the bin after disposal — it captures the item in free fall through the opening, which is the clearest and most controllable imaging moment.

### Lighting

The interior of a bin opening is dark. Viable solutions:
- An infrared (IR) LED ring around the camera lens, which illuminates the item without visible light (non-intrusive for pedestrians)
- A brief passive IR trigger: the foot pedal activates the IR flash simultaneously with the lid opening
- Edge cases (large, opaque bags) will reduce confidence scores rather than produce false positives if the model is calibrated correctly

### AI Classification Accuracy

In controlled laboratory conditions, current CNN and EfficientNet models for waste classification achieve **87–96% accuracy** on categorized single-item datasets. Real-world public trash conditions are significantly harder:

- Items are often inside wrappers, cups, or bags (obscured classification)
- Items are combined (a pizza box with a plastic straw inside it)
- Lighting and camera angle vary with disposal motion
- Vandalism, water, and grease can obscure the lens

A more realistic operational accuracy for the "compostable vs. non-compostable" binary classification (a simpler problem than full material identification) in real-world public bin conditions is **70–80%**, consistent with early-stage deployed systems like Rematics' truck-mounted camera, which achieved 70%+ accuracy on plastic identification in 2024 and is targeting 90%. The binary question ("is this item primarily organic/food?") is meaningfully simpler than full material speciation.

For the specific use case — generating a **bin-level composability score across hundreds of disposal events** — individual classification errors average out substantially. A bin with 200 foot-pedal events per day where the model correctly classifies 75% of items still produces a reliable aggregate signal. You are not making routing decisions based on any single classification; you are making them based on the distribution across a collection cycle.

### What the Camera Can Reliably Identify

| Item Type | Expected Accuracy | Notes |
|---|---|---|
| Obvious food waste (banana peel, apple core, unwrapped food) | High (85–90%) | Best case |
| Food in clear wrappers (sandwich wrap, salad clamshell) | Moderate (70–80%) | Wrapping partially obscures |
| Coffee cups (compostable paper content, plastic lid) | Moderate (65–75%) | Composite item |
| Opaque plastic bags with unknown content | Low (35–50%) | Cannot classify interior |
| Dry recyclables (plastic bottles, cans) | High (80–90%) | Distinctive visual profile |
| Paper and cardboard | High (85–90%) | Distinctive visual profile |

**The primary weakness:** items placed inside opaque black or white plastic bags, which are common in high-misuse zones where residents are illegally disposing of household trash in litter baskets. This is actually an opportunity: a high rate of opaque-bag events is itself a signal of basket misuse, which is a separate but related DSNY intelligence interest.

---

## Section 5: The Scoring System — How to Build It

Each foot-pedal event triggers the camera. The model returns a classification (food organic, compostable paper, dry recyclable, non-compostable, or unclassified). The bin's running score is:

```
Compostability Score = (Compostable Events / Classifiable Events) × 100%
```

This score is continuously updated and transmitted to DSNY's collection routing system (which could be integrated with or built alongside BigBelly's existing CLEAN Console infrastructure). The score resets after each collection event.

**Routing Threshold Logic (proposed):**

A bin's score is evaluated at the time of a "ready to collect" signal (fullness trigger or scheduled pickup):

- Score ≥ 60% compostable → flag for MBT/organics route
- Score 30–60% compostable → standard refuse route
- Score ≥ 70% unclassifiable (opaque bags) → flag for potential household misuse investigation

The 60% threshold is a policy parameter, not a technical constraint, and should be set based on what MBT facilities can process cost-effectively given contamination levels.

---

## Section 6: Routing Logistics — The Hardest Part

### The Current State

DSNY currently routes litter basket collection trucks along fixed geographic routes. A truck services dozens of baskets per shift along a defined corridor. There is no dynamic, bin-level routing logic today — collection is scheduled by frequency (baskets are emptied between twice per week and three times per day depending on location), not by real-time content.

Selective bin-level routing — one truck for regular refuse, one truck for high-compostable bins — introduces significant operational complexity:

**Challenges:**

- A dedicated organics collection truck would need to cover a non-contiguous set of bins (wherever the score exceeds the threshold) rather than a geographic route, making collection inefficient
- If high-compostable bins cluster geographically (as they likely would — food-dense areas like Midtown, Times Square, and the tourist corridors near transit hubs would score higher than residential quiet blocks), then zone-level routing is workable
- Sanitation workers on regular routes would need to be equipped with a mobile interface showing which bins to divert — a change to operational workflow that requires union negotiation and training
- BigBelly bins specifically: as noted above, the compacted liner content cannot be practically sorted by destination truck at the time of collection without bin-level routing infrastructure

**What Viable Looks Like:**

The most operationally realistic implementation is **not single-bin routing but zone-level dedicated organics collection**, structured as follows:

1. Camera data from all scored bins in a zone accumulates over 2–4 weeks
2. DSNY identifies "high-compostable zones" — geographic clusters where aggregate composability consistently exceeds the threshold
3. In those zones, DSNY establishes a **dedicated organics collection route** that runs alongside or replaces the standard refuse truck
4. All bins in the zone go to MBT, not just individual high-scoring bins
5. Zone boundaries are reviewed quarterly as scores evolve seasonally

This is closer to how municipal composting zones work in San Francisco and Seattle — the geography changes over time, but within a defined area the collection infrastructure is consistent. The scoring system provides the data to make those zone definitions evidence-based rather than politically or arbitrarily determined.

---

## Section 7: The MBT Endpoint — Infrastructure Realities

### NYC Has No MBT Facilities

This is the largest structural gap in the proposal. NYC currently has no operational MBT facility and no announced plans to build one. All refuse collected by DSNY is sent to transfer stations and then transported out of state to landfills or waste-to-energy facilities. To execute the full vision of this proposal, NYC would need to either:

- **Build or contract an MBT facility** — capital costs typically range from $150–$300 per ton per year of processing capacity for aerobic MBT. A facility capable of handling even a fraction of NYC's 44 million pounds/day of refuse would represent hundreds of millions of dollars in capital investment
- **Contract with an existing regional facility** — there are MBT facilities in other parts of New York State and the Northeast; DSNY could potentially contract for organic fraction processing without building its own facility
- **Use the existing Newtown Creek Anaerobic Digestion infrastructure** — Newtown Creek already processes organic material from the composting stream via anaerobic digestion, producing biogas. With modification, it could potentially accept MBT-processed organic fraction, avoiding the need for a greenfield facility

### MBT Compost Quality Caveat

One honest limitation of the MBT approach that should be included in any DSNY proposal: **compost produced from mixed municipal waste via MBT is generally lower quality than source-separated compost**, due to residual contamination (microplastics, heavy metals from mixed waste contact). In Germany, MBT compost is not permitted for agricultural application. This means the output of an MBT process fed by litter basket waste would likely be usable as landfill cover or low-grade soil amendment, not as the nutrient-rich soil product from source-separated composting. The environmental benefit (methane reduction by keeping organics out of landfill) is real, but the value of the compost product is lower.

This does not invalidate the approach for litter baskets specifically — because litter baskets are never going to achieve source-separation of compostable material under any realistic policy scenario. MBT is genuinely the appropriate secondary intervention for this stream.

---

## Section 8: A Phased Roadmap

Given these constraints, a phased approach is recommended:

### Phase 1 — Data Collection Only (Year 1–2)
**Goal:** Validate the camera scoring system and build the dataset  
**Scope:** Pilot 50–100 non-compacting bins (Better Bins) in 3 high-foot-traffic zones (e.g., Times Square/Midtown, Downtown Brooklyn, Jamaica Queens)  
**Action:** Retrofit camera modules into hopper openings. Log disposal events, classifications, and bin scores. No routing changes yet.  
**Output:** A validated composability score map across pilot zones; AI model calibration for NYC-specific waste items; baseline data on seasonal and time-of-day patterns  
**Cost:** Low-moderate (hardware + software, no infrastructure change)

### Phase 2 — Zone Identification and Routing Pilot (Year 2–3)
**Goal:** Test dedicated organics routing in highest-scoring zone  
**Scope:** One or two identified "high-compostable zones" where camera data consistently shows 60%+ compostable content  
**Action:** Run a parallel organics collection truck in those zones. All bins in zone go to a transfer station designated for MBT-bound material (contracted externally or processed at Newtown Creek)  
**Output:** Diversion tonnage from the pilot zone; cost-per-diverted-ton analysis; worker feedback on operational workflow  
**Cost:** Moderate (additional truck shifts, contract processing costs)

### Phase 3 — Infrastructure and Scale (Year 3–5)
**Goal:** Make the case for MBT infrastructure investment and citywide rollout  
**Scope:** Dependent on Phase 2 outcomes  
**Action:** If the economics are favorable — i.e., the cost of MBT-route collection is competitive with the existing cost of refuse collection plus out-of-state landfill tipping fees — begin embedding camera modules into all new Better Bin manufacturing runs and propose MBT facility contracting or co-investment  
**Cost:** High capital, but potentially offset by reduced landfill tipping fees and recovered material value

---

## Section 9: What Makes This Proposal Distinctly Valuable

Most smart-bin innovation focuses on fill-level monitoring for route optimization (BigBelly's existing value proposition). This proposal goes one level deeper: **classifying content, not just volume**. That distinction is significant:

- Fill-level monitoring answers "when to collect." Content scoring answers "where to send it."
- No major US city currently has a real-time, per-bin content scoring system feeding routing decisions
- The litter basket stream is the least-served by existing composting programs — residents can compost at home, businesses have mandated commercial composting, but street-use waste has no current pathway to diversion
- The proposal converts a currently 100%-to-landfill stream into a potentially 30–50% divertable stream in high-compostable zones, without any consumer behavior change required

---

## Summary: What's Real, What Needs Work

| Component | Feasibility | Key Issue |
|---|---|---|
| Camera at disposal opening | **High** | Lighting, obscured items; solvable with IR and model calibration |
| AI composability score per bin | **High** | Accuracy ~70–80% at item level; reliable at bin aggregate level |
| Routing decision from bin score | **Moderate** | Zone-level routing is realistic; individual-bin selective pickup is not |
| BigBelly as the pilot platform | **Low** | Compaction mixes contents before collection |
| Better Bin as the pilot platform | **Higher** | No compactor; DSNY-owned; design window is now |
| MBT endpoint infrastructure | **Low (currently)** | No NYC facility exists; requires capital investment or external contract |
| Compost quality from mixed stream | **Moderate** | Output is lower-grade than source-separated; suitable for landfill cover, not agriculture |
| Operational routing workflow change | **Moderate** | Requires union collaboration and mobile interface for workers |

---

*The central idea — a camera score at the bin level feeding a differential routing decision — is technically sound, operationally novel, and fills a genuine gap in NYC's waste diversion toolkit. The main work is in the backend: routing logistics and MBT infrastructure, both of which are solvable at the policy and capital level if the Phase 1 data makes the case.*
