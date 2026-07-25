'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, Play, RotateCcw, ArrowRight, TrendingUp } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import CodeBlock from '@/components/ui/CodeBlock';
import StatBar from '@/components/ui/StatBar';

const TIERS = [
  {
    id: 0, label: 'Tier 0', name: 'Interpreter',
    description: 'All methods start here. The interpreter reads bytecode one instruction at a time and executes it. No compilation — fast startup, slow sustained throughput.',
    invocations: '0–2K',
    color: '#94a3b8',
    perf: 20,
  },
  {
    id: 1, label: 'Tier 1', name: 'C1 — Simple',
    description: 'HotSpot C1 compiler with minimal profiling. Compiles to native code with no optimization instrumentation. Used for methods that aren\'t frequent enough for full profiling.',
    invocations: '~1K',
    color: '#3B82F6',
    perf: 50,
  },
  {
    id: 2, label: 'Tier 2', name: 'C1 — Limited Profile',
    description: 'C1 compiler with limited profiling (invocation and back-edge counters only). Used when the C2 compiler queue is full.',
    invocations: '~2K',
    color: '#8B5CF6',
    perf: 65,
  },
  {
    id: 3, label: 'Tier 3', name: 'C1 — Full Profile',
    description: 'C1 with full profiling: type profiles, branch frequencies, call frequencies. This data feeds C2\'s speculative optimizations.',
    invocations: '~15K',
    color: '#06B6D4',
    perf: 75,
  },
  {
    id: 4, label: 'Tier 4', name: 'C2 — Server Compiler',
    description: 'The most aggressive optimization tier. C2 uses the profiling data from Tier 3 to apply: method inlining, escape analysis, loop unrolling, vectorization, lock elision, and speculative optimizations with deoptimization fallback.',
    invocations: '~15K+ (hot)',
    color: '#10B981',
    perf: 100,
  },
];

const OPTIMIZATIONS = [
  {
    name: 'Method Inlining',
    description: 'The most impactful JIT optimization. Copies the body of a called method directly into the caller, eliminating virtual dispatch overhead and enabling further optimizations.',
    before: `// Before inlining
int sum = 0;
for (int i = 0; i < list.size(); i++) {
    sum += getValue(i); // virtual call every iteration
}

int getValue(int i) { return data[i] * 2; }`,
    after: `// After inlining (JIT rewrites to):
int sum = 0;
for (int i = 0; i < list.size(); i++) {
    sum += data[i] * 2; // inlined — no call overhead
}
// Virtual dispatch eliminated, further opts unlocked`,
    speedup: '3–10×',
    color: '#10B981',
  },
  {
    name: 'Escape Analysis',
    description: 'Determines if an object reference can escape its creating method. Non-escaping objects can be stack-allocated or scalar-replaced, eliminating heap allocation and GC pressure.',
    before: `// Before escape analysis
Point p = new Point(x, y);  // heap allocation
int dist = p.x * p.x + p.y * p.y;
// p escapes? No — only used locally`,
    after: `// After escape analysis / scalar replacement:
// JIT eliminates the Point allocation entirely
// p.x and p.y become local variables on the stack
int dist = x * x + y * y;
// Zero heap allocation, zero GC pressure`,
    speedup: '2–5× (allocation-heavy code)',
    color: '#3B82F6',
  },
  {
    name: 'Loop Unrolling',
    description: 'Replicates the loop body multiple times to reduce loop control overhead (counter increment, condition check, branch prediction misses) and enable vectorization (SIMD).',
    before: `// Before unrolling
for (int i = 0; i < n; i++) {
    result += arr[i]; // one element per iteration
}`,
    after: `// After unrolling (factor of 4):
for (int i = 0; i < n - 3; i += 4) {
    result += arr[i] + arr[i+1] + arr[i+2] + arr[i+3];
    // 4 elements per iteration, SIMD possible
}
// Handle remaining elements`,
    speedup: '2–8× (on modern CPUs with SIMD)',
    color: '#8B5CF6',
  },
  {
    name: 'Lock Elision',
    description: 'If escape analysis proves a synchronized object is thread-local (never visible to other threads), the JIT removes all synchronization overhead entirely.',
    before: `// Before lock elision
void compute() {
    StringBuffer sb = new StringBuffer(); // synchronized
    sb.append("Hello");   // locks/unlocks
    sb.append("World");   // locks/unlocks
    return sb.toString(); // sb never shared!
}`,
    after: `// After lock elision (sb doesn't escape):
void compute() {
    // All synchronized blocks removed by JIT
    // StringBuffer behaves like StringBuilder
    // Zero lock overhead
}`,
    speedup: '1.5–3× (synchronized-heavy code)',
    color: '#F59E0B',
  },
];

