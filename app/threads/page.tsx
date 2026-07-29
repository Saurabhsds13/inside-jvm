'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, Play, Pause, RotateCcw, Lock, Unlock, AlertTriangle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import CodeBlock from '@/components/ui/CodeBlock';

type ThreadState = 'NEW' | 'RUNNABLE' | 'BLOCKED' | 'WAITING' | 'TIMED_WAITING' | 'TERMINATED';

interface Thread {
  id: string;
  name: string;
  state: ThreadState;
  color: string;
  stackFrames: string[];
  holding?: string;
  waiting?: string;
  progress: number;
}

const STATE_STYLES: Record<ThreadState, { bg: string; border: string; text: string; dot: string }> = {
  NEW:           { bg: 'bg-slate-500/10',   border: 'border-slate-500/30',   text: 'text-slate-400',  dot: '#64748b' },
  RUNNABLE:      { bg: 'bg-green-500/10',   border: 'border-green-500/30',   text: 'text-green-400',  dot: '#10B981' },
  BLOCKED:       { bg: 'bg-red-500/10',     border: 'border-red-500/30',     text: 'text-red-400',    dot: '#EF4444' },
  WAITING:       { bg: 'bg-yellow-500/10',  border: 'border-yellow-500/30',  text: 'text-yellow-400', dot: '#F59E0B' },
  TIMED_WAITING: { bg: 'bg-orange-500/10',  border: 'border-orange-500/30',  text: 'text-orange-400', dot: '#F97316' },
  TERMINATED:    { bg: 'bg-slate-700/10',   border: 'border-slate-700/30',   text: 'text-slate-600',  dot: '#334155' },
};

const SCENARIOS: {
  name: string;
  description: string;
  threads: Thread[];
  heapObjects: string[];
  lockOwner: string | null;
  hasDeadlock: boolean;
}[] = [
  {
    name: 'Normal Execution',
    description: 'Three threads running concurrently — each has its own stack but shares the heap.',
    threads: [
      { id: 't1', name: 'main', state: 'RUNNABLE' as ThreadState, color: '#3B82F6', stackFrames: ['run()', 'processData()', 'allocate()'], progress: 70 },
      { id: 't2', name: 'worker-1', state: 'RUNNABLE' as ThreadState, color: '#8B5CF6', stackFrames: ['run()', 'compute()'], progress: 45 },
      { id: 't3', name: 'worker-2', state: 'TIMED_WAITING' as ThreadState, color: '#10B981', stackFrames: ['sleep(500)'], progress: 20 },
    ],
    heapObjects: ['SharedCache (HashMap)', 'Config (static)', 'ResultList', 'Logger'],
    lockOwner: null,
    hasDeadlock: false,
  },
  {
    name: 'Lock Contention',
    description: 'Thread-2 holds the monitor lock. Thread-1 and Thread-3 are BLOCKED waiting to acquire it.',
    threads: [
      { id: 't1', name: 'worker-1', state: 'BLOCKED' as ThreadState, color: '#3B82F6', stackFrames: ['monitorEnter(counter)', 'increment()'], waiting: 'counter_lock', progress: 0 },
      { id: 't2', name: 'worker-2', state: 'RUNNABLE' as ThreadState, color: '#10B981', stackFrames: ['synchronized(counter)', 'increment()', 'compute()'], holding: 'counter_lock', progress: 55 },
      { id: 't3', name: 'worker-3', state: 'BLOCKED' as ThreadState, color: '#F59E0B', stackFrames: ['monitorEnter(counter)', 'increment()'], waiting: 'counter_lock', progress: 0 },
    ],
    heapObjects: ['counter (AtomicInt)', 'SharedCache', 'Config'],
    lockOwner: 't2',
    hasDeadlock: false,
  },
  {
    name: 'Deadlock',
    description: 'Thread-A holds Lock-1 and waits for Lock-2. Thread-B holds Lock-2 and waits for Lock-1. Neither can proceed.',
    threads: [
      { id: 't1', name: 'Thread-A', state: 'BLOCKED' as ThreadState, color: '#EF4444', stackFrames: ['waiting for Lock-2', 'synchronized(lock1)', 'transfer()'], holding: 'lock1', waiting: 'lock2', progress: 0 },
      { id: 't2', name: 'Thread-B', state: 'BLOCKED' as ThreadState, color: '#F97316', stackFrames: ['waiting for Lock-1', 'synchronized(lock2)', 'transfer()'], holding: 'lock2', waiting: 'lock1', progress: 0 },
    ],
    heapObjects: ['Lock-1 (monitor)', 'Lock-2 (monitor)', 'Account A', 'Account B'],
    lockOwner: null,
    hasDeadlock: true,
  },
];

