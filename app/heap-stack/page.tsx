'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, Plus, Play, Trash2, RotateCcw, ArrowRight, Info } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import CodeBlock from '@/components/ui/CodeBlock';

interface HeapObject {
  id: string;
  label: string;
  type: string;
  color: string;
  size: number;
  refs: string[];
  isGarbage?: boolean;
}

interface Frame {
  id: string;
  method: string;
  cls: string;
  locals: { name: string; type: string; value: string; refId?: string }[];
  color: string;
}

const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4'];

const SCENARIOS: {
  name: string;
  description: string;
  code: string;
  frames: Frame[];
  objects: HeapObject[];
}[] = [
  {
    name: 'Object Creation',
    description: 'Create a String and an Employee object, then let one go out of scope.',
    code: `Employee emp = new Employee("Alice", 30);
String dept = new String("Engineering");
// emp reference lives on the Stack
// objects live on the Heap`,
    frames: [
      { id: 'f1', method: 'main()', cls: 'App', color: '#3B82F6',
        locals: [
          { name: 'emp', type: 'Employee', value: '→ @Heap#1', refId: 'o1' },
          { name: 'dept', type: 'String', value: '→ @Heap#2', refId: 'o2' },
        ] },
    ],
    objects: [
      { id: 'o1', label: 'Employee', type: 'Employee', color: '#8B5CF6', size: 32, refs: ['o2'] },
      { id: 'o2', label: '"Engineering"', type: 'String', color: '#10B981', size: 24, refs: [] },
    ],
  },
  {
    name: 'Method Call Stack',
    description: 'Visualize frames pushed and popped during a recursive call chain.',
    code: `int factorial(int n) {          // Frame 3
    if (n <= 1) return 1;
    return n * factorial(n - 1);    // Frame 4
}
void calculate() {                  // Frame 2
    int result = factorial(4);
}
void main() { calculate(); }       // Frame 1`,
    frames: [
      { id: 'f1', method: 'main()', cls: 'App', color: '#3B82F6', locals: [] },
      { id: 'f2', method: 'calculate()', cls: 'App', color: '#8B5CF6',
        locals: [{ name: 'result', type: 'int', value: '?' }] },
      { id: 'f3', method: 'factorial(4)', cls: 'App', color: '#10B981',
        locals: [{ name: 'n', type: 'int', value: '4' }] },
      { id: 'f4', method: 'factorial(3)', cls: 'App', color: '#F59E0B',
        locals: [{ name: 'n', type: 'int', value: '3' }] },
    ],
    objects: [
      { id: 'o1', label: 'Integer cache', type: 'Integer[]', color: '#EC4899', size: 64, refs: [] },
    ],
  },
  {
    name: 'Garbage Eligible',
    description: 'After nulling references, objects become eligible for collection.',
    code: `StringBuilder sb = new StringBuilder("data");
process(sb);
sb = null;          // eligible for GC
// GC can now collect the StringBuilder`,
    frames: [
      { id: 'f1', method: 'main()', cls: 'App', color: '#3B82F6',
        locals: [{ name: 'sb', type: 'StringBuilder', value: 'null (was → @Heap#1)' }] },
    ],
    objects: [
      { id: 'o1', label: 'StringBuilder', type: 'StringBuilder', color: '#EF4444', size: 48, refs: ['o2'], isGarbage: true },
      { id: 'o2', label: '"data" char[]', type: 'char[]', color: '#F97316', size: 16, refs: [], isGarbage: true },
    ],
  },
];