const BYTECODE_DEMO = {
  java: `public class Add {
    public static int add(int a, int b) {
        return a + b;
    }
}`,
  bytecode: `public static int add(int, int);
  descriptor: (II)I
  Code:
     0: iload_0      // push a onto operand stack
     1: iload_1      // push b onto operand stack
     2: iadd         // pop a+b, push result
     3: ireturn      // return int from top of stack`,
  native: `; x86-64 native (JIT output, simplified)
add_method:
    lea    eax, [rdi + rsi]   ; eax = a + b  (single instruction!)
    ret                        ; return`,
};

export default function ExecutionEnginePage() {
  const [activeOpt, setActiveOpt] = useState(0);
  const [showNative, setShowNative] = useState(false);
  const [activeTier, setActiveTier] = useState(4);

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="JIT Compilation"
        title="Execution"
        titleHighlight="Engine"
        description="From bytecode interpretation to optimized native code — understand how HotSpot's tiered compilation transforms your Java into lightning-fast machine instructions."
        icon={Zap}
        iconColor="#10B981"
        gradient="from-emerald-400 via-green-400 to-cyan-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">

        {/* Bytecode → Native pipeline */}
        <AnimatedSection>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-2">Bytecode to Native Code</h2>
            <p className="text-sm text-slate-400 mb-6">See how a simple Java method transforms through each stage of the execution pipeline.</p>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              {[
                { label: 'Java Source', lang: 'java', code: BYTECODE_DEMO.java, color: '#3B82F6', icon: '☕' },
                { label: 'JVM Bytecode', lang: 'bytecode', code: BYTECODE_DEMO.bytecode, color: '#8B5CF6', icon: '⬡' },
                { label: 'x86-64 Native', lang: 'asm', code: BYTECODE_DEMO.native, color: '#10B981', icon: '⚡' },
              ].map((stage, i) => (
                <motion.div key={stage.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">{stage.icon}</span>
                    <span className="text-sm font-semibold text-white">{stage.label}</span>
                    {i < 2 && <ArrowRight className="w-3 h-3 text-slate-600 ml-auto" />}
                  </div>
                  <div className="rounded-xl border border-white/[0.08] bg-black/30 p-3 overflow-x-auto">
                    <pre className="text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre">{stage.code.trim()}</pre>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl border border-green-500/20 bg-green-500/5">
              <TrendingUp className="w-4 h-4 text-green-400 shrink-0" />
              <p className="text-xs text-slate-400">The JIT reduces <code className="text-green-400">add(a, b)</code> to a single <code className="text-green-400">lea</code> instruction — the absolute minimum work the CPU can do for this operation.</p>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Tiered compilation */}
        <AnimatedSection delay={0.1}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-2">Tiered Compilation (Java 8+)</h2>
            <p className="text-sm text-slate-400 mb-6">HotSpot compiles in 5 tiers — click each to understand the trade-offs between compilation speed and peak performance.</p>

            {/* Tier selector */}
            <div className="flex flex-wrap gap-2 mb-6">
              {TIERS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTier(t.id)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all border"
                  style={{
                    borderColor: activeTier === t.id ? t.color : 'rgba(255,255,255,0.06)',
                    backgroundColor: activeTier === t.id ? `${t.color}20` : 'rgba(255,255,255,0.02)',
                    color: activeTier === t.id ? t.color : '#94a3b8',
                  }}
                >
                  <span className="font-mono">{t.label}</span>
                  <span className="hidden sm:inline text-[10px] opacity-70">{t.name}</span>
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeTier}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span
                        className="text-sm font-bold px-3 py-1 rounded-full"
                        style={{ color: TIERS[activeTier].color, backgroundColor: `${TIERS[activeTier].color}20`, border: `1px solid ${TIERS[activeTier].color}40` }}
                      >
                        {TIERS[activeTier].label} — {TIERS[activeTier].name}
                      </span>
                    </div>
                    <p className="text-sm text-slate-300 leading-relaxed mb-4">{TIERS[activeTier].description}</p>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-6">
                      <span className="font-mono px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">
                        Triggers after: {TIERS[activeTier].invocations} invocations
                      </span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <StatBar label="Relative Performance" value={TIERS[activeTier].perf} color={TIERS[activeTier].color} />
                    <StatBar label="Compilation Overhead" value={activeTier * 20} color={TIERS[activeTier].color} />
                    <StatBar label="Profiling Data Collected" value={[0, 10, 30, 100, 100][activeTier]} color={TIERS[activeTier].color} />
                    <StatBar label="Optimization Depth" value={[5, 30, 45, 60, 100][activeTier]} color={TIERS[activeTier].color} />
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Tier flow */}
            <div className="mt-6 pt-6 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {TIERS.map((t, i) => (
                  <div key={t.id} className="flex items-center gap-2 shrink-0">
                    <div
                      className="flex items-center justify-center px-3 py-2 rounded-lg text-[10px] font-bold border cursor-pointer transition-all"
                      onClick={() => setActiveTier(t.id)}
                      style={{
                        borderColor: `${t.color}40`,
                        backgroundColor: activeTier === t.id ? `${t.color}20` : `${t.color}08`,
                        color: t.color,
                        transform: activeTier === t.id ? 'scale(1.05)' : 'scale(1)',
                      }}
                    >
                      {t.label}
                    </div>
                    {i < TIERS.length - 1 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* JIT Optimizations */}
        <AnimatedSection delay={0.15}>
          <GlassCard className="overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-white">Key JIT Optimizations</h2>
              <p className="text-sm text-slate-400 mt-1">Click an optimization to see before/after code transformations.</p>
            </div>
            <div className="grid lg:grid-cols-4">
              {/* Sidebar */}
              <div className="border-r border-white/[0.06] p-3 space-y-1">
                {OPTIMIZATIONS.map((opt, i) => (
                  <button
                    key={opt.name}
                    onClick={() => setActiveOpt(i)}
                    className={`w-full text-left px-3 py-3 rounded-lg transition-all ${activeOpt === i ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
                  >
                    <p className={`text-xs font-semibold ${activeOpt === i ? 'text-white' : 'text-slate-400'}`}>{opt.name}</p>
                    <p className="text-[10px] text-slate-600 mt-0.5">Speedup: {opt.speedup}</p>
                  </button>
                ))}
              </div>

              {/* Detail */}
              <div className="lg:col-span-3 p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeOpt}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <h3 className="text-lg font-bold text-white">{OPTIMIZATIONS[activeOpt].name}</h3>
                      <span
                        className="text-xs px-2.5 py-1 rounded-full font-semibold"
                        style={{ color: OPTIMIZATIONS[activeOpt].color, backgroundColor: `${OPTIMIZATIONS[activeOpt].color}20`, border: `1px solid ${OPTIMIZATIONS[activeOpt].color}40` }}
                      >
                        {OPTIMIZATIONS[activeOpt].speedup}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 mb-6 leading-relaxed">{OPTIMIZATIONS[activeOpt].description}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-semibold text-red-400 mb-2">Before JIT</div>
                        <CodeBlock code={OPTIMIZATIONS[activeOpt].before} language="java" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-green-400 mb-2">After JIT</div>
                        <CodeBlock code={OPTIMIZATIONS[activeOpt].after} language="java" />
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Deoptimization */}
        <AnimatedSection delay={0.2}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-3">Deoptimization</h2>
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">
              The JIT makes <strong className="text-slate-200">speculative optimizations</strong> based on runtime profiling data. If a new class is loaded that violates an inlining assumption, HotSpot <strong className="text-slate-200">deoptimizes</strong> — reverts the affected frame back to interpreted mode. This is safe and transparent, but has a one-time cost.
            </p>
            <CodeBlock
              code={`// JIT speculatively inlines: assumes Shape → always Circle
void render(Shape s) {
    s.draw(); // devirtualized: directly calls Circle.draw()
}

// Now Triangle is loaded at runtime → assumption broken
// HotSpot deoptimizes render() → reverts to interpreter
// Next ~1K calls profiled again → re-compiled with polymorphism

// -XX:+PrintDeoptimizationDetails  (show deopt events)
// -XX:+PrintCompilation             (show compile/deopt)
`}
              language="java"
              title="Deoptimization Example"
              showLineNumbers
            />
          </GlassCard>
        </AnimatedSection>
      </div>
    </div>
  );
}
