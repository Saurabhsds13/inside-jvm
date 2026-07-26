'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Cpu, Layers, ArrowRight, Clock, GitBranch, AlertTriangle, CheckCircle2, Play } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import CodeBlock from '@/components/ui/CodeBlock';
import StatBar from '@/components/ui/StatBar';

// ── Architecture flow data ────────────────────────────────────────────────────
const ARCHITECTURE_STEPS = [
  { label: 'Request', color: '#64748b', bg: 'bg-white/[0.04]' },
  { label: 'Virtual Thread', color: '#10B981', bg: 'bg-green-500/10' },
  { label: 'JVM Scheduler', color: '#3B82F6', bg: 'bg-blue-500/10' },
  { label: 'Carrier Thread', color: '#F59E0B', bg: 'bg-yellow-500/10' },
  { label: 'CPU Core', color: '#8B5CF6', bg: 'bg-purple-500/10' },
];

// ── Comparison data ───────────────────────────────────────────────────────────
const COMPARISON = {
  platform: {
    label: 'Platform Thread',
    icon: Cpu,
    color: '#EF4444',
    points: [
      'One Java Thread = One OS Thread',
      '~1 MB native stack per thread',
      'Expensive context switching',
      'Limited scalability (~thousands)',
      'Best for CPU-intensive workloads',
    ],
    stats: { memory: 85, scalability: 25, contextSwitch: 20 },
  },
  virtual: {
    label: 'Virtual Thread',
    icon: Zap,
    color: '#10B981',
    points: [
      'Managed entirely by the JVM',
      'Very small memory footprint (~few KB)',
      'Millions can exist simultaneously',
      'Blocking operations are inexpensive',
      'Ideal for I/O-heavy applications',
    ],
    stats: { memory: 10, scalability: 95, contextSwitch: 90 },
  },
};

