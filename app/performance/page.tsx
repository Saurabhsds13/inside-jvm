'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gauge, Zap, Cpu, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import CodeBlock from '@/components/ui/CodeBlock';
import StatBar from '@/components/ui/StatBar';

// ─── Performance Patterns ─────────────────────────────────────────────────────

interface PerfPattern {
  id: string;
  name: string;
  color: string;
  what: string;
  how: string;
  impact: string;
  code: string;
  stats: { label: string; value: number }[];
}

const PATTERNS: PerfPattern[] = [
  {
    id: 'escape-analysis',
    name: 'Escape Analysis',
    color: '#3B82F6',
    what: 'The JIT compiler analyzes whether an object escapes the method that created it. If it does not escape (never stored in a field, never returned, never passed to another method that publishes it), the JVM can apply powerful optimizations.',
    how: 'C2 JIT performs escape analysis at Tier 4. If an object is proven non-escaping, three optimizations become possible: scalar replacement (allocate on stack instead of heap), lock elision (remove synchronization), and allocation elimination.',
    impact: 'Eliminates heap allocation entirely for short-lived objects. No GC pressure. Fields are placed directly in CPU registers. Can turn object-heavy code into zero-allocation code.',
    code: `public int sumPoints() {
    int total = 0;
    for (int i = 0; i < 1000; i++) {
        // This Point DOES NOT escape sumPoints()
        // JIT will scalar-replace it:
        // no heap allocation, x/y in registers
        Point p = new Point(i, i * 2);
        total += p.getX() + p.getY();
    }
    return total;
    // After JIT: zero object allocations!
    // Equivalent to: total += i + i*2 (scalar)
}

// Verify with: -XX:+PrintEscapeAnalysis
// Disable with: -XX:-DoEscapeAnalysis (benchmarking)`,
    stats: [
      { label: 'Allocation reduction', value: 95 },
      { label: 'GC pressure reduction', value: 90 },
      { label: 'Speedup (tight loops)', value: 80 },
    ],
  },
  {
    id: 'intrinsics',
    name: 'JVM Intrinsics',
    color: '#10B981',
    what: 'Certain Java methods are recognized by the JVM and replaced with hand-crafted, platform-specific machine code instead of being JIT-compiled from bytecode. These are called intrinsics.',
    how: 'The JIT compiler has a list of known methods (System.arraycopy, Math.*, String.equals, Object.hashCode, Unsafe.*, etc). When it encounters one, it emits pre-written optimized assembly instead of compiling the Java implementation.',
    impact: 'Intrinsified methods can be 10-100x faster than their Java implementation would be. They use CPU-specific instructions (SIMD, CAS, memory barriers) that Java bytecode cannot express.',
    code: `// These are all JVM intrinsics:

System.arraycopy(src, 0, dst, 0, len);
// Emits: REP MOVSB / SIMD memcpy (not a loop!)

Math.min(a, b);
// Emits: CMOV instruction (branchless)

Arrays.equals(arr1, arr2);
// Emits: SIMD comparison (compares 32 bytes at once)

Thread.currentThread();
// Emits: single register read (thread pointer)

object.hashCode(); // identity hash
// Emits: reads from object header directly

// See all intrinsics:
// -XX:+PrintIntrinsics (debug JVM)
// Or: HotSpot source vmIntrinsics.hpp`,
    stats: [
      { label: 'Method replacement rate', value: 70 },
      { label: 'Speedup vs Java impl', value: 90 },
      { label: 'SIMD utilization', value: 75 },
    ],
  },
  {
    id: 'false-sharing',
    name: 'False Sharing',
    color: '#EF4444',
    what: 'When two threads write to different fields that happen to be on the same CPU cache line (64 bytes), the hardware invalidates the entire cache line on every write. Both threads constantly fight over the cache line, destroying performance.',
    how: 'CPU caches operate on 64-byte cache lines, not individual bytes. If Thread A writes field X and Thread B writes field Y, but X and Y are adjacent in memory (same object or array), every write by A invalidates B\'s cache and vice versa.',
    impact: 'False sharing can make multi-threaded code 10-50x slower than single-threaded. It is invisible in code and undetectable without hardware counters or JMH benchmarks.',
    code: `// BAD: counter1 and counter2 on same cache line
class SharedCounters {
    volatile long counter1; // offset 16
    volatile long counter2; // offset 24 (SAME cache line!)
}
// Thread 1 writes counter1, Thread 2 writes counter2
// Result: constant cache-line bouncing, 10x slower

// FIX: Pad to separate cache lines (64 bytes apart)
class PaddedCounters {
    volatile long counter1;
    long p1, p2, p3, p4, p5, p6, p7; // 56 bytes padding

    volatile long counter2; // now on a different cache line
}

// Java 8+: @Contended annotation (JDK internal)
// @jdk.internal.vm.annotation.Contended
// Requires: --add-opens java.base/jdk.internal.vm.annotation

// JMH: detect with -prof perfnorm (cache misses)`,
    stats: [
      { label: 'Slowdown without fix', value: 90 },
      { label: 'Cache miss rate', value: 85 },
      { label: 'Fix effectiveness', value: 95 },
    ],
  },
  {
    id: 'branch-prediction',
    name: 'Branch Prediction & Speculative Opts',
    color: '#8B5CF6',
    what: 'The JIT compiler profiles which branch (if/else) is taken most often and generates code optimized for the common path. If the prediction is wrong, the JVM deoptimizes and recompiles.',
    how: 'During Tier 3 (C1 with full profiling), the JVM records branch frequencies. C2 then generates code assuming the hot branch. The cold branch may not even be compiled until needed (uncommon trap).',
    impact: 'Polymorphic call sites with 1-2 receiver types get inlined directly. Megamorphic sites (3+ types) fall back to vtable dispatch. Keeping hierarchies shallow and call sites monomorphic is key.',
    code: `// Monomorphic: JIT inlines directly (fastest)
Animal a = new Dog(); // always Dog
a.speak(); // inlined: Dog.speak() body here

// Bimorphic: JIT generates type check + 2 inlines
Animal a = random ? new Dog() : new Cat();
a.speak(); // if (a instanceof Dog) dog.speak else cat.speak

// Megamorphic: falls back to vtable (slow)
Animal a = getRandomAnimal(); // Dog, Cat, Bird, Fish...
a.speak(); // vtable lookup every call

// Profile-guided optimization flags:
// -XX:+PrintCompilation (see deoptimizations: "made not entrant")
// -XX:MaxInlineLevel=15 (inline depth)
// -XX:FreqInlineSize=325 (max bytecodes to inline for hot methods)`,
    stats: [
      { label: 'Monomorphic speedup', value: 95 },
      { label: 'Bimorphic overhead', value: 30 },
      { label: 'Megamorphic penalty', value: 75 },
    ],
  },
  {
    id: 'numa',
    name: 'NUMA-Aware Allocation',
    color: '#F59E0B',
    what: 'On multi-socket servers, memory access time depends on which CPU socket the memory belongs to. NUMA-aware allocation ensures objects are allocated on the memory node closest to the thread that uses them.',
    how: 'With -XX:+UseNUMA, the JVM allocates Eden space per-NUMA-node. Each GC thread promotes objects to the Old Gen region on the same node. This minimizes cross-socket memory traffic.',
    impact: 'On 2-4 socket servers, NUMA-aware allocation can improve throughput by 20-40%. Irrelevant on single-socket machines (most developer laptops). Critical for large-heap database/cache applications.',
    code: `// Enable NUMA-aware allocation
java -XX:+UseNUMA -XX:+UseParallelGC -jar app.jar

// Works best with:
// - Parallel GC or G1 GC
// - Large heaps (32GB+)
// - Multi-socket servers (2+ CPU sockets)
// - Workloads with thread-local data patterns

// Check NUMA topology:
// Linux: numactl --hardware
// Shows: node 0: CPUs 0-15, memory 64GB
//        node 1: CPUs 16-31, memory 64GB

// Monitor: -XX:+PrintGCDetails shows NUMA stats
// JFR: jdk.NUMANode events

// Not useful for:
// - Single-socket machines
// - Small heaps
// - Cloud VMs (usually single NUMA node)`,
    stats: [
      { label: 'Multi-socket throughput gain', value: 35 },
      { label: 'Cross-node latency reduction', value: 60 },
      { label: 'Applicability (servers only)', value: 30 },
    ],
  },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function PerformancePage() {
  const [selectedPattern, setSelectedPattern] = useState(0);
  const pattern = PATTERNS[selectedPattern];

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Senior / MAANG Level"
        title="JVM Performance"
        titleHighlight="Patterns"
        description="Deep optimizations the HotSpot JVM applies automatically and patterns you must know for writing truly high-performance Java. Escape analysis, intrinsics, false sharing, and more."
        icon={Gauge}
        iconColor="#10B981"
        gradient="from-emerald-400 via-green-400 to-teal-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">

        {/* Pattern Selector */}
        <AnimatedSection>
          <div className="flex flex-wrap gap-2">
            {PATTERNS.map((p, i) => (
              <button
                key={p.id}
                onClick={() => setSelectedPattern(i)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium"
                style={{
                  borderColor: selectedPattern === i ? `${p.color}50` : 'rgba(255,255,255,0.08)',
                  backgroundColor: selectedPattern === i ? `${p.color}18` : 'rgba(255,255,255,0.02)',
                  color: selectedPattern === i ? p.color : '#94a3b8',
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* Pattern Detail */}
        <AnimatedSection delay={0.05}>
          <motion.div
            key={pattern.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Info */}
            <GlassCard className="p-6">
              <h2 className="text-lg font-bold text-white mb-3">{pattern.name}</h2>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">What</span>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{pattern.what}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: pattern.color }}>How it works</span>
                  <p className="text-xs text-slate-300 leading-relaxed mt-1">{pattern.how}</p>
                </div>
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">Impact</span>
                  <p className="text-xs text-slate-400 leading-relaxed mt-1">{pattern.impact}</p>
                </div>

                <div className="pt-3 border-t border-white/[0.06] space-y-3">
                  {pattern.stats.map((s) => (
                    <StatBar key={s.label} label={s.label} value={s.value} color={pattern.color} />
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Code */}
            <div className="lg:col-span-2">
              <CodeBlock
                title={pattern.name}
                language="java"
                code={pattern.code}
                showLineNumbers
              />
            </div>
          </motion.div>
        </AnimatedSection>

        {/* Interview Questions */}
        <AnimatedSection delay={0.15}>
          <GlassCard className="p-6">
            <div className="mb-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-green-400">MAANG Interview</span>
              <h2 className="text-lg font-bold text-white mt-1">Performance Interview Questions</h2>
            </div>
            {[
              { q: 'What is escape analysis and how does it help performance?', a: 'Escape analysis determines if an object is only used within the method that creates it (does not escape). If so, the JVM can: 1) Scalar-replace it (put fields in registers, no heap allocation), 2) Eliminate synchronization on it (lock elision), 3) Eliminate the allocation entirely. This turns heap allocations into stack operations with zero GC pressure.' },
              { q: 'What is false sharing and how do you fix it?', a: 'False sharing occurs when two threads write to different variables that share the same CPU cache line (64 bytes). Each write invalidates the other core\'s cache, causing constant cache-line bouncing. Fix by padding fields to 64-byte boundaries (@Contended annotation or manual padding). Detect with JMH -prof perfnorm (high L1 cache miss rate).' },
              { q: 'What are JVM intrinsics? Give examples.', a: 'Intrinsics are Java methods that the JIT replaces with hand-written native assembly instead of compiling from bytecode. Examples: System.arraycopy (SIMD memcpy), Math.min (CMOV), Arrays.equals (vectorized comparison), Thread.currentThread (register read), Unsafe.compareAndSwap (CAS instruction). They provide 10-100x speedup over bytecode-compiled equivalents.' },
              { q: 'Explain monomorphic vs megamorphic call sites.', a: 'Monomorphic: only one receiver type ever seen at a call site - JIT inlines directly (fastest). Bimorphic: two types - JIT generates a type check + two inlined paths. Megamorphic: 3+ types - falls back to vtable dispatch (slow). The JIT profiles every call site. Keep hierarchies shallow and avoid unnecessary polymorphism in hot paths.' },
              { q: 'When does the JVM deoptimize compiled code?', a: 'Deoptimization happens when a speculative optimization is invalidated: class hierarchy changes (new subclass loaded), branch profile changes (uncommon path taken), null check fails, array bounds check fails, or type check fails. The JVM discards the native code, falls back to interpreter, re-profiles, and recompiles with updated assumptions.' },
            ].map((item, i) => (
              <motion.div
                key={i}
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

      </div>
    </div>
  );
}
