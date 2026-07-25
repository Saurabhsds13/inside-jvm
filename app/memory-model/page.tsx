'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, CheckCircle2, ArrowRight, Cpu, Database } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import CodeBlock from '@/components/ui/CodeBlock';

const CONCEPTS = [
  {
    id: 'visibility',
    title: 'Visibility',
    icon: '👁',
    color: '#3B82F6',
    description: 'Without synchronization, a write by Thread A to a shared variable may not be visible to Thread B. Each thread may work with a locally-cached copy of the variable in its CPU register or L1/L2 cache.',
    problem: `// Thread A writes:
flag = true;  // may stay in CPU cache!

// Thread B reads:
while (!flag) {} // may spin forever — sees stale false
System.out.println("Done"); // may never print`,
    solution: `// volatile: writes flushed to main memory
// reads always from main memory
volatile boolean flag = false;

// Thread A:
flag = true;  // immediately visible to all threads

// Thread B:
while (!flag) {} // guaranteed to see the latest value`,
    rule: 'A write to a volatile variable happens-before every subsequent read of that same variable.',
  },
  {
    id: 'ordering',
    title: 'Ordering & Reordering',
    icon: '🔀',
    color: '#8B5CF6',
    description: 'The JVM and CPU are free to reorder instructions for performance — as long as the result is the same in a single-threaded view. This can break multi-threaded code in subtle ways.',
    problem: `// These two writes may be reordered by JIT / CPU:
value = 42;       // (1)
initialized = true; // (2) — may execute BEFORE (1)!

// Thread B:
if (initialized) {
    System.out.println(value); // may print 0!
}`,
    solution: `// volatile on initialized prevents reordering
volatile boolean initialized = false;
int value = 0;

// Thread A:
value = 42;          // guaranteed BEFORE...
initialized = true;  // ...this volatile write

// Thread B: guaranteed to see value = 42
if (initialized) {
    System.out.println(value); // always 42
}`,
    rule: 'A volatile write may not be reordered with any preceding write. A volatile read may not be reordered with any subsequent read/write.',
  },
  {
    id: 'happens-before',
    title: 'Happens-Before',
    icon: '⏱',
    color: '#10B981',
    description: 'Happens-before (HB) is the core guarantee of the JMM. If action A HB action B, all memory writes by A (and actions that HB A) are visible to B. HB is transitive: if A HB B and B HB C, then A HB C.',
    problem: `// No happens-before — any result is valid
int x = 0, y = 0;
// Thread 1: x = 1, then r1 = y
// Thread 2: y = 1, then r2 = x
// Possible outcomes: r1=0 r2=0 (both see stale values!)`,
    solution: `// Happens-before rules:
// 1. Monitor unlock HB subsequent lock of same monitor
synchronized(lock) { x = 1; }         // unlock
// ...
synchronized(lock) { r1 = x; }        // lock — sees x=1

// 2. volatile write HB subsequent volatile read
volatile int v;
v = 42;    // write
int r = v; // read — guaranteed to see 42

// 3. Thread.start() HB all actions in started thread
// 4. All actions in thread HB thread.join() return`,
    rule: 'HB is the only safe guarantee for cross-thread memory visibility. Without an HB edge, data races are undefined behavior in the JMM.',
  },
  {
    id: 'atomicity',
    title: 'Atomicity',
    icon: '⚛',
    color: '#F59E0B',
    description: 'An operation is atomic if it appears to happen instantaneously. In Java, reads/writes to int, boolean, byte, char, short, float are atomic. long and double are NOT atomic on 32-bit JVMs (word tearing). Compound operations (i++) are never atomic.',
    problem: `// i++ is NOT atomic — three operations:
// 1. read i  (e.g., 0)
// 2. increment (0 → 1)
// 3. write i
// Thread B can read between steps 1 and 3!
int i = 0;
i++; // race condition if shared across threads`,
    solution: `// Use AtomicInteger for lock-free atomic ops
AtomicInteger i = new AtomicInteger(0);
i.incrementAndGet(); // CAS: atomic read-modify-write

// Or synchronized:
synchronized (this) { count++; } // mutual exclusion

// volatile alone NOT enough for compound ops:
volatile int counter = 0;
counter++; // STILL NOT ATOMIC — race condition!`,
    rule: 'volatile guarantees visibility but not atomicity of compound operations. Use AtomicXxx or synchronized for read-modify-write operations.',
  },
  {
    id: 'final',
    title: 'Final Fields',
    icon: '🔒',
    color: '#06B6D4',
    description: 'The JMM has a special rule for final fields: after a constructor completes, all threads are guaranteed to see the final field values without any explicit synchronization — as long as the "this" reference does not escape the constructor.',
    problem: `// Without final — unsafe publication
class Config {
    int timeout;   // not final
    String host;   // not final
    Config() { timeout = 30; host = "localhost"; }
}
// Another thread may see Config with default values!
// timeout = 0, host = null if not safely published`,
    solution: `// final fields: safely published after constructor
class Config {
    final int timeout;
    final String host;
    Config() {
        timeout = 30;     // written before constructor end
        host = "localhost";
    }
}
// ANY thread that gets a reference to Config is
// guaranteed to see timeout=30, host="localhost"
// No additional synchronization needed!`,
    rule: 'final fields are frozen at the end of the constructor. Any thread that sees the object reference sees the correct final field values.',
  },
];