export default function VirtualThreadsPage() {
  const [activeSchedulerPhase, setActiveSchedulerPhase] = useState<'mount' | 'unmount'>('mount');

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Java 21 • Project Loom"
        title="Virtual"
        titleHighlight="Threads"
        description="Virtual Threads are lightweight JVM-managed threads that allow Java applications to scale to millions of concurrent tasks without creating millions of OS threads."
        icon={Zap}
        iconColor="#10B981"
        gradient="from-green-400 via-emerald-400 to-cyan-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">

        {/* Why Virtual Threads */}
        <AnimatedSection>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-4">Why were Virtual Threads introduced?</h2>
            <div className="space-y-3 text-sm text-slate-400 leading-relaxed">
              <p>
                Traditional Java applications map every Java thread to one operating system thread. While this model
                is simple, OS threads are expensive — each requires ~1 MB of native memory, kernel scheduling, and
                costly context switching.
              </p>
              <p>
                Virtual Threads separate Java concurrency from OS threads. Thousands or even millions of Virtual Threads
                can share a much smaller pool of carrier threads managed by the JVM scheduler, making blocking I/O
                essentially free.
              </p>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Platform vs Virtual Comparison */}
        <div className="grid lg:grid-cols-2 gap-6">
          {Object.entries(COMPARISON).map(([key, data], idx) => {
            const Icon = data.icon;
            return (
              <AnimatedSection key={key} delay={idx * 0.1}>
                <GlassCard className="p-6 h-full">
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${data.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: data.color }} />
                    </div>
                    <h3 className="text-lg font-bold text-white">{data.label}</h3>
                  </div>

                  <ul className="space-y-2.5 mb-6">
                    {data.points.map((point, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-slate-400">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: data.color }} />
                        {point}
                      </li>
                    ))}
                  </ul>

                  <div className="space-y-3 pt-4 border-t border-white/[0.06]">
                    <StatBar label="Memory per thread" value={data.stats.memory} color={data.color} />
                    <StatBar label="Scalability" value={data.stats.scalability} color={data.color} />
                    <StatBar label="Context switch cost" value={data.stats.contextSwitch} color={data.color} />
                  </div>
                </GlassCard>
              </AnimatedSection>
            );
          })}
        </div>

        {/* Architecture Flow */}
        <AnimatedSection delay={0.15}>
          <GlassCard className="overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-sm font-bold text-white">Virtual Thread Architecture</span>
              <span className="ml-auto text-xs text-slate-600">Request → Virtual Thread → Carrier → CPU</span>
            </div>
            <div className="p-6 overflow-x-auto">
              <div className="flex items-center justify-center gap-3 min-w-[700px]">
                {ARCHITECTURE_STEPS.map((step, i) => (
                  <motion.div
                    key={step.label}
                    className="flex items-center gap-3"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <div
                      className={`rounded-xl border px-5 py-3 text-sm font-medium ${step.bg}`}
                      style={{ borderColor: `${step.color}40`, color: step.color }}
                    >
                      {step.label}
                    </div>
                    {i < ARCHITECTURE_STEPS.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Carrier Threads Visualization */}
        <AnimatedSection delay={0.2}>
          <GlassCard className="overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-sm font-bold text-white">Carrier Thread Mapping</span>
            </div>
            <div className="p-6">
              <p className="text-xs text-slate-500 mb-5">
                Virtual Threads execute on a small pool of platform (carrier) threads. The JVM scheduler
                mounts and unmounts them dynamically.
              </p>
              <div className="grid lg:grid-cols-5 gap-4 items-center">
                {/* Virtual Threads */}
                <div className="lg:col-span-2 space-y-2">
                  {[1, 2, 3, 4].map((n) => (
                    <motion.div
                      key={n}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: n * 0.05 }}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-green-500/30 bg-green-500/10"
                    >
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-xs font-mono text-green-400">Virtual Thread #{n}</span>
                    </motion.div>
                  ))}
                </div>

                {/* Scheduler */}
                <div className="flex flex-col items-center gap-2">
                  <ArrowRight className="w-5 h-5 text-slate-600 rotate-0 lg:rotate-0" />
                  <div className="rounded-xl border border-blue-500/30 bg-blue-500/10 p-4 text-center">
                    <Layers className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                    <span className="text-xs font-bold text-blue-400">JVM Scheduler</span>
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-600" />
                </div>

                {/* Carrier Threads */}
                <div className="lg:col-span-2 space-y-2">
                  {[1, 2].map((n) => (
                    <motion.div
                      key={n}
                      initial={{ opacity: 0, x: 10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: n * 0.05 }}
                      className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10"
                    >
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-xs font-mono text-yellow-400">Carrier Thread {n}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Scheduler: Mount/Unmount */}
        <AnimatedSection delay={0.25}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">JVM Scheduler — Mount & Unmount</h2>
            <div className="flex flex-wrap gap-3 mb-5">
              {(['mount', 'unmount'] as const).map((phase) => (
                <button
                  key={phase}
                  onClick={() => setActiveSchedulerPhase(phase)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl border transition-all text-xs font-medium"
                  style={{
                    borderColor: activeSchedulerPhase === phase ? (phase === 'mount' ? '#6366f130' : '#8B5CF630') : 'rgba(255,255,255,0.08)',
                    backgroundColor: activeSchedulerPhase === phase ? (phase === 'mount' ? '#6366f118' : '#8B5CF618') : 'rgba(255,255,255,0.02)',
                    color: activeSchedulerPhase === phase ? (phase === 'mount' ? '#818cf8' : '#a78bfa') : '#94a3b8',
                  }}
                >
                  {phase === 'mount' ? <Play className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {phase === 'mount' ? 'Mount' : 'Unmount'}
                </button>
              ))}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className={`rounded-xl border p-5 transition-all ${activeSchedulerPhase === 'mount' ? 'border-indigo-500/30 bg-indigo-500/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <Clock className="w-5 h-5 text-indigo-400" />
                  <h4 className="text-sm font-bold text-white">Mount</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When a Virtual Thread starts executing, the JVM mounts it onto an available Carrier Thread.
                  It behaves exactly like a normal Java thread while running on the carrier.
                </p>
              </div>
              <div className={`rounded-xl border p-5 transition-all ${activeSchedulerPhase === 'unmount' ? 'border-purple-500/30 bg-purple-500/5' : 'border-white/[0.06] bg-white/[0.02]'}`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <GitBranch className="w-5 h-5 text-purple-400" />
                  <h4 className="text-sm font-bold text-white">Unmount</h4>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  When the Virtual Thread performs a blocking I/O operation, the JVM unmounts it from the Carrier Thread.
                  The Carrier Thread immediately becomes available to execute another Virtual Thread.
                </p>
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Thread Pinning */}
        <AnimatedSection delay={0.3}>
          <GlassCard className="p-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Pinning Warning */}
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <h3 className="text-sm font-bold text-yellow-400">Thread Pinning</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Normally, a Virtual Thread releases its Carrier Thread while waiting for I/O.
                  However, if it enters a <code className="text-yellow-300 font-mono">synchronized</code> block
                  or invokes native code, the JVM cannot safely unmount it. The Carrier Thread becomes
                  <strong className="text-yellow-300"> pinned</strong> until execution completes.
                </p>
                <CodeBlock
                  title="Pinning example"
                  language="java"
                  code={`synchronized(lock) {
    // Carrier thread is PINNED here
    Thread.sleep(5000);
    // Cannot unmount during synchronized
}`}
                />
              </div>

              {/* Better Alternative */}
              <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-5">
                <div className="flex items-center gap-2.5 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <h3 className="text-sm font-bold text-green-400">Better Alternative</h3>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  Use <code className="text-green-300 font-mono">ReentrantLock</code> instead of
                  synchronized blocks. Modern lock implementations cooperate with Virtual Threads
                  and allow unmounting during blocking operations.
                </p>
                <CodeBlock
                  title="Virtual-thread friendly"
                  language="java"
                  code={`ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    // Virtual thread can unmount here
    Thread.sleep(5000);
} finally {
    lock.unlock();
}`}
                />
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Code Examples */}
        <div className="grid md:grid-cols-2 gap-6">
          <AnimatedSection delay={0.35}>
            <CodeBlock
              title="Creating Virtual Threads"
              language="java"
              showLineNumbers
              code={`// Simple virtual thread
Thread.startVirtualThread(() -> {
    System.out.println("Hello from VT!");
});

// Named virtual thread
Thread vt = Thread.ofVirtual()
    .name("my-vt-", 0)
    .start(() -> handleRequest());

// ExecutorService with virtual threads
try (var executor = Executors
        .newVirtualThreadPerTaskExecutor()) {
    executor.submit(() -> fetchFromDb());
    executor.submit(() -> callApi());
    executor.submit(() -> processFile());
}
// All tasks run on virtual threads`}
            />
          </AnimatedSection>
          <AnimatedSection delay={0.4}>
            <CodeBlock
              title="Structured Concurrency (Preview)"
              language="java"
              showLineNumbers
              code={`// Java 21+ (Preview)
try (var scope = new StructuredTaskScope
        .ShutdownOnFailure()) {
    
    Subtask<String> user = scope.fork(
        () -> findUser(id));
    Subtask<Integer> order = scope.fork(
        () -> fetchOrder(id));
    
    scope.join();
    scope.throwIfFailed();
    
    // Both completed successfully
    return new Response(
        user.get(), order.get());
}
// If one fails, the other is cancelled`}
            />
          </AnimatedSection>
        </div>

        {/* Best Practices & Pitfalls */}
        <AnimatedSection delay={0.45}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Best Practices & Pitfalls</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: CheckCircle2, color: '#10B981', title: 'Use for I/O-bound work', desc: 'Virtual threads shine when tasks spend most time waiting for network, disk, or database I/O.' },
                { icon: CheckCircle2, color: '#10B981', title: 'One task per thread', desc: 'Create a virtual thread per task instead of pooling. They are cheap to create and destroy.' },
                { icon: CheckCircle2, color: '#10B981', title: 'Use ReentrantLock', desc: 'Replace synchronized blocks with ReentrantLock to avoid carrier thread pinning.' },
                { icon: AlertTriangle, color: '#F59E0B', title: 'Avoid thread-local abuse', desc: 'ThreadLocals are inherited by virtual threads and can cause memory issues at scale.' },
                { icon: AlertTriangle, color: '#F59E0B', title: 'Not for CPU-bound tasks', desc: 'CPU-intensive work won\'t benefit — virtual threads help with concurrency, not parallelism.' },
                { icon: AlertTriangle, color: '#F59E0B', title: 'Watch for pinning', desc: 'Monitor with -Djdk.tracePinnedThreads=full to detect synchronized-block pinning.' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl border p-4"
                    style={{ borderColor: `${item.color}30`, backgroundColor: `${item.color}05` }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4" style={{ color: item.color }} />
                      <span className="text-xs font-bold text-white">{item.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Key Facts */}
        <AnimatedSection delay={0.5}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Key Facts</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { value: 'Java 21', label: 'GA Release', color: '#10B981' },
                { value: '~few KB', label: 'Memory per VT', color: '#3B82F6' },
                { value: 'Millions', label: 'Concurrent threads', color: '#8B5CF6' },
                { value: 'ForkJoinPool', label: 'Default scheduler', color: '#F59E0B' },
              ].map((fact) => (
                <div key={fact.label} className="rounded-xl border border-white/[0.06] p-4 text-center">
                  <div className="text-xl font-bold" style={{ color: fact.color }}>{fact.value}</div>
                  <div className="text-[10px] text-slate-500 mt-1">{fact.label}</div>
                </div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

      </div>
    </div>
  );
}
