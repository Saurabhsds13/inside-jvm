'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Play, RotateCcw, ChevronRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import StatBar from '@/components/ui/StatBar';
import { gcAlgorithms } from '@/data/gc-algorithms';

// ── Memory block visualization ────────────────────────────────────────────────
type BlockState = 'free' | 'live' | 'garbage' | 'collecting' | 'collected';

interface MemBlock {
  id: number;
  state: BlockState;
  label: string;
  age: number; // 0 = young, 1 = survivor, 2 = old
}

function MemoryGrid({ blocks }: { blocks: MemBlock[] }) {
  const stateStyle: Record<BlockState, { bg: string; border: string; text: string }> = {
    free: { bg: 'bg-white/[0.02]', border: 'border-white/[0.06]', text: 'text-slate-700' },
    live: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
    garbage: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400' },
    collecting: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-300' },
    collected: { bg: 'bg-white/[0.02]', border: 'border-white/[0.04]', text: 'text-slate-800' },
  };

  return (
    <div className="grid grid-cols-10 gap-1">
      {blocks.map((b) => {
        const s = stateStyle[b.state];
        return (
          <motion.div
            key={b.id}
            className={`h-8 rounded border text-[8px] flex items-center justify-center font-mono transition-colors duration-300 ${s.bg} ${s.border} ${s.text}`}
            animate={b.state === 'collecting' ? { opacity: [1, 0.3, 1], scale: [1, 0.92, 1] } : {}}
            transition={{ duration: 0.4, repeat: b.state === 'collecting' ? Infinity : 0 }}
          >
            {b.state !== 'free' && b.state !== 'collected' ? b.label : ''}
          </motion.div>
        );
      })}
    </div>
  );
}