export default function HeapStackPage() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [showGcAnim, setShowGcAnim] = useState(false);
  const [gcDone, setGcDone] = useState(false);

  const scenario = SCENARIOS[scenarioIdx];

  const runGc = useCallback(async () => {
    setShowGcAnim(true);
    await new Promise((r) => setTimeout(r, 1800));
    setGcDone(true);
  }, []);

  const reset = () => {
    setShowGcAnim(false);
    setGcDone(false);
    setScenarioIdx(0);
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Memory Management"
        title="Heap"
        titleHighlight="vs Stack"
        description="Watch objects get allocated on the Heap while stack frames hold references. Trigger GC to see unreachable objects collected in real time."
        icon={Layers}
        iconColor="#06B6D4"
        gradient="from-cyan-400 via-blue-400 to-purple-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-8">

        {/* Controls */}
        <AnimatedSection>
          <GlassCard className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-400 font-medium">Scenario:</span>
              {SCENARIOS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => { setScenarioIdx(i); setShowGcAnim(false); setGcDone(false); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    scenarioIdx === i
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
                  }`}
                >
                  {s.name}
                </button>
              ))}
              <div className="flex-1" />
              {scenario.objects.some((o) => (o as any).isGarbage) && (
                <button
                  onClick={runGc}
                  disabled={showGcAnim}
                  className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-medium bg-orange-500/20 border border-orange-500/40 text-orange-400 hover:bg-orange-500/30 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Run GC
                </button>
              )}
              <button
                onClick={reset}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white border border-white/[0.06] hover:border-white/[0.15] transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-3">{scenario.description}</p>
          </GlassCard>
        </AnimatedSection>

        {/* Main visualization */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Stack */}
          <AnimatedSection className="lg:col-span-2">
            <GlassCard className="h-full">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-sm font-semibold text-white">JVM Stack</span>
                <span className="ml-auto text-xs text-slate-500 font-mono">per-thread</span>
              </div>
              <div className="p-5">
                <div className="flex flex-col gap-2">
                  <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                    <ArrowRight className="w-3 h-3" /> Stack grows downward (top = current frame)
                  </div>
                  <AnimatePresence>
                    {[...scenario.frames].reverse().map((frame, i) => (
                      <motion.div
                        key={frame.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded-xl border p-4"
                        style={{ borderColor: `${frame.color}40`, backgroundColor: `${frame.color}08` }}
                      >
                        <div className="flex items-center gap-2 mb-3">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: frame.color }} />
                          <span className="text-xs font-bold" style={{ color: frame.color }}>{frame.method}</span>
                          <span className="text-[10px] text-slate-600 ml-1">{frame.cls}</span>
                        </div>
                        {frame.locals.length > 0 ? (
                          <div className="space-y-1.5">
                            <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-2">Local Variables</div>
                            {frame.locals.map((loc, j) => (
                              <div key={j} className="flex items-center justify-between bg-black/20 rounded px-2.5 py-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-500">{loc.type}</span>
                                  <span className="text-xs text-white font-mono">{loc.name}</span>
                                </div>
                                <span className={`text-[10px] font-mono ${'refId' in loc && loc.refId ? 'text-blue-400' : 'text-green-400'}`}>
                                  {loc.value}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-600 italic">No local variables</div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  <div className="rounded-xl border border-dashed border-white/[0.08] p-4 flex items-center justify-center">
                    <span className="text-xs text-slate-600">← Bottom of stack</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </AnimatedSection>

          {/* Arrow */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="flex flex-col items-center gap-2 text-slate-600">
              <motion.div
                animate={{ x: [0, 8, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <ArrowRight className="w-6 h-6 text-slate-500" />
              </motion.div>
              <span className="text-xs text-slate-600 font-mono text-center">refs point<br/>to heap</span>
            </div>
          </div>

          {/* Heap */}
          <AnimatedSection className="lg:col-span-2" delay={0.1}>
            <GlassCard className="h-full">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.06]">
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-sm font-semibold text-white">Heap</span>
                <span className="ml-auto text-xs text-slate-500 font-mono">shared · GC-managed</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-xs text-slate-500 mb-1 flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Objects live until no references remain
                </div>
                <AnimatePresence>
                  {scenario.objects.map((obj, i) => {
                    const collected = gcDone && obj.isGarbage;
                    return (
                      <motion.div
                        key={obj.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={
                          showGcAnim && obj.isGarbage && !gcDone
                            ? { opacity: [1, 0.3, 1, 0.3, 1], scale: [1, 0.95, 1] }
                            : { opacity: collected ? 0 : 1, scale: 1 }
                        }
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: i * 0.1 }}
                        className="rounded-xl border p-4"
                        style={{
                          borderColor: obj.isGarbage ? 'rgba(239,68,68,0.4)' : `${obj.color}40`,
                          backgroundColor: obj.isGarbage ? 'rgba(239,68,68,0.07)' : `${obj.color}08`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: obj.isGarbage ? '#EF4444' : obj.color }} />
                            <span className="text-xs font-bold" style={{ color: obj.isGarbage ? '#EF4444' : obj.color }}>
                              {obj.label}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono">{obj.size}B</span>
                            {obj.isGarbage && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/15 border border-red-500/30 text-red-400">
                                unreachable
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] text-slate-600 font-mono">type: {obj.type}</div>
                        {obj.refs.length > 0 && (
                          <div className="text-[10px] text-blue-400 mt-1 font-mono">
                            refs: {obj.refs.join(', ')}
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {gcDone && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center"
                  >
                    <span className="text-xs text-green-400 font-medium">GC collected unreachable objects</span>
                  </motion.div>
                )}

                {/* Memory bar */}
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1.5">
                    <span>Heap Usage</span>
                    <span>{gcDone ? Math.max(0, scenario.objects.filter(o => !o.isGarbage).reduce((a,o)=>a+o.size,0)) : scenario.objects.reduce((a, o) => a + o.size, 0)} B / 256 MB</span>
                  </div>
                  <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: gcDone ? '1%' : `${Math.min(100, (scenario.objects.reduce((a, o) => a + o.size, 0) / 512) * 100)}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              </div>
            </GlassCard>
          </AnimatedSection>
        </div>

        {/* Code */}
        <AnimatedSection delay={0.1}>
          <CodeBlock
            code={scenario.code}
            language="java"
            title={scenario.name}
            showLineNumbers
          />
        </AnimatedSection>

        {/* Theory cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {[
            {
              title: 'JVM Stack',
              color: '#3B82F6',
              icon: '⬆',
              points: [
                'Created per thread — every thread has its own stack',
                'Stores stack frames: one frame per method invocation',
                'Each frame holds: local variables, operand stack, frame data',
                'Primitive values stored directly in locals (int, long, etc.)',
                'Object references stored in locals — actual objects are on the Heap',
                'StackOverflowError when recursion exceeds stack depth limit',
                'Default stack size: ~512 KB–1 MB (configurable with -Xss)',
              ],
            },
            {
              title: 'Heap',
              color: '#8B5CF6',
              icon: '🗄',
              points: [
                'Shared across all threads — single heap per JVM instance',
                'All object instances and arrays are allocated here',
                'Managed by the Garbage Collector automatically',
                'Divided into Young Generation (Eden + Survivor) and Old Generation',
                'New objects go to Eden; long-lived objects get promoted to Old Gen',
                'OutOfMemoryError: Java heap space when full and no GC can free space',
                'Sized with -Xmx (max) and -Xms (initial)',
              ],
            },
          ].map((card) => (
            <AnimatedSection key={card.title}>
              <GlassCard className="p-6 h-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{card.icon}</span>
                  <h3 className="font-bold text-white text-lg">{card.title}</h3>
                  <div className="ml-auto w-2 h-2 rounded-full" style={{ backgroundColor: card.color }} />
                </div>
                <ul className="space-y-2">
                  {card.points.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
                      <span className="mt-1.5 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: card.color }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </div>
  );
}
