"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SlidersHorizontal,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  Zap,
  Trash2,
  Bug,
  Server,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import PageHeader from "@/components/layout/PageHeader";
import AnimatedSection from "@/components/ui/AnimatedSection";
import StatBar from "@/components/ui/StatBar";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlagType = "boolean" | "size" | "number" | "select" | "percent";

interface Flag {
  id: string;
  flag: string;
  name: string;
  description: string;
  detail: string;
  type: FlagType;
  default: string | number | boolean;
  value: string | number | boolean;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: { label: string; value: string }[];
  category: "heap" | "gc" | "jit" | "debug" | "container";
  impact: {
    startup: number;
    throughput: number;
    latency: number;
    memory: number;
  };
}

// ─── Flag Data ────────────────────────────────────────────────────────────────

const INITIAL_FLAGS: Flag[] = [
  // Heap
  {
    id: "xmx",
    flag: "-Xmx",
    name: "Max Heap Size",
    category: "heap",
    description: "Maximum heap size. JVM never allocates more than this.",
    detail:
      "Setting -Xmx too low triggers frequent GC and OOM errors. Too high wastes memory and increases GC pause times. Golden rule: set -Xms equal to -Xmx in production to avoid heap resizing pauses and commit all memory upfront.",
    type: "size",
    default: 512,
    value: 512,
    min: 128,
    max: 8192,
    step: 128,
    unit: "MB",
    impact: { startup: -10, throughput: 30, latency: 20, memory: 80 },
  },
  {
    id: "xms",
    flag: "-Xms",
    name: "Initial Heap Size",
    category: "heap",
    description: "Initial heap size at JVM startup.",
    detail:
      "If -Xms < -Xmx, the JVM starts small and grows. Each growth triggers a GC pause. For servers: set -Xms == -Xmx to commit all memory upfront and eliminate resize pauses. For short-lived CLIs: keep -Xms small to reduce startup memory footprint.",
    type: "size",
    default: 256,
    value: 256,
    min: 64,
    max: 8192,
    step: 64,
    unit: "MB",
    impact: { startup: -20, throughput: 10, latency: 15, memory: 60 },
  },
  {
    id: "xss",
    flag: "-Xss",
    name: "Thread Stack Size",
    category: "heap",
    description: "Stack size per platform thread.",
    detail:
      "Each platform thread reserves this much stack space. Default is 512KB–1MB depending on OS. Reduce for apps creating many threads. Increase if you get StackOverflowError from deep recursion. Virtual threads start with ~few KB and grow as needed — -Xss does not apply to them.",
    type: "size",
    default: 512,
    value: 512,
    min: 64,
    max: 4096,
    step: 64,
    unit: "KB",
    impact: { startup: 0, throughput: 0, latency: -5, memory: -40 },
  },
  {
    id: "metaspace",
    flag: "-XX:MaxMetaspaceSize",
    name: "Max Metaspace",
    category: "heap",
    description: "Cap on native memory for class metadata.",
    detail:
      "Metaspace defaults to unlimited — it grows until the OS refuses. Set a cap to get OOM instead of silent native memory exhaustion. Start at 256–512MB and monitor. Apps with many ClassLoaders (web containers, OSGi) need more. ClassLoader leaks cause Metaspace to grow unboundedly.",
    type: "size",
    default: 256,
    value: 256,
    min: 64,
    max: 2048,
    step: 64,
    unit: "MB",
    impact: { startup: 0, throughput: 0, latency: 0, memory: -30 },
  },
  // GC
  {
    id: "gc",
    flag: "",
    name: "GC Algorithm",
    category: "gc",
    description: "Select the garbage collector.",
    detail:
      "G1 is the default since Java 9 — best balance for most workloads. ZGC for sub-millisecond latency (Java 15+). Parallel for maximum throughput in batch workloads. Serial for tiny heaps or embedded. Shenandoah (OpenJDK only) is similar to ZGC.",
    type: "select",
    default: "-XX:+UseG1GC",
    value: "-XX:+UseG1GC",
    options: [
      { label: "G1 GC (default, Java 9+)", value: "-XX:+UseG1GC" },
      { label: "ZGC (sub-ms latency, Java 15+)", value: "-XX:+UseZGC" },
      { label: "Parallel GC (max throughput)", value: "-XX:+UseParallelGC" },
      { label: "Serial GC (single-threaded)", value: "-XX:+UseSerialGC" },
      { label: "Shenandoah (OpenJDK)", value: "-XX:+UseShenandoahGC" },
    ],
    impact: { startup: 0, throughput: 0, latency: 0, memory: 0 },
  },
  {
    id: "maxgcpause",
    flag: "-XX:MaxGCPauseMillis",
    name: "Max GC Pause Target",
    category: "gc",
    description: "Target maximum GC pause time (G1 only).",
    detail:
      "G1 tries to meet this pause target by limiting the number of regions collected per pause. Smaller values mean more frequent but shorter pauses, potentially lower throughput. Default is 200ms. For latency-sensitive services: 50–100ms. G1 cannot always meet the target but will try.",
    type: "number",
    default: 200,
    value: 200,
    min: 20,
    max: 1000,
    step: 10,
    unit: "ms",
    impact: { startup: 0, throughput: -20, latency: 40, memory: 0 },
  },
  {
    id: "ihop",
    flag: "-XX:InitiatingHeapOccupancyPercent",
    name: "G1 IHOP",
    category: "gc",
    description: "Heap % at which G1 starts concurrent marking.",
    detail:
      "G1 starts concurrent marking when the old gen reaches this percentage of the total heap. Default 45%. Lower value: marking starts earlier — less risk of Full GC but more concurrent GC work. Higher: more efficient but risks evacuation failures if heap fills too fast.",
    type: "percent",
    default: 45,
    value: 45,
    min: 10,
    max: 90,
    step: 5,
    unit: "%",
    impact: { startup: 0, throughput: 10, latency: -10, memory: 0 },
  },
  {
    id: "gclog",
    flag: "-Xlog:gc*",
    name: "GC Logging",
    category: "gc",
    description: "Enable unified GC logging.",
    detail:
      "Always enable in production. The overhead is < 0.1%. Logs every GC event with timestamps. Add :file=gc.log:time,uptime:filecount=5,filesize=20m for rotating file output. Essential for post-incident analysis.",
    type: "boolean",
    default: false,
    value: false,
    impact: { startup: 0, throughput: -2, latency: -1, memory: 0 },
  },
  // JIT
  {
    id: "tiered",
    flag: "-XX:+TieredCompilation",
    name: "Tiered Compilation",
    category: "jit",
    description: "Enable 5-tier JIT compilation (default on).",
    detail:
      "Tiered compilation combines C1 (fast compile) and C2 (optimizing compile) for the best of both worlds. Disable only for debugging JIT issues. Disabling forces single-tier compilation and dramatically hurts peak throughput.",
    type: "boolean",
    default: true,
    value: true,
    impact: { startup: 20, throughput: 50, latency: 30, memory: -10 },
  },
  {
    id: "codecache",
    flag: "-XX:ReservedCodeCacheSize",
    name: "Code Cache Size",
    category: "jit",
    description: "Max memory for JIT-compiled native code.",
    detail:
      'When the code cache fills, the JIT stops compiling and performance drops dramatically (the JVM warns: "CodeCache is full"). Default is 240MB in JDK 11+. For large microservices, set to 512MB. Monitor with: -XX:+PrintCodeCache or JFR.',
    type: "size",
    default: 240,
    value: 240,
    min: 64,
    max: 1024,
    step: 64,
    unit: "MB",
    impact: { startup: -5, throughput: 20, latency: 10, memory: -15 },
  },
  // Debug
  {
    id: "heapdump",
    flag: "-XX:+HeapDumpOnOutOfMemoryError",
    name: "Heap Dump on OOM",
    category: "debug",
    description: "Automatically write a heap dump when OOM occurs.",
    detail:
      "Always enable in production. The heap dump is written before the JVM dies from OOM. Combine with -XX:HeapDumpPath=/path/to/dumps. The dump can be analyzed with Eclipse MAT or JDK Mission Control to find the leak. There is no performance overhead until OOM actually occurs.",
    type: "boolean",
    default: false,
    value: false,
    impact: { startup: 0, throughput: 0, latency: 0, memory: 0 },
  },
  {
    id: "printcomp",
    flag: "-XX:+PrintCompilation",
    name: "Print Compilation",
    category: "debug",
    description: "Print each method as it is JIT-compiled.",
    detail:
      "Shows tier level, method name, and % for OSR compilations. Extremely noisy in production — use only during development or benchmarking. Output goes to stdout. Better alternative: use JFR jdk.Compilation events to capture without stdout noise.",
    type: "boolean",
    default: false,
    value: false,
    impact: { startup: 0, throughput: -5, latency: -5, memory: 0 },
  },
  // Container
  {
    id: "container",
    flag: "-XX:+UseContainerSupport",
    name: "Container Support",
    category: "container",
    description: "Read cgroup memory/CPU limits (default on Java 11+).",
    detail:
      "Without this, the JVM reads the host machine's total memory (e.g., 128 GB) instead of the container limit (e.g., 2 GB) and sets the heap too large, causing OOM kills. Enabled by default since Java 11. The JVM sets default heap to ~25% of container memory limit.",
    type: "boolean",
    default: true,
    value: true,
    impact: { startup: 0, throughput: 0, latency: 0, memory: 30 },
  },
  {
    id: "maxrampc",
    flag: "-XX:MaxRAMPercentage",
    name: "Max RAM Percentage",
    category: "container",
    description: "Heap as a % of available RAM (container-aware).",
    detail:
      "Used instead of -Xmx in containers. JVM sets max heap to this % of the container memory limit. Default 25%. For apps where heap is the main memory consumer: 75%. Leave room for: Metaspace (100–300 MB), Code Cache (240 MB), thread stacks, direct buffers.",
    type: "percent",
    default: 25,
    value: 25,
    min: 10,
    max: 85,
    step: 5,
    unit: "%",
    impact: { startup: 0, throughput: 20, latency: 10, memory: -60 },
  },
];

