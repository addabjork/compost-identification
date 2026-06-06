import Image from "next/image";
import Link from "next/link";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-2xl font-bold tracking-tight text-white">
      {children}
    </h2>
  );
}

function StatCard({
  value,
  label,
  source,
}: {
  value: string;
  label: string;
  source: string;
}) {
  return (
    <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-5">
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="mt-1 text-sm text-gray-300">{label}</p>
      <p className="mt-2 text-xs text-gray-500">{source}</p>
    </div>
  );
}

function PhaseCard({
  phase,
  title,
  status,
  children,
}: {
  phase: string;
  title: string;
  status: "current" | "next" | "future";
  children: React.ReactNode;
}) {
  const statusColors = {
    current: "border-green-500/50 bg-green-950/20",
    next: "border-blue-500/50 bg-blue-950/20",
    future: "border-gray-700 bg-gray-900/50",
  };
  const statusLabels = {
    current: "In Progress",
    next: "Up Next",
    future: "Future",
  };
  const statusBadgeColors = {
    current: "bg-green-500/20 text-green-400",
    next: "bg-blue-500/20 text-blue-400",
    future: "bg-gray-700 text-gray-400",
  };

  return (
    <div className={`rounded-xl border p-6 ${statusColors[status]}`}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-400">{phase}</span>
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeColors[status]}`}
        >
          {statusLabels[status]}
        </span>
      </div>
      <h3 className="mb-3 text-lg font-semibold text-white">{title}</h3>
      <div className="text-sm leading-relaxed text-gray-300">{children}</div>
    </div>
  );
}

function TaxonomyRow({
  category,
  examples,
  color,
}: {
  category: string;
  examples: string;
  color: "green" | "blue" | "gray";
}) {
  const colors = {
    green: "text-green-400",
    blue: "text-blue-400",
    gray: "text-gray-400",
  };
  return (
    <tr className="border-b border-gray-800/50">
      <td className={`px-4 py-3 font-medium ${colors[color]}`}>{category}</td>
      <td className="px-4 py-3 text-gray-300">{examples}</td>
    </tr>
  );
}

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      {/* Hero */}
      <div className="mb-16">
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          NYC Waste Classifier
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-gray-400">
          Using computer vision to measure how much of New York City&apos;s
          public waste is actually compostable or recyclable — and using that
          data to drive smarter infrastructure decisions.
        </p>
        <div className="mt-6 flex gap-4">
          <Link
            href="/results"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors"
          >
            View Eval Results
          </Link>
          <a
            href="https://github.com/addabjork/compost-identification"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-300 hover:border-gray-500 transition-colors"
          >
            GitHub
          </a>
        </div>
      </div>

      {/* Problem — backed by DSNY data */}
      <section className="mb-16">
        <SectionHeading>The Problem</SectionHeading>
        <p className="max-w-3xl leading-relaxed text-gray-300">
          NYC operates a source-separation model — residents are required to
          separate compost before pickup. But material placed in regular trash
          bins and public litter baskets goes directly to landfill or
          incineration with no recovery step. There is no real-time data on what
          is actually being thrown away, and no mechanism to identify which
          locations have the highest diversion opportunity.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            value="75%"
            label="of NYC residential waste is divertable from landfill"
            source="DSNY 2023 Waste Characterization Study"
          />
          <StatCard
            value="20%"
            label="actual diversion rate — the rest goes to landfill"
            source="DSNY 2023 Annual Report"
          />
          <StatCard
            value="~4%"
            label="of compostable organics captured in Queens pilot"
            source="Academic analysis of Queens curbside trial"
          />
          <StatCard
            value="23,000+"
            label="public litter baskets with zero compost pathway"
            source="NYC Open Data — DSNY Litter Basket Locations"
          />
        </div>

        <p className="mt-6 text-sm leading-relaxed text-gray-400">
          DSNY&apos;s 2017 study found that over 40% of citywide refuse was
          compostable organics. In Queens specifically, almost 47% of refuse was
          compostable — before adding recyclable paper and packaging. The 2023
          study confirmed that 75% of residential waste consists of materials
          that could be diverted through existing programs. The gap between
          what&apos;s divertable and what&apos;s actually diverted is
          fundamentally a behavioral and infrastructure problem, not a knowledge
          problem.
        </p>
      </section>

      {/* Research & Context */}
      <section className="mb-16">
        <SectionHeading>Research & Context</SectionHeading>

        <div className="space-y-6">
          {/* Source separation */}
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-base font-semibold text-white">
              NYC&apos;s Source-Separation Model
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">
              Since October 2024, citywide curbside composting is mandatory for
              all NYC residents, with fines since April 2025. DSNY collects
              organics as a distinct stream and processes them at facilities like
              the Staten Island Compost Facility and Newtown Creek (anaerobic
              digestion into biogas). But material in regular trash bins — and
              all 23,000+ public litter baskets — bypasses this entirely and
              goes straight to out-of-state landfills. NYC does not operate any
              Mechanical Biological Treatment (MBT) facility to recover organics
              from mixed refuse after collection.
            </p>
          </div>

          {/* Case studies */}
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-base font-semibold text-white">
              How Other Cities Compare
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-gray-700 p-4">
                <p className="text-2xl font-bold text-green-400">80%</p>
                <p className="mt-1 text-sm font-medium text-white">
                  San Francisco
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Mandatory three-stream collection since 2009. 14+ years of
                  enforcement to reach this diversion rate. Restaurants recover
                  over 90% of discardable materials.
                </p>
              </div>
              <div className="rounded-lg border border-gray-700 p-4">
                <p className="text-2xl font-bold text-green-400">95%</p>
                <p className="mt-1 text-sm font-medium text-white">
                  South Korea
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Global gold standard. Volume-based waste fee, landfill ban on
                  food waste since 2005, weight-based food waste fee since 2013.
                  Food waste processed into biogas, compost, and animal feed.
                </p>
              </div>
              <div className="rounded-lg border border-gray-700 p-4">
                <p className="text-2xl font-bold text-red-400">20%</p>
                <p className="mt-1 text-sm font-medium text-white">
                  New York City
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  Mandatory composting since Oct 2024. Early compliance data
                  shows only ~4% organics capture. NYC is approximately where
                  San Francisco was in 2010.
                </p>
              </div>
            </div>
          </div>

          {/* The litter basket gap */}
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-base font-semibold text-white">
              The Litter Basket Opportunity
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">
              NYC&apos;s 23,000+ street litter baskets (now being replaced with
              the &ldquo;Better Bin,&rdquo; named TIME&apos;s Best Invention of
              2023) are legally designated for pedestrian on-the-go waste only —
              not household trash, and explicitly not compost. Yet they are
              routinely misused. The 2023 Waste Characterization Study found
              significant food content from takeout and convenience purchases.
              This stream has no current pathway to diversion — it all goes to
              landfill.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-gray-300">
              Residents can compost at home. Businesses have mandated commercial
              composting. But street-use waste has no current pathway to
              diversion. Camera-based classification at the bin level could
              convert this 100%-to-landfill stream into a potentially 30-50%
              divertable stream in high-compostable zones, without any consumer
              behavior change required.
            </p>
          </div>

          {/* Data gap */}
          <div className="rounded-lg border border-amber-500/20 bg-amber-950/10 p-6">
            <h3 className="text-base font-semibold text-amber-400">
              The Data Gap We&apos;re Filling
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">
              DSNY publishes monthly tonnage data by community district and
              periodic Waste Characterization Studies (sampled from truck loads
              at transfer stations). But none of the current datasets capture
              real-time disposal behavior — what specific items are being placed
              into specific trash cans, by whom, and at what time. This is the
              gap our system addresses: continuous, per-bin content
              classification that enables evidence-based zone routing and
              intervention targeting.
            </p>
          </div>
        </div>
      </section>

      {/* Approach - Three Phases */}
      <section className="mb-16">
        <SectionHeading>Approach</SectionHeading>
        <div className="grid gap-6 sm:grid-cols-3">
          <PhaseCard phase="Phase 1" title="Model Evaluation" status="current">
            <p>
              Benchmark Claude, GPT-4o, and Gemini on their ability to classify
              waste items as compostable, recyclable, or landfill using NYC
              rules. Build a scoring dashboard to compare accuracy across item
              identification, category classification, and percentage
              distribution.
            </p>
          </PhaseCard>
          <PhaseCard
            phase="Phase 2"
            title="Zone Scoring & Routing Pilot"
            status="next"
          >
            <p>
              Deploy camera modules in 50-100 Better Bins across 3 high-traffic
              zones (Midtown, Downtown Brooklyn, Jamaica Queens). Build per-bin
              composability scores. Identify &ldquo;high-compostable
              zones&rdquo; where aggregate scores consistently exceed 60%. Test
              dedicated organics collection trucks in those zones.
            </p>
          </PhaseCard>
          <PhaseCard
            phase="Phase 3"
            title="Infrastructure & Scale"
            status="future"
          >
            <p>
              Embed camera modules into all new Better Bin manufacturing runs.
              Establish zone-level MBT routing where bins scoring above
              threshold feed into organics processing at Newtown Creek or a
              contracted MBT facility. Target: convert a 100%-to-landfill stream
              into 30-50% divertable in high-compostable zones.
            </p>
          </PhaseCard>
        </div>
      </section>

      {/* Why Better Bin, not BigBelly */}
      <section className="mb-16">
        <SectionHeading>Target Platform: The Better Bin</SectionHeading>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-green-500/30 bg-green-950/10 p-6">
            <h3 className="text-base font-semibold text-green-400">
              DSNY Better Bin
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              <li>No compactor — contents remain separable</li>
              <li>DSNY-owned, rolling out citywide (23,000+ units)</li>
              <li>No electronics currently — design window is now</li>
              <li>Removable liner enables bin-level routing</li>
              <li>
                A worker seeing a high-score indicator can pull the liner into an
                organics truck
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-red-500/30 bg-red-950/10 p-6">
            <h3 className="text-base font-semibold text-red-400">
              BigBelly HC5 (Not Recommended)
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              <li>
                Solar-powered compactor crushes waste into mixed blocks — can&apos;t
                separate at collection
              </li>
              <li>Operated by BIDs, not DSNY directly</li>
              <li>Only hundreds in BID zones vs. 23,000+ Better Bins</li>
              <li>
                Camera data still useful for zone-level intelligence, but
                bin-level routing is not possible
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Hardware */}
      <section className="mb-16">
        <SectionHeading>Hardware Design Proposal</SectionHeading>
        <div className="grid items-center gap-8 sm:grid-cols-2">
          <div>
            <p className="leading-relaxed text-gray-300">
              A proposed design for a compact, IP67-rated camera module that
              mounts at the disposal opening of Better Bins, capturing each item
              as it passes through the entry point. Uses IR illumination for
              consistent imaging regardless of ambient light. The camera
              classifies items on-device or uploads to a server for
              classification, building a per-bin composability score in real
              time.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>IP67 waterproof enclosure with polycarbonate lens window</li>
              <li>IR LED ring for low-light capture at disposal opening</li>
              <li>LTE-M / NB-IoT cellular connectivity</li>
              <li>3.7V Li-Ion battery with BMS + buck converter</li>
              <li>Optional Google Coral TPU for edge inference</li>
              <li>Tool-less clamp mounting system</li>
            </ul>
          </div>
          <div className="overflow-hidden rounded-xl border border-gray-800 bg-gray-900">
            <Image
              src="/trashcan_compost_camera_files/trashcan_compost_camera_VISUAL.png"
              alt="Camera module prototype — compact cylindrical enclosure with lens and Raspberry Pi board visible in cutaway view"
              width={800}
              height={500}
              className="w-full object-cover"
            />
          </div>
        </div>

        {/* Key components */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              name: "Raspberry Pi Zero 2 W",
              role: "Main controller",
              detail: "Image capture, ML inference, modem control",
              cost: "$15",
            },
            {
              name: "Pi Camera Module V2",
              role: "8MP camera sensor",
              detail: "IMX219 sensor, CSI-2 interface",
              cost: "$29",
            },
            {
              name: "Adafruit FONA 4G",
              role: "Cellular modem",
              detail: "LTE-M/NB-IoT for remote data transmission",
              cost: "$50",
            },
            {
              name: "Google Coral USB",
              role: "AI accelerator (optional)",
              detail: "Edge TPU for on-device inference",
              cost: "$60",
            },
            {
              name: "18650 Li-Ion Battery",
              role: "Power source",
              detail: "3.7V 2-cell with TP4056 BMS",
              cost: "$17",
            },
            {
              name: "IP67 Enclosure",
              role: "Weatherproof housing",
              detail: "EPDM gasket, M3 sealed lid, clamp mount",
              cost: "$25",
            },
          ].map((part) => (
            <div
              key={part.name}
              className="rounded-lg border border-gray-800 bg-gray-900/50 p-4"
            >
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-medium text-white">{part.name}</p>
                <span className="text-xs text-gray-500">{part.cost}</span>
              </div>
              <p className="mt-1 text-xs text-gray-400">{part.role}</p>
              <p className="mt-0.5 text-xs text-gray-500">{part.detail}</p>
            </div>
          ))}
        </div>

        <p className="mt-4 text-sm text-gray-500">
          Estimated total BOM: ~$220 per unit.{" "}
          <a
            href="/trashcan_compost_camera_files/trashcan_compost_camera_GUIDE.md"
            className="text-gray-400 underline hover:text-gray-300"
          >
            Full assembly guide
          </a>{" "}
          |{" "}
          <a
            href="/trashcan_compost_camera_files/trashcan_compost_camera_PARTS.csv"
            className="text-gray-400 underline hover:text-gray-300"
          >
            Parts list (CSV)
          </a>
        </p>
      </section>

      {/* Expected AI accuracy */}
      <section className="mb-16">
        <SectionHeading>Expected Classification Accuracy</SectionHeading>
        <p className="mb-6 text-sm text-gray-400">
          Based on current CNN/EfficientNet benchmarks and early deployed systems
          like Rematics&apos; truck-mounted camera (70%+ on plastics in 2024).
          Real-world public bin conditions are harder than lab conditions due to
          wrappers, combined items, and lighting variation.
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Item Type</th>
                <th className="px-4 py-3">Expected Accuracy</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  item: "Obvious food waste (banana peel, apple core)",
                  accuracy: "85-90%",
                  note: "Best case — distinctive visual profile",
                },
                {
                  item: "Food in clear wrappers (sandwich, salad clamshell)",
                  accuracy: "70-80%",
                  note: "Wrapping partially obscures",
                },
                {
                  item: "Coffee cups (paper body, plastic lid)",
                  accuracy: "65-75%",
                  note: "Composite item",
                },
                {
                  item: "Dry recyclables (bottles, cans)",
                  accuracy: "80-90%",
                  note: "Distinctive shape and material",
                },
                {
                  item: "Paper and cardboard",
                  accuracy: "85-90%",
                  note: "Distinctive visual profile",
                },
                {
                  item: "Opaque plastic bags (unknown contents)",
                  accuracy: "35-50%",
                  note: "Cannot classify interior — but high bag rate signals basket misuse",
                },
              ].map((row) => (
                <tr
                  key={row.item}
                  className="border-b border-gray-800/50"
                >
                  <td className="px-4 py-3 text-gray-300">{row.item}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {row.accuracy}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Individual classification errors average out across hundreds of
          disposal events per bin per day. Routing decisions are based on
          aggregate distributions, not single classifications.
        </p>
      </section>

      {/* Classification Taxonomy */}
      <section className="mb-16">
        <SectionHeading>NYC Classification Rules</SectionHeading>
        <p className="mb-6 text-gray-400">
          Items are classified per NYC Department of Sanitation rules into three
          categories:
        </p>
        <div className="overflow-x-auto rounded-lg border border-gray-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 bg-gray-900 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Examples</th>
              </tr>
            </thead>
            <tbody>
              <TaxonomyRow
                color="green"
                category="Compostable"
                examples="Food scraps (fruit, vegetables, meat, bones, dairy), coffee grounds/filters, tea bags, food-soiled paper (napkins, pizza boxes), yard waste"
              />
              <TaxonomyRow
                color="blue"
                category="Recyclable"
                examples="Paper & cardboard, aluminum/food cans, tin foil, glass bottles/jars, plastic bottles & containers with recycling symbol, paper bags"
              />
              <TaxonomyRow
                color="gray"
                category="Landfill"
                examples="Plastic bags/film, styrofoam, plastic utensils/straws, coated paper cups, dirty paper towels, diapers, clothing, ceramics, batteries, electronics"
              />
            </tbody>
          </table>
        </div>
      </section>

      {/* Intervention Logic */}
      <section className="mb-16">
        <SectionHeading>Data-Driven Interventions</SectionHeading>
        <p className="mb-6 text-gray-400">
          Based on the classification data collected at each location, the
          system recommends specific actions:
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-green-500/30 bg-green-950/10 p-5">
            <p className="text-3xl font-bold text-green-400">&gt;30%</p>
            <p className="mt-1 text-sm text-green-300">compostable</p>
            <p className="mt-3 text-sm text-gray-400">
              Recommend compost bin placement at this location
            </p>
          </div>
          <div className="rounded-lg border border-blue-500/30 bg-blue-950/10 p-5">
            <p className="text-3xl font-bold text-blue-400">&gt;40%</p>
            <p className="mt-1 text-sm text-blue-300">recyclable</p>
            <p className="mt-3 text-sm text-gray-400">
              Recommend recycling bin placement at this location
            </p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-950/10 p-5">
            <p className="text-3xl font-bold text-amber-400">&ge;60%</p>
            <p className="mt-1 text-sm text-amber-300">
              bin composability score
            </p>
            <p className="mt-3 text-sm text-gray-400">
              Route entire zone to MBT / organics processing instead of landfill
            </p>
          </div>
        </div>
      </section>

      {/* Privacy & Equity */}
      <section className="mb-16">
        <SectionHeading>Privacy & Equity Considerations</SectionHeading>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-base font-semibold text-white">Privacy</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              <li>
                NYC&apos;s POST Act (2020) requires DSNY to publish an impact
                and use policy before deploying surveillance technology
              </li>
              <li>
                Camera captures items at disposal opening only — no images of
                people are stored or transmitted
              </li>
              <li>
                On-device edge processing ensures no personally identifiable
                information leaves the device
              </li>
              <li>
                RFID-based approaches (scanning packaging barcodes) avoid visual
                capture entirely for residential bins
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-gray-800 bg-gray-900/50 p-6">
            <h3 className="text-base font-semibold text-white">Equity</h3>
            <ul className="mt-3 space-y-2 text-sm text-gray-300">
              <li>
                Recycling and composting participation correlates with income
                level — monitoring must not deploy only in high-compliance
                neighborhoods
              </li>
              <li>
                NYCHA developments have historically low diversion despite
                allocated resources
              </li>
              <li>
                Data from lower-income neighborhoods must be used to add
                resources and support, not to penalize residents
              </li>
              <li>
                Communities with historically low diversion should be engaged as
                co-designers of interventions
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-16">
        <SectionHeading>Technical Stack</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              label: "Vision Models",
              value: "Claude Sonnet, GPT-4o, Gemini Flash",
            },
            { label: "Eval Scripts", value: "TypeScript, ts-node" },
            { label: "Dashboard", value: "Next.js, Tailwind CSS" },
            { label: "Hosting", value: "Vercel" },
            { label: "Data Storage", value: "Postgres (Phase 2)" },
            {
              label: "Hardware",
              value: "Camera module + Raspberry Pi (Phase 3)",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-baseline justify-between rounded-lg border border-gray-800 bg-gray-900/50 px-4 py-3"
            >
              <span className="text-sm text-gray-400">{item.label}</span>
              <span className="text-sm font-medium text-gray-200">
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
        <p>NYC Waste Classifier — Columbia University</p>
      </footer>
    </main>
  );
}