function makeBlocks(): MemBlock[] {
  const blocks: MemBlock[] = [];
  for (let i = 0; i < 50; i++) {
    let state: BlockState = 'free';
    let label = '';
    let age = 0;
    if (i < 20) { state = 'live'; label = `L${i}`; age = i < 8 ? 0 : i < 14 ? 1 : 2; }
    else if (i < 35) { state = 'garbage'; label = `G${i}`; age = 0; }
    blocks.push({ id: i, state, label, age });
  }
  return blocks;
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GarbageCollectionPage() {
  const [selectedGc, setSelectedGc] = useState(gcAlgorithms[2]); // G1 default
  const [blocks, setBlocks] = useState<MemBlock[]>(makeBlocks);
  const [gcPhase, setGcPhase] = useState<'idle' | 'marking' | 'sweeping' | 'compacting' | 'done'>('idle');
  const [stats, setStats] = useState({ live: 20, garbage: 15, free: 15, pauseMs: 0 });

  const runGc = useCallback(async () => {
    // Mark phase
    setGcPhase('marking');
    setBlocks((prev) =>
      prev.map((b) => (b.state === 'garbage' ? { ...b, state: 'collecting' } : b))
    );
    await new Promise((r) => setTimeout(r, 1000));

    // Sweep phase
    setGcPhase('sweeping');
    setBlocks((prev) =>
      prev.map((b) => (b.state === 'collecting' ? { ...b, state: 'collected' } : b))
    );
    await new Promise((r) => setTimeout(r, 800));

    // Compact
    setGcPhase('compacting');
    await new Promise((r) => setTimeout(r, 600));

    setGcPhase('done');
    const pause = selectedGc.id === 'zgc' ? 0.8 : selectedGc.id === 'g1' ? 12 : selectedGc.id === 'parallel' ? 45 : 120;
    setStats({ live: 20, garbage: 0, free: 30, pauseMs: pause });
  }, [selectedGc]);

  const reset = () => { setBlocks(makeBlocks()); setGcPhase('idle'); setStats({ live: 20, garbage: 15, free: 15, pauseMs: 0 }); };

  const phaseColors: Record<string, string> = {
    idle: '#64748b', marking: '#F59E0B', sweeping: '#EF4444', compacting: '#8B5CF6', done: '#10B981',
  };

  const generationBlocks = {
    eden: blocks.slice(0, 16),
    survivor: blocks.slice(16, 24),
    old: blocks.slice(24, 40),
    free: blocks.slice(40),
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Memory Management"
        title="Garbage"
        titleHighlight="Collection"
        description="Compare Serial, Parallel, G1, and ZGC algorithms. Simulate a GC cycle and see mark-sweep-compact in action. Understand pause times and throughput trade-offs."
        icon={Trash2}
        iconColor="#F59E0B"
        gradient="from-amber-400 via-orange-400 to-red-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">

        {/* GC Algorithm selector */}
        <AnimatedSection>
          <div className="flex flex-wrap gap-3">
            {gcAlgorithms.map((gc) => (
              <button
                key={gc.id}
                onClick={() => { setSelectedGc(gc); reset(); }}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium"
                style={{
                  borderColor: selectedGc.id === gc.id ? gc.color : 'rgba(255,255,255,0.08)',
                  backgroundColor: selectedGc.id === gc.id ? `${gc.color}18` : 'rgba(255,255,255,0.02)',
                  color: selectedGc.id === gc.id ? gc.color : '#94a3b8',
                  boxShadow: selectedGc.id === gc.id ? `0 0 20px ${gc.color}25` : 'none',
                }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gc.color }} />
                {gc.name}
              </button>
            ))}
          </div>
        </AnimatedSection>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Algorithm detail */}
          <AnimatedSection className="lg:col-span-2">
            <GlassCard className="p-6 h-full">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedGc.fullName}</h2>
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-full border font-mono"
                      style={{ borderColor: `${selectedGc.color}40`, color: selectedGc.color, backgroundColor: `${selectedGc.color}15` }}>
                      {selectedGc.flag}
                    </span>
                    <span className="text-xs text-slate-500">Since {selectedGc.introduced}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-400">
                      {selectedGc.pauseType}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed mb-6">{selectedGc.description}</p>

              <div className="space-y-4 mb-6">
                <StatBar label="Throughput" value={selectedGc.throughput} color={selectedGc.color} />
                <StatBar label="Latency / Low-pause" value={selectedGc.latency} color={selectedGc.color} />
                <StatBar label="Memory Overhead" value={selectedGc.memoryOverhead} color={selectedGc.color} />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-semibold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" /> Advantages
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedGc.pros.map((p, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="text-green-500 mt-0.5 shrink-0">+</span> {p}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <XCircle className="w-3 h-3" /> Limitations
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedGc.cons.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="text-red-500 mt-0.5 shrink-0">−</span> {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-white/[0.06]">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Best Use Cases</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedGc.useCases.map((u) => (
                    <span key={u} className="text-xs px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-400">{u}</span>
                  ))}
                </div>
              </div>
            </GlassCard>
          </AnimatedSection>

          {/* How it works */}
          <AnimatedSection delay={0.1}>
            <GlassCard className="p-5 h-full">
              <h3 className="text-sm font-bold text-white mb-4">How It Works</h3>
              <ol className="space-y-3">
                {selectedGc.howItWorks.map((step, i) => (
                  <li key={i} className="flex items-start gap-3 text-xs text-slate-400">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                      style={{ backgroundColor: `${selectedGc.color}20`, color: selectedGc.color }}
                    >
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </GlassCard>
          </AnimatedSection>
        </div>

        {/* Generational heap simulation */}
        <AnimatedSection delay={0.15}>
          <GlassCard className="overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: phaseColors[gcPhase] }}
                />
                <h2 className="text-sm font-bold text-white">Heap Simulation</h2>
                <span
                  className="text-xs px-2 py-0.5 rounded font-mono"
                  style={{ color: phaseColors[gcPhase], backgroundColor: `${phaseColors[gcPhase]}20`, border: `1px solid ${phaseColors[gcPhase]}40` }}
                >
                  {gcPhase === 'idle' ? 'Ready' : gcPhase.charAt(0).toUpperCase() + gcPhase.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {stats.pauseMs > 0 && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pause: <span className="text-white font-mono">{stats.pauseMs} ms</span></span>
                  </div>
                )}
                <button
                  onClick={runGc}
                  disabled={gcPhase !== 'idle'}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/20 border border-orange-500/40 text-orange-400 hover:bg-orange-500/30 disabled:opacity-50 transition-all"
                >
                  <Play className="w-3 h-3" /> Run GC
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs border border-white/[0.08] text-slate-400 hover:text-white transition-all"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>
            </div>

            <div className="p-5 space-y-5">
              {/* Legend */}
              <div className="flex flex-wrap gap-4 text-xs">
                {[
                  { color: 'bg-blue-500/40 border-blue-500/60', label: 'Live object' },
                  { color: 'bg-red-500/40 border-red-500/60', label: 'Garbage (unreachable)' },
                  { color: 'bg-orange-500/40 border-orange-500/60', label: 'Being collected' },
                  { color: 'bg-white/[0.04] border-white/[0.1]', label: 'Free space' },
                ].map((l) => (
                  <div key={l.label} className="flex items-center gap-2 text-slate-500">
                    <div className={`w-4 h-4 rounded border ${l.color}`} />
                    {l.label}
                  </div>
                ))}
              </div>

              {/* Young Generation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Young Generation</span>
                  <span className="text-[10px] text-slate-600">— new allocations go here first</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[10px] text-slate-600 mb-1.5 font-mono">Eden Space</div>
                    <MemoryGrid blocks={generationBlocks.eden} />
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-600 mb-1.5 font-mono">Survivor S0/S1</div>
                    <MemoryGrid blocks={generationBlocks.survivor} />
                  </div>
                </div>
              </div>

              {/* Old Generation */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Old Generation (Tenured)</span>
                  <span className="text-[10px] text-slate-600">— long-lived objects promoted here</span>
                </div>
                <MemoryGrid blocks={generationBlocks.old} />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                {[
                  { label: 'Live Objects', value: stats.live, color: '#3B82F6' },
                  { label: 'Garbage', value: stats.garbage, color: '#EF4444' },
                  { label: 'Free Slots', value: stats.free, color: '#10B981' },
                ].map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/[0.06] p-3 text-center">
                    <div className="text-xl font-bold" style={{ color: s.color }}>{s.value}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* GC comparison table */}
        <AnimatedSection delay={0.2}>
          <GlassCard className="overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06]">
              <h2 className="text-sm font-bold text-white">Comparison at a Glance</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    {['GC', 'Introduced', 'Pause Type', 'Best For', 'Flag', 'Default in'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gcAlgorithms.map((gc, i) => (
                    <motion.tr
                      key={gc.id}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => setSelectedGc(gc)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: gc.color }} />
                          <span className="font-semibold text-white">{gc.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{gc.introduced}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-medium"
                          style={{ color: gc.color, backgroundColor: `${gc.color}15`, border: `1px solid ${gc.color}30` }}
                        >
                          {gc.pauseType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{gc.useCases[0]}</td>
                      <td className="px-4 py-3 font-mono text-slate-400 text-[10px]">{gc.flag}</td>
                      <td className="px-4 py-3 text-slate-400">
                        {gc.id === 'g1' ? 'Java 9–21+' : gc.id === 'parallel' ? 'Java 7–8' : '—'}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </AnimatedSection>
      </div>
    </div>
  );
}