export default function ThreadsPage() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);

  const scenario = SCENARIOS[scenarioIdx];

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setTick((t) => t + 1), 600);
    return () => clearInterval(id);
  }, [running]);

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Concurrency"
        title="Threads &"
        titleHighlight="Concurrency"
        description="Visualize how JVM threads share a heap, compete for monitor locks, and can end up in deadlock. Explore all six Thread.State values."
        icon={GitBranch}
        iconColor="#EC4899"
        gradient="from-pink-400 via-rose-400 to-orange-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">

        {/* Scenario selector + controls */}
        <AnimatedSection>
          <GlassCard className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              {SCENARIOS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setScenarioIdx(i); setRunning(false); setTick(0); }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    scenarioIdx === i
                      ? 'bg-pink-600/20 border-pink-500/40 text-pink-400'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.15] hover:text-white'
                  }`}
                >
                  {s.hasDeadlock && <AlertTriangle className="w-3 h-3 text-red-400" />}
                  {s.name}
                </button>
              ))}
              <div className="flex-1" />
              <button
                onClick={() => setRunning((v) => !v)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-white/[0.08] text-slate-300 hover:text-white transition-all"
              >
                {running ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                {running ? 'Pause' : 'Animate'}
              </button>
              <button
                onClick={() => { setRunning(false); setTick(0); }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-white/[0.08] text-slate-400 hover:text-white transition-all"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3">{scenario.description}</p>
          </GlassCard>
        </AnimatedSection>

        {/* Main visualization */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Thread stacks */}
          <AnimatedSection className="lg:col-span-3">
            <GlassCard className="h-full">
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-pink-400" />
                <span className="text-sm font-bold text-white">Thread Stacks</span>
                <span className="ml-auto text-xs text-slate-600">Each thread has an independent stack</span>
              </div>
              <div className="p-5 grid gap-4" style={{ gridTemplateColumns: `repeat(${scenario.threads.length}, 1fr)` }}>
                {scenario.threads.map((thread, ti) => {
                  const ss = STATE_STYLES[thread.state];
                  return (
                    <motion.div
                      key={thread.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: ti * 0.1 }}
                    >
                      {/* Thread header */}
                      <div
                        className={`rounded-t-xl border-b-0 border p-3 ${ss.bg} ${ss.border}`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-bold" style={{ color: thread.color }}>{thread.name}</span>
                          {thread.holding && <Lock className="w-3 h-3 text-yellow-400" />}
                        </div>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${ss.bg} ${ss.text}`}>
                          {thread.state}
                        </span>

                        {/* Progress bar for RUNNABLE */}
                        {thread.state === 'RUNNABLE' && (
                          <div className="mt-2 h-1 bg-black/30 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full rounded-full"
                              style={{ backgroundColor: thread.color }}
                              animate={running ? { width: ['0%', '100%'] } : { width: `${thread.progress}%` }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Stack frames */}
                      <div className="border border-t-0 rounded-b-xl border-white/[0.06] bg-black/10 divide-y divide-white/[0.04]">
                        {thread.stackFrames.map((frame, fi) => (
                          <div
                            key={fi}
                            className="px-3 py-2 text-[10px] font-mono"
                            style={{ color: fi === 0 ? thread.color : '#475569' }}
                          >
                            {fi === 0 && <span className="text-[8px] text-slate-600 mr-1">▶</span>}
                            {frame}
                          </div>
                        ))}
                      </div>

                      {/* Lock info */}
                      {thread.waiting && (
                        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-red-400 px-1">
                          <Lock className="w-3 h-3" />
                          <span>Waiting for {thread.waiting}</span>
                        </div>
                      )}
                      {thread.holding && (
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-yellow-400 px-1">
                          <Unlock className="w-3 h-3" />
                          <span>Holds {thread.holding}</span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </GlassCard>
          </AnimatedSection>

          {/* Shared Heap */}
          <AnimatedSection className="lg:col-span-2" delay={0.1}>
            <GlassCard className="h-full">
              <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-sm font-bold text-white">Shared Heap</span>
              </div>
              <div className="p-5 space-y-3">
                <p className="text-xs text-slate-500">All threads share these objects in the heap. Unsynchronized access causes data races.</p>
                {scenario.heapObjects.map((obj, i) => (
                  <motion.div
                    key={obj}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-purple-500/20 bg-purple-500/05"
                  >
                    <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                    <span className="text-xs font-mono text-slate-300">{obj}</span>
                    {(scenario.lockOwner && obj.includes('counter')) && (
                      <Lock className="w-3.5 h-3.5 text-yellow-400 ml-auto" />
                    )}
                  </motion.div>
                ))}

                {/* Deadlock alert */}
                {scenario.hasDeadlock && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 mt-4"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-sm font-semibold text-red-400">Deadlock Detected</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Thread-A holds Lock-1, needs Lock-2.<br />
                      Thread-B holds Lock-2, needs Lock-1.<br />
                      Neither can proceed. Use <code className="text-red-300">jstack</code> to diagnose.
                    </p>
                  </motion.div>
                )}
              </div>
            </GlassCard>
          </AnimatedSection>
        </div>

        {/* Thread States reference */}
        <AnimatedSection delay={0.15}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Thread.State Reference</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(Object.entries(STATE_STYLES) as [ThreadState, typeof STATE_STYLES[ThreadState]][]).map(([state, style]) => (
                <div key={state} className={`rounded-xl border p-4 ${style.bg} ${style.border}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: style.dot }} />
                    <span className={`text-xs font-bold font-mono ${style.text}`}>{state}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    {state === 'NEW' && 'Thread created with new Thread() but start() not yet called.'}
                    {state === 'RUNNABLE' && 'Executing on CPU or ready to execute (in OS scheduler queue).'}
                    {state === 'BLOCKED' && 'Waiting to acquire a monitor lock (synchronized block/method).'}
                    {state === 'WAITING' && 'Indefinitely waiting: Object.wait(), Thread.join(), LockSupport.park().'}
                    {state === 'TIMED_WAITING' && 'Waiting with timeout: Thread.sleep(n), Object.wait(n), join(n).'}
                    {state === 'TERMINATED' && 'run() method completed normally or threw an uncaught exception.'}
                  </p>
                </div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Code examples */}
        <div className="grid md:grid-cols-2 gap-6">
          <AnimatedSection>
            <CodeBlock
              title="Creating and managing threads"
              language="java"
              showLineNumbers
              code={`// Platform thread (1:1 with OS thread)
Thread t = new Thread(() -> {
    System.out.println("Running: " 
        + Thread.currentThread().getName());
}, "worker-1");
t.setDaemon(false);
t.setPriority(Thread.NORM_PRIORITY);
t.start(); // moves: NEW → RUNNABLE

// Virtual thread (Java 21+)
Thread vt = Thread.ofVirtual()
    .name("virtual-1")
    .start(() -> doWork());
// Millions of virtual threads OK — JVM manages them

// ExecutorService
var pool = Executors.newFixedThreadPool(4);
Future<Integer> f = pool.submit(() -> compute());
int result = f.get(); // blocks until done`}
            />
          </AnimatedSection>
          <AnimatedSection delay={0.1}>
            <CodeBlock
              title="Synchronization patterns"
              language="java"
              showLineNumbers
              code={`// Monitor lock (intrinsic lock)
synchronized (sharedObject) {
    counter++;  // atomic read-modify-write
}

// ReentrantLock — more control
Lock lock = new ReentrantLock(true); // fair
lock.lock();
try {
    // critical section
} finally {
    lock.unlock(); // always release
}

// Avoid deadlock: always acquire locks in same order
// BAD:  t1: lock(A) then lock(B)
//       t2: lock(B) then lock(A)  ← deadlock
// GOOD: both threads: lock(A) then lock(B)

// Detect deadlock at runtime:
// jstack <pid> | grep -A 5 "deadlock"`}
            />
          </AnimatedSection>
        </div>
        {/* Synchronization Internals */}
        <AnimatedSection delay={0.2}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-2">Synchronization Internals</h2>
            <p className="text-xs text-slate-500 mb-5">How the JVM implements the synchronized keyword at the bytecode and hardware level.</p>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <h4 className="text-xs font-bold text-blue-400 mb-2">Bytecode Level</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    The compiler translates <code className="text-blue-300">synchronized</code> blocks into
                    <code className="text-blue-300"> monitorenter</code> and <code className="text-blue-300">monitorexit</code> bytecodes.
                    Each object has an associated monitor. A thread must acquire the monitor before entering the block
                    and release it when exiting (including via exception).
                  </p>
                </div>
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <h4 className="text-xs font-bold text-purple-400 mb-2">Object Header (Mark Word)</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    Every Java object has a mark word in its header (64 bits on 64-bit JVM). The mark word stores:
                    identity hashCode, GC age, and <strong className="text-white">lock state bits</strong>.
                    The lock state determines which locking mechanism is active: biased, thin, or fat.
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  { state: 'Biased Lock', color: '#10B981', desc: 'Optimistic: assumes only one thread ever uses this lock. Zero CAS operations. Mark word stores the biasing thread ID. If another thread tries to acquire, bias is revoked (requires safepoint). Deprecated since Java 15.' },
                  { state: 'Thin Lock (Lightweight)', color: '#F59E0B', desc: 'Uses CAS to write the lock record pointer into the mark word. No OS involvement. Spins briefly if contested. If spin fails or multiple threads wait, inflates to fat lock.' },
                  { state: 'Fat Lock (Heavyweight)', color: '#EF4444', desc: 'Allocates an OS mutex (ObjectMonitor in HotSpot). Threads that fail to acquire are parked by the OS (context switch). Used when real contention exists. Most expensive but fair.' },
                ].map((item) => (
                  <div key={item.state} className="rounded-xl border p-3" style={{ borderColor: `${item.color}25`, backgroundColor: `${item.color}05` }}>
                    <h4 className="text-xs font-bold mb-1" style={{ color: item.color }}>{item.state}</h4>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <CodeBlock
              title="Lock escalation flow"
              language="java"
              showLineNumbers
              code={`// Lock state transitions in the object header mark word:
//
// No lock → Biased Lock → Thin Lock → Fat Lock
//            (one thread)   (CAS spin)   (OS mutex)
//
// Bytecode for synchronized block:
//   monitorenter  ← acquire object's monitor
//   ... critical section ...
//   monitorexit   ← release object's monitor
//   monitorexit   ← second exit for exception path
//
// JVM optimization: Lock Coarsening
synchronized(obj) { x++; }
synchronized(obj) { y++; }
// JIT merges into:
synchronized(obj) { x++; y++; }  // one lock/unlock
//
// JVM optimization: Lock Elision (via Escape Analysis)
void local() {
    Object lock = new Object(); // never escapes
    synchronized(lock) { ... }  // JIT removes entirely
}`}
            />
          </GlassCard>
        </AnimatedSection>
      </div>
    </div>
  );
}