const HB_RULES = [
  { rule: 'Program Order', desc: 'Each action in a thread HB every subsequent action in the same thread.', color: '#3B82F6' },
  { rule: 'Monitor Unlock → Lock', desc: 'Unlocking a monitor HB every subsequent locking of that same monitor.', color: '#8B5CF6' },
  { rule: 'Volatile Write → Read', desc: 'A write to a volatile field HB every subsequent read of that same field.', color: '#10B981' },
  { rule: 'Thread Start', desc: 'Thread.start() HB every action in the started thread.', color: '#F59E0B' },
  { rule: 'Thread Join', desc: 'All actions in thread T HB Thread.join() returning in another thread.', color: '#EC4899' },
  { rule: 'Transitivity', desc: 'If A HB B and B HB C, then A HB C.', color: '#06B6D4' },
  { rule: 'Object Construction', desc: 'All actions before the end of the constructor HB Object.finalize().', color: '#F97316' },
  { rule: 'Static Initializer', desc: 'The class initializer (<clinit>) HB any first use of the class.', color: '#A78BFA' },
];

export default function MemoryModelPage() {
  const [activeConcept, setActiveConcept] = useState(0);
  const [showSolution, setShowSolution] = useState(false);

  const concept = CONCEPTS[activeConcept];

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Concurrency"
        title="Java Memory"
        titleHighlight="Model"
        description="The JMM defines the rules for memory visibility and instruction ordering across threads. Without understanding it, concurrent code is undefined behavior waiting to happen."
        icon={Shield}
        iconColor="#EF4444"
        gradient="from-red-400 via-pink-400 to-rose-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">

        {/* Main concepts */}
        <AnimatedSection>
          <GlassCard className="overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-lg font-bold text-white">Core JMM Concepts</h2>
              <p className="text-sm text-slate-400 mt-1">Select a concept to explore the problem it solves and how Java addresses it.</p>
            </div>
            <div className="grid lg:grid-cols-4">
              {/* Sidebar */}
              <div className="border-r border-white/[0.06] p-3 space-y-1">
                {CONCEPTS.map((c, i) => (
                  <button
                    key={c.id}
                    onClick={() => { setActiveConcept(i); setShowSolution(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all ${activeConcept === i ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'}`}
                  >
                    <span className="text-base">{c.icon}</span>
                    <div>
                      <p className={`text-xs font-semibold ${activeConcept === i ? 'text-white' : 'text-slate-400'}`}>{c.title}</p>
                    </div>
                    {activeConcept === i && (
                      <div className="ml-auto w-1 h-4 rounded-full" style={{ backgroundColor: c.color }} />
                    )}
                  </button>
                ))}
              </div>

              {/* Detail */}
              <div className="lg:col-span-3 p-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={concept.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-2xl">{concept.icon}</span>
                      <h3 className="text-xl font-bold text-white">{concept.title}</h3>
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed mb-6">{concept.description}</p>

                    {/* Toggle */}
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        onClick={() => setShowSolution(false)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${!showSolution ? 'bg-red-500/20 border border-red-500/40 text-red-400' : 'border border-white/[0.08] text-slate-400 hover:text-white'}`}
                      >
                        <AlertTriangle className="w-3 h-3" /> Problem
                      </button>
                      <ArrowRight className="w-3 h-3 text-slate-600" />
                      <button
                        onClick={() => setShowSolution(true)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${showSolution ? 'bg-green-500/20 border border-green-500/40 text-green-400' : 'border border-white/[0.08] text-slate-400 hover:text-white'}`}
                      >
                        <CheckCircle2 className="w-3 h-3" /> Solution
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      <motion.div
                        key={showSolution ? 'sol' : 'prob'}
                        initial={{ opacity: 0, x: showSolution ? 10 : -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        <CodeBlock
                          code={showSolution ? concept.solution : concept.problem}
                          language="java"
                          title={showSolution ? 'Safe Pattern' : 'Broken Pattern'}
                        />
                      </motion.div>
                    </AnimatePresence>

                    <div
                      className="mt-5 flex items-start gap-3 px-4 py-3 rounded-xl border text-xs"
                      style={{ borderColor: `${concept.color}30`, backgroundColor: `${concept.color}08` }}
                    >
                      <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: concept.color }} />
                      <div>
                        <span className="font-semibold text-slate-300">JMM Rule: </span>
                        <span className="text-slate-400">{concept.rule}</span>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* CPU cache model diagram */}
        <AnimatedSection delay={0.1}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-6">Why Visibility Problems Occur</h2>
            <div className="grid md:grid-cols-3 gap-6 items-center">
              {/* Thread A */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  <span className="text-sm font-semibold text-white">CPU Core 1 (Thread A)</span>
                </div>
                {['L1 Cache: flag=true', 'L2 Cache: flag=true', 'Registers: flag=true'].map((l, i) => (
                  <motion.div key={l} initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="rounded-lg border border-blue-500/20 bg-blue-500/05 px-3 py-2 text-xs font-mono text-blue-300">
                    {l}
                  </motion.div>
                ))}
              </div>

              {/* Main Memory */}
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Database className="w-5 h-5 text-purple-400" />
                  <span className="text-sm font-semibold text-white">Main Memory</span>
                </div>
                <div className="rounded-xl border border-purple-500/30 bg-purple-500/08 p-4 text-center">
                  <div className="text-xs font-mono text-purple-300 mb-2">flag = ?</div>
                  <div className="text-[10px] text-slate-500">Without volatile, writes<br/>may not flush here</div>
                </div>
                <div className="flex justify-center">
                  <div className="text-[10px] text-slate-600 text-center px-3 py-2 rounded border border-white/[0.06]">
                    volatile / synchronized<br/>forces cache coherency
                  </div>
                </div>
              </div>

              {/* Thread B */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-semibold text-white">CPU Core 2 (Thread B)</span>
                </div>
                {['L1 Cache: flag=false ⚠', 'L2 Cache: flag=false ⚠', 'Reads: flag=false'].map((l, i) => (
                  <motion.div key={l} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                    className="rounded-lg border border-red-500/20 bg-red-500/05 px-3 py-2 text-xs font-mono text-red-300">
                    {l}
                  </motion.div>
                ))}
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Happens-Before rules */}
        <AnimatedSection delay={0.15}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Happens-Before Rules (JMM §17.4.5)</h2>
            <p className="text-sm text-slate-400 mb-6">These are the exhaustive set of happens-before (HB) relationships defined by the Java Memory Model. If no HB edge exists between two actions, they may be reordered and their results are undefined.</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {HB_RULES.map((r, i) => (
                <motion.div
                  key={r.rule}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="flex items-start gap-3 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                >
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: r.color }} />
                  <div>
                    <p className="text-xs font-semibold text-slate-200 mb-1">{r.rule}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{r.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Double-checked locking */}
        <AnimatedSection delay={0.2}>
          <div className="grid md:grid-cols-2 gap-6">
            <CodeBlock
              title="Broken double-checked locking (Java < 1.5)"
              language="java"
              showLineNumbers
              code={`// BROKEN without volatile — do NOT use
class Singleton {
    private static Singleton instance; // not volatile!
    
    public static Singleton getInstance() {
        if (instance == null) {            // check 1
            synchronized (Singleton.class) {
                if (instance == null) {    // check 2
                    instance = new Singleton();
                    // new Singleton() is 3 steps:
                    // 1. allocate memory
                    // 2. initialize object
                    // 3. assign reference
                    // Steps 2 and 3 can be REORDERED!
                    // Another thread may see instance != null
                    // but with an uninitialized object!
                }
            }
        }
        return instance;
    }
}`}
            />
            <CodeBlock
              title="Fixed with volatile (Java 5+)"
              language="java"
              showLineNumbers
              code={`// CORRECT — volatile prevents step reordering
class Singleton {
    private static volatile Singleton instance; // volatile!
    
    public static Singleton getInstance() {
        if (instance == null) {
            synchronized (Singleton.class) {
                if (instance == null) {
                    instance = new Singleton();
                    // volatile write: JMM guarantees
                    // initialization completes BEFORE
                    // the reference is published
                }
            }
        }
        return instance;
    }
    
    // Better alternative: initialization-on-demand holder
    private static class Holder {
        static final Singleton INSTANCE = new Singleton();
    }
    public static Singleton get() { return Holder.INSTANCE; }
}`}
            />
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