const CATEGORY_META = {
  heap: { label: "Heap Sizing", icon: Server, color: "#8B5CF6" },
  gc: { label: "Garbage Collection", icon: Trash2, color: "#F59E0B" },
  jit: { label: "JIT Compiler", icon: Zap, color: "#10B981" },
  debug: { label: "Debugging", icon: Bug, color: "#EF4444" },
  container: { label: "Containers", icon: Server, color: "#06B6D4" },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatValue = (flag: Flag) => {
  switch (flag.type) {
    case "boolean":
      return flag.value ? "Enabled" : "Disabled";
    case "size":
      return `${flag.value}${flag.unit}`;
    case "percent":
      return `${flag.value}%`;
    case "number":
      return `${flag.value}${flag.unit ?? ""}`;
    case "select":
      return (
        flag.options?.find((o) => o.value === flag.value)?.label ??
        String(flag.value)
      );
    default:
      return String(flag.value);
  }
};

const generateCommand = (flags: Flag[]) => {
  const parts: string[] = [];

  flags.forEach((flag) => {
    switch (flag.type) {
      case "boolean":
        if (flag.value) {
          parts.push(flag.flag);
        }
        break;

      case "size":
        parts.push(
          `${flag.flag}${flag.value}${
            flag.unit === "GB"
              ? "g"
              : flag.unit === "MB"
                ? "m"
                : flag.unit === "KB"
                  ? "k"
                  : ""
          }`,
        );
        break;

      case "number":
      case "percent":
        parts.push(`${flag.flag}=${flag.value}`);
        break;

      case "select":
        if (flag.value) {
          parts.push(String(flag.value));
        }
        break;
    }
  });

  return `java ${parts.join(" ")} -jar app.jar`;
};

const getImpactColor = (value: number) => {
  if (value >= 40) return "bg-emerald-500";
  if (value >= 20) return "bg-lime-500";
  if (value >= 0) return "bg-slate-500";
  if (value >= -20) return "bg-amber-500";
  return "bg-red-500";
};

export default function JVMFlagsPage() {
  const [flags, setFlags] = useState(INITIAL_FLAGS);

  const [expanded, setExpanded] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const [search, setSearch] = useState("");

  const [selectedCategory, setSelectedCategory] = useState<
    keyof typeof CATEGORY_META | "all"
  >("all");

  const filteredFlags = useMemo(() => {
    return flags.filter((flag) => {
      const categoryMatch =
        selectedCategory === "all" || flag.category === selectedCategory;

      const searchMatch =
        flag.flag.toLowerCase().includes(search.toLowerCase()) ||
        flag.name.toLowerCase().includes(search.toLowerCase()) ||
        flag.description.toLowerCase().includes(search.toLowerCase());

      return categoryMatch && searchMatch;
    });
  }, [flags, search, selectedCategory]);

  const command = useMemo(() => generateCommand(flags), [flags]);

  const updateFlag = (id: string, value: any) => {
    setFlags((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              value,
            }
          : f,
      ),
    );
  };

  const copyCommand = async () => {
    await navigator.clipboard.writeText(command);

    setCopied(true);

    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Performance Tuning"
        title="Interactive"
        titleHighlight="JVM Flags Lab"
        description="Experiment with production JVM flags, understand their impact and generate optimized startup commands."
        icon={SlidersHorizontal}
        iconColor="#06B6D4"
        gradient="from-cyan-500 via-blue-500 to-purple-500"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">
        <AnimatedSection>
          <GlassCard className="p-6">
            <div className="grid lg:grid-cols-3 gap-8">
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-cyan-400 mb-2">
                  JVM Flags
                </div>

                <h2 className="text-xl font-bold text-white">
                  Build Production Ready JVM Commands
                </h2>

                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Adjust memory, GC, JIT and debugging flags while instantly
                  generating the JVM startup command.
                </p>
              </div>

              <div className="lg:col-span-2 space-y-4">
                <StatBar label="Available Flags" value={100} color="#06b6d4" />

                <StatBar
                  label="Visible"
                  value={Math.round(
                    (filteredFlags.length / flags.length) * 100,
                  )}
                  color="#10b981"
                />
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>
      {/* Search & Categories */}
        <AnimatedSection delay={0.1}>
          <GlassCard className="p-5">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search JVM flags..."
                  className="w-full rounded-xl bg-black/30 border border-white/[0.08] px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/40 transition-colors"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    borderColor: selectedCategory === "all" ? '#06B6D440' : 'rgba(255,255,255,0.08)',
                    backgroundColor: selectedCategory === "all" ? '#06B6D418' : 'rgba(255,255,255,0.02)',
                    color: selectedCategory === "all" ? '#06B6D4' : '#94a3b8',
                  }}
                >
                  All
                </button>

                {Object.entries(CATEGORY_META).map(([key, meta]) => {
                  const Icon = meta.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedCategory(key as keyof typeof CATEGORY_META)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border"
                      style={{
                        borderColor: selectedCategory === key ? `${meta.color}40` : 'rgba(255,255,255,0.08)',
                        backgroundColor: selectedCategory === key ? `${meta.color}18` : 'rgba(255,255,255,0.02)',
                        color: selectedCategory === key ? meta.color : '#94a3b8',
                      }}
                    >
                      <Icon size={12} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Flag Explorer */}
        <AnimatedSection delay={0.2}>
          <div className="space-y-4">
            <AnimatePresence>
              {filteredFlags.map((flag) => {
                const meta = CATEGORY_META[flag.category];
                const Icon = meta.icon;

                return (
                  <motion.div
                    key={flag.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.25 }}
                  >
                    <GlassCard className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              background: `${meta.color}20`,
                              color: meta.color,
                            }}
                          >
                            <Icon size={18} />
                          </div>

                          <div>
                            <div className="flex items-center gap-2.5 flex-wrap">
                              <h3 className="text-sm font-bold text-white">
                                {flag.name}
                              </h3>

                              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono border"
                                style={{ borderColor: `${meta.color}40`, color: meta.color, backgroundColor: `${meta.color}15` }}>
                                {flag.flag || "Selector"}
                              </span>
                            </div>

                            <p className="text-xs text-slate-500 mt-1.5">
                              {flag.description}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            setExpanded(expanded === flag.id ? null : flag.id)
                          }
                          className="text-slate-500 hover:text-white transition-colors"
                        >
                          {expanded === flag.id ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    <AnimatePresence>
                      {expanded === flag.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-5 pt-5 border-t border-white/[0.06] grid lg:grid-cols-2 gap-5">
                            {/* Controls */}
                            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                                Configure Flag
                              </h4>

                              {flag.type === "boolean" && (
                                <label className="flex items-center justify-between">
                                  <span className="text-xs text-slate-400">Enable</span>
                                  <button
                                    onClick={() => updateFlag(flag.id, !flag.value)}
                                    className={`w-12 h-6 rounded-full transition relative ${
                                      flag.value ? "bg-emerald-500/60" : "bg-white/[0.08]"
                                    }`}
                                  >
                                    <motion.div
                                      layout
                                      className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white"
                                      animate={{ x: flag.value ? 24 : 0 }}
                                    />
                                  </button>
                                </label>
                              )}

                              {flag.type === "select" && (
                                <select
                                  value={String(flag.value)}
                                  onChange={(e) => updateFlag(flag.id, e.target.value)}
                                  className="w-full rounded-lg bg-black/30 border border-white/[0.08] p-2.5 text-sm text-white"
                                >
                                  {flag.options?.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {(flag.type === "size" || flag.type === "number" || flag.type === "percent") && (
                                <>
                                  <input
                                    type="range"
                                    min={flag.min}
                                    max={flag.max}
                                    step={flag.step}
                                    value={Number(flag.value)}
                                    onChange={(e) => updateFlag(flag.id, Number(e.target.value))}
                                    className="w-full accent-cyan-500"
                                  />
                                  <div className="flex justify-between mt-2 text-[10px]">
                                    <span className="text-slate-600">{flag.min}{flag.unit}</span>
                                    <span className="text-cyan-400 font-mono font-bold">{flag.value}{flag.unit}</span>
                                    <span className="text-slate-600">{flag.max}{flag.unit}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Performance Impact */}
                            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
                                Performance Impact
                              </h4>

                              <div className="space-y-3">
                                {Object.entries(flag.impact).map(([key, value]) => (
                                  <div key={key}>
                                    <div className="flex justify-between text-[10px] mb-1">
                                      <span className="capitalize text-slate-400">{key}</span>
                                      <span className="text-slate-300 font-mono">{value > 0 ? "+" : ""}{value}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.min(Math.abs(value) * 2, 100)}%` }}
                                        className={`h-full rounded-full ${getImpactColor(value)}`}
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <div className="mt-4 pt-3 border-t border-white/[0.06]">
                                <span className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider">Recommendation</span>
                                <p className="text-xs text-slate-400 leading-relaxed mt-1.5">{flag.detail}</p>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </AnimatedSection>

      {/* JVM Command Builder */}
        <AnimatedSection delay={0.3}>
          <GlassCard className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400">Generated Command</span>
                <h2 className="text-lg font-bold text-white mt-1">Production JVM Launcher</h2>
                <p className="text-xs text-slate-500 mt-1">Every flag you modify instantly updates the startup command below.</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => { setFlags(structuredClone(INITIAL_FLAGS)); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-white/[0.08] text-slate-400 hover:text-white transition-all"
                >
                  Reset
                </button>

                <button
                  onClick={copyCommand}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-all"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-[#0a0f1e]">
              <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/60" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <span className="w-3 h-3 rounded-full bg-green-500/60" />
                </div>
                <span className="ml-3 text-xs text-slate-500 font-mono">Terminal</span>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre>
                  <code className="text-green-400 text-sm font-mono leading-relaxed">{command}</code>
                </pre>
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        <AnimatedSection delay={0.35}>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              { title: "Spring Boot API", heap: 2048, gc: "-XX:+UseG1GC" },
              { title: "Kafka", heap: 8192, gc: "-XX:+UseG1GC" },
              { title: "Local Development", heap: 512, gc: "-XX:+UseG1GC" },
              { title: "Low Memory", heap: 256, gc: "-XX:+UseSerialGC" },
            ].map((profile) => (
              <GlassCard key={profile.title} className="p-5" hover>
                <div className="flex flex-col h-full">
                  <h3 className="text-sm font-bold text-white">{profile.title}</h3>
                  <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                    Heap: {profile.heap}MB • {profile.gc.replace('-XX:+Use', '').replace('GC', ' GC')}
                  </p>
                  <button
                    className="mt-4 w-full px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 hover:bg-cyan-500/30 transition-all"
                    onClick={() => {
                      setFlags((prev) =>
                        prev.map((flag) => {
                          if (flag.id === "xmx") return { ...flag, value: profile.heap };
                          if (flag.id === "xms") return { ...flag, value: profile.heap };
                          if (flag.id === "gc") return { ...flag, value: profile.gc };
                          return flag;
                        }),
                      );
                    }}
                  >
                    Apply Preset
                  </button>
                </div>
              </GlassCard>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.4}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Production Recommendations</h2>
            <div className="grid lg:grid-cols-2 gap-3">
              {[
                "Always keep -Xms equal to -Xmx in production servers.",
                "Enable HeapDumpOnOutOfMemoryError.",
                "Always enable GC logging.",
                "Use G1GC unless latency requirements demand ZGC.",
                "Monitor GC using JFR or Mission Control.",
                "Avoid experimental JVM flags in production.",
              ].map((tip) => (
                <div key={tip} className="flex gap-3 items-start p-3 rounded-xl border border-white/[0.04] bg-white/[0.02]">
                  <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-400 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        <AnimatedSection delay={0.45}>
          <GlassCard className="p-6">
            <div className="mb-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-cyan-400">Interview Corner</span>
              <h2 className="text-lg font-bold text-white mt-1">Frequently Asked JVM Flag Questions</h2>
            </div>

            {[
              {
                q: "Why should Xms and Xmx be equal in production?",
                a: "Keeping the initial heap equal to the maximum heap prevents runtime heap expansion. Heap expansion causes additional GC pauses and memory commits. Fixed heap sizing produces more predictable latency.",
              },
              {
                q: "When should you use ZGC instead of G1?",
                a: "Choose ZGC when extremely low pause times are more important than maximum throughput. It is commonly used for financial systems, gaming servers, and real-time APIs.",
              },
              {
                q: "Why enable HeapDumpOnOutOfMemoryError?",
                a: "It automatically captures the heap before the JVM exits, allowing memory leak analysis with Eclipse MAT or JDK Mission Control.",
              },
              {
                q: "Why is GC logging always recommended?",
                a: "GC logs provide visibility into pause times, allocation rate, promotion failures and Full GCs. They are the first source used when diagnosing JVM performance issues.",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="border-b border-white/[0.06] last:border-none py-4"
              >
                <div className="text-sm font-bold text-white">{item.q}</div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </GlassCard>
        </AnimatedSection>

        <AnimatedSection delay={0.5}>
          <div className="grid lg:grid-cols-2 gap-4">
            {[
              {
                title: "Huge Heap on Small Server",
                desc: "Setting -Xmx equal to the entire machine memory leaves no room for Metaspace, thread stacks, direct buffers or the operating system.",
              },
              {
                title: "Disabling GC Logs",
                desc: "Without GC logs you lose the most valuable source of production troubleshooting information.",
              },
              {
                title: "Using Experimental Flags",
                desc: "Avoid experimental JVM options unless you completely understand their behavior.",
              },
              {
                title: "Ignoring Container Memory",
                desc: "Modern applications should use container-aware JVM settings instead of assuming host memory.",
              },
            ].map((card) => (
              <GlassCard key={card.title} className="p-5" hover>
                <div className="flex gap-3">
                  <Info className="text-amber-400 shrink-0 mt-0.5" size={16} />
                  <div>
                    <h3 className="text-sm font-bold text-white">{card.title}</h3>
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{card.desc}</p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </AnimatedSection>

        <AnimatedSection delay={0.55}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">JVM Version Compatibility</h2>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { version: "Java 8", items: ["Parallel GC", "CMS", "G1"], color: '#EF4444' },
                { version: "Java 11", items: ["Container Support", "G1 Default", "JFR"], color: '#F59E0B' },
                { version: "Java 17", items: ["ZGC Stable", "Strong Encapsulation", "Modern GC"], color: '#10B981' },
                { version: "Java 21", items: ["Generational ZGC", "Virtual Threads", "Latest LTS"], color: '#06B6D4' },
              ].map((v) => (
                <div
                  key={v.version}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="text-sm font-bold mb-3" style={{ color: v.color }}>{v.version}</div>
                  <div className="space-y-2">
                    {v.items.map((i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Check size={12} className="text-emerald-400 shrink-0" />
                        <span className="text-xs text-slate-400">{i}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        <AnimatedSection delay={0.6}>
          <GlassCard className="p-6 text-center">
            <h2 className="text-lg font-bold text-white">Master JVM Performance</h2>
            <p className="mt-3 max-w-2xl mx-auto text-xs text-slate-400 leading-relaxed">
              JVM tuning is about understanding trade-offs rather than memorizing flags. Learn the purpose
              behind each option, monitor your application with JFR and GC logs, and validate every change
              with benchmarks before deploying to production.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {[
                { label: 'Heap', color: '#06B6D4' },
                { label: 'Garbage Collection', color: '#8B5CF6' },
                { label: 'JIT', color: '#10B981' },
                { label: 'Performance', color: '#F59E0B' },
                { label: 'Production', color: '#EC4899' },
              ].map((tag) => (
                <span
                  key={tag.label}
                  className="px-2.5 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                >
                  {tag.label}
                </span>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

      </div>
    </div>
  );
}
