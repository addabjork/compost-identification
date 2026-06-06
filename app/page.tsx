import Image from "next/image";
import Link from "next/link";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-4 text-2xl font-bold tracking-tight text-white">
      {children}
    </h2>
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
    <div
      className={`rounded-xl border p-6 ${statusColors[status]}`}
    >
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

      {/* Problem */}
      <section className="mb-16">
        <SectionHeading>The Problem</SectionHeading>
        <p className="max-w-3xl leading-relaxed text-gray-300">
          A significant portion of public waste in NYC is compostable or
          recyclable but is currently treated as general landfill trash. There
          is no systematic way to measure how much recoverable material flows
          through the city&apos;s public trash cans, and no data-driven
          mechanism to inform interventions — whether that&apos;s bin
          placement, sorting infrastructure, or policy changes.
        </p>
      </section>

      {/* Approach - Three Phases */}
      <section className="mb-16">
        <SectionHeading>Approach</SectionHeading>
        <div className="grid gap-6 sm:grid-cols-3">
          <PhaseCard phase="Phase 1" title="Model Evaluation" status="current">
            <p>
              Benchmark Claude, GPT-4o, and Gemini on their ability to classify
              waste items as compostable, recyclable, or landfill using NYC
              rules. Build a scoring dashboard to compare accuracy.
            </p>
          </PhaseCard>
          <PhaseCard
            phase="Phase 2"
            title="Data Collection Pipeline"
            status="next"
          >
            <p>
              Field teams photograph public trash cans across NYC. Images are
              classified and aggregated to map waste composition by location,
              informing where to place compost and recycling bins.
            </p>
          </PhaseCard>
          <PhaseCard phase="Phase 3" title="In-Bin Hardware" status="future">
            <p>
              Deploy camera modules inside public trash cans for real-time,
              continuous waste classification — enabling live monitoring and
              automated intervention recommendations.
            </p>
          </PhaseCard>
        </div>
      </section>

      {/* Hardware */}
      <section className="mb-16">
        <SectionHeading>Hardware Design Proposal</SectionHeading>
        <div className="grid items-center gap-8 sm:grid-cols-2">
          <div>
            <p className="leading-relaxed text-gray-300">
              A proposed design for a compact, IP67-rated camera module that
              clamps onto the inner rim of existing city trash cans. It would
              capture images via a Raspberry Pi Camera Module V2 and transmit
              data over LTE-M cellular using an Adafruit FONA 4G modem.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-400">
              <li>IP67 waterproof enclosure with polycarbonate lens window</li>
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
            <p className="text-3xl font-bold text-amber-400">&gt;60%</p>
            <p className="mt-1 text-sm text-amber-300">
              recoverable (combined)
            </p>
            <p className="mt-3 text-sm text-gray-400">
              Recommend industrial sorting investment city-wide
            </p>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="mb-16">
        <SectionHeading>Technical Stack</SectionHeading>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: "Vision Models", value: "Claude Sonnet, GPT-4o, Gemini Flash" },
            { label: "Eval Scripts", value: "TypeScript, ts-node" },
            { label: "Dashboard", value: "Next.js, Tailwind CSS" },
            { label: "Hosting", value: "Vercel" },
            { label: "Data Storage", value: "Postgres (Phase 2)" },
            { label: "Hardware", value: "Camera module + Raspberry Pi (Phase 3)" },
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
