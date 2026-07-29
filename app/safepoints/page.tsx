'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Timer, AlertTriangle, CheckCircle2, Pause, Cpu } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import CodeBlock from '@/components/ui/CodeBlock';
import StatBar from '@/components/ui/StatBar';

// ─── What triggers safepoints ─────────────────────────────────────────────────

const TRIGGERS = [
  { trigger: 'Garbage Collection', desc: 'Every GC cycle requires all threads at a safepoint before it can begin.', frequency: 'Every few seconds (depends on allocation rate)', color: '#10B981' },
  { trigger: 'Deoptimization', desc: 'When JIT-compiled code must be invalidated (new class loaded, uncommon trap taken).', frequency: 'Rare in steady state', color: '#F59E0B' },
  { trigger: 'Thread dump (jstack)', desc: 'Taking a thread dump requires all threads to be at safepoints to get consistent stacks.', frequency: 'Manual / diagnostic only', color: '#3B82F6' },
  { trigger: 'Biased lock revocation', desc: 'Revoking a biased lock requires the biasing thread to be at a safepoint.', frequency: 'Rare (deprecated in Java 15+)', color: '#8B5CF6' },
  { trigger: 'Class redefinition', desc: 'Hot-swapping classes (JVMTI, debugger attach) requires a safepoint.', frequency: 'Development only', color: '#EC4899' },
  { trigger: 'Code cache flushing', desc: 'When the JIT needs to flush compiled code from the code cache.', frequency: 'Very rare', color: '#64748b' },
];

// ─── Time-to-safepoint problems ───────────────────────────────────────────────

const TTSP_PROBLEMS = [
  {
    id: 'counted-loop',
    title: 'Counted Loops (The Classic Problem)',
    color: '#EF4444',
    description: 'JIT-compiled counted loops (for int i=0; i<N; i++) do NOT have safepoint polls inside the loop body. If N is large, the thread cannot reach a safepoint until the loop finishes.',
    badCode: `// This loop has NO safepoint poll inside!
// If GC is requested, ALL other threads wait
// for this thread to finish the entire loop.
for (int i = 0; i < 100_000_000; i++) {
    result += computeSomething(i);
}
// Time-to-safepoint: potentially SECONDS
// All other threads are frozen while waiting!`,
    fixCode: `// FIX 1: Use long instead of int as loop counter
// long loops DO have safepoint polls
for (long i = 0; i < 100_000_000L; i++) {
    result += computeSomething((int)i);
}

// FIX 2: Java 17+ flag (backported to some JDKs)
// -XX:+UseCountedLoopSafepoints
// Inserts safepoint polls every N iterations

// FIX 3: Manually break into smaller chunks
for (int outer = 0; outer < 1000; outer++) {
    for (int inner = 0; inner < 100_000; inner++) {
        result += computeSomething(outer * 100_000 + inner);
    }
    // Safepoint poll happens here (between outer iterations)
}`,
  },
  {
    id: 'native',
    title: 'Long-Running Native Code',
    color: '#F59E0B',
    description: 'When a thread is executing native code (JNI), it is NOT at a safepoint and cannot be interrupted. The JVM must wait for it to return to Java code.',
    badCode: `// Thread calling slow native method
// JVM cannot bring this thread to safepoint
// until the native method returns!
native void slowNativeComputation(); // 500ms

// All GC pauses are extended by however long
// native methods take to complete`,
    fixCode: `// FIX 1: Break native work into smaller calls
// Return to Java periodically
for (int batch = 0; batch < totalBatches; batch++) {
    nativeComputeBatch(batch); // short native call
    // Safepoint poll happens here between native calls
}

// FIX 2: Use -XX:+ThreadLocalHandshakes (default Java 12+)
// Allows per-thread safepoints without global STW

// FIX 3: Critical JNI native methods
// JNI GetPrimitiveArrayCritical pins the thread
// Avoid in latency-sensitive code`,
  },
];

export default function SafepointsPage() {
  const [activeProblem, setActiveProblem] = useState(0);

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Senior / MAANG Level"
        title="Safepoints &"
        titleHighlight="Stop-The-World"
        description="Why the JVM must stop all threads for certain operations, what safepoints are, and how long time-to-safepoint can cause mysterious latency spikes in production."
        icon={Timer}
        iconColor="#F59E0B"
        gradient="from-amber-400 via-orange-400 to-red-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">

        {/* What is a Safepoint */}
        <AnimatedSection>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">What is a Safepoint?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
                <p>
                  A safepoint is a point in the program where the JVM can safely examine and modify the thread&apos;s
                  execution state. At a safepoint, all object references are known, the stack is walkable,
                  and the thread&apos;s state is consistent.
                </p>
                <p>
                  When the JVM needs a <strong className="text-white">Stop-The-World (STW)</strong> pause (e.g., for GC),
                  it sets a global flag and waits for ALL application threads to reach a safepoint. Only when
                  every thread has stopped can the operation proceed.
                </p>
                <p>
                  The time between &quot;JVM requests safepoint&quot; and &quot;all threads have stopped&quot; is called the
                  <strong className="text-amber-400"> time-to-safepoint (TTSP)</strong>. A single slow thread
                  delays the entire operation.
                </p>
              </div>
              <div className="space-y-3">
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <h4 className="text-xs font-bold text-green-400 mb-2">Where safepoint polls exist</h4>
                  <ul className="space-y-1.5 text-[10px] text-slate-400">
                    <li>- Method entry and exit</li>
                    <li>- Loop back-edges (uncounted loops)</li>
                    <li>- Return from native code to Java</li>
                    <li>- After JNI critical section</li>
                    <li>- Allocation slow-path (TLAB refill)</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4">
                  <h4 className="text-xs font-bold text-red-400 mb-2">Where safepoints do NOT exist</h4>
                  <ul className="space-y-1.5 text-[10px] text-slate-400">
                    <li>- Inside JIT-compiled counted loops (int counter)</li>
                    <li>- Inside native code execution</li>
                    <li>- Inside a single bytecode instruction</li>
                  </ul>
                </div>
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* What triggers STW */}
        <AnimatedSection delay={0.1}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">What Triggers Stop-The-World?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TRIGGERS.map((t, i) => (
                <motion.div
                  key={t.trigger}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border p-4"
                  style={{ borderColor: `${t.color}25`, backgroundColor: `${t.color}05` }}
                >
                  <h4 className="text-xs font-bold mb-1" style={{ color: t.color }}>{t.trigger}</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{t.desc}</p>
                  <span className="text-[9px] text-slate-600 italic">{t.frequency}</span>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* TTSP Problems */}
        <AnimatedSection delay={0.15}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-2">Time-to-Safepoint Problems</h2>
            <p className="text-xs text-slate-500 mb-5">These patterns cause unexplained latency spikes that do not show up in GC logs.</p>

            <div className="flex gap-2 mb-5">
              {TTSP_PROBLEMS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => setActiveProblem(i)}
                  className="px-3 py-1.5 rounded-xl border transition-all text-xs font-medium"
                  style={{
                    borderColor: activeProblem === i ? `${p.color}40` : 'rgba(255,255,255,0.08)',
                    backgroundColor: activeProblem === i ? `${p.color}15` : 'rgba(255,255,255,0.02)',
                    color: activeProblem === i ? p.color : '#94a3b8',
                  }}
                >
                  {p.title}
                </button>
              ))}
            </div>

            <motion.div
              key={activeProblem}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <p className="text-xs text-slate-400 leading-relaxed mb-5">
                {TTSP_PROBLEMS[activeProblem].description}
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <CodeBlock
                  title="Problem"
                  language="java"
                  code={TTSP_PROBLEMS[activeProblem].badCode}
                  showLineNumbers
                />
                <CodeBlock
                  title="Fix"
                  language="java"
                  code={TTSP_PROBLEMS[activeProblem].fixCode}
                  showLineNumbers
                />
              </div>
            </motion.div>
          </GlassCard>
        </AnimatedSection>

        {/* Diagnosing safepoint issues */}
        <AnimatedSection delay={0.2}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Diagnosing Safepoint Issues</h2>
            <CodeBlock
              title="Safepoint Diagnostic Flags"
              language="bash"
              showLineNumbers
              code={`# Print safepoint statistics (Java 9+)
java -Xlog:safepoint=info -jar app.jar

# Detailed safepoint timing (shows TTSP)
java -Xlog:safepoint*=debug -jar app.jar

# JFR: captures safepoint events automatically
jcmd <pid> JFR.start duration=60s filename=app.jfr

# In JFR recording, look for:
# jdk.SafepointBegin    - when safepoint was requested
# jdk.SafepointEnd      - when all threads reached safepoint  
# jdk.SafepointStateSynchronization - TTSP duration
# High TTSP (>50ms) indicates a thread stuck in a counted loop or native

# Java 17+ flag to fix counted loop problem:
java -XX:+UseCountedLoopSafepoints -jar app.jar
# Adds safepoint polls inside counted loops (small perf cost)`}
            />
          </GlassCard>
        </AnimatedSection>

        {/* Interview Questions */}
        <AnimatedSection delay={0.25}>
          <GlassCard className="p-6">
            <div className="mb-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400">MAANG Interview</span>
              <h2 className="text-lg font-bold text-white mt-1">Safepoint Interview Questions</h2>
            </div>
            {[
              { q: 'What is a safepoint in the JVM?', a: 'A safepoint is a point in program execution where the thread\'s state is fully known: all object references are trackable, the stack is walkable, and no partial operations are in progress. The JVM inserts safepoint polls at method returns, loop back-edges, and allocation points. When a STW operation is needed, all threads must reach a safepoint before it can proceed.' },
              { q: 'Why can a simple for loop cause latency spikes?', a: 'JIT-compiled counted loops (int counter with known bounds) do not have safepoint polls inside the loop body. If the loop runs for millions of iterations, the thread cannot reach a safepoint until the loop finishes. All other threads that have already reached their safepoint are frozen, waiting for this one slow thread. Fix: use long counter, -XX:+UseCountedLoopSafepoints, or break into smaller loops.' },
              { q: 'How do you diagnose time-to-safepoint issues?', a: 'Use -Xlog:safepoint*=debug to see TTSP per safepoint. Look for "spinning" time (waiting for threads) vs "blocking" time (actual STW operation). JFR jdk.SafepointStateSynchronization events show which thread was slowest. Then correlate with jstack to find what the slow thread was doing (usually a hot counted loop).' },
              { q: 'What is the difference between a safepoint and a checkpoint?', a: 'A safepoint is global: ALL threads must stop. A checkpoint (Thread-Local Handshake, Java 10+) targets individual threads without stopping others. This allows per-thread operations (biased lock revocation, stack walking) without global STW. Enabled by default since Java 12.' },
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
