'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, {
  Node, Edge, Background, Controls,
  BackgroundVariant, NodeProps, Handle, Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { X, ChevronRight, Info, Cpu } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import Badge from '@/components/ui/Badge';
import { jvmComponents } from '@/data/jvm-components';
import type { JvmComponent } from '@/types';
import { cn } from '@/lib/utils';

// ── Custom Node ───────────────────────────────────────────────────────────────
function JvmNode({ data }: NodeProps) {
  return (
    <div
      className="px-4 py-3 rounded-xl border cursor-pointer transition-all duration-200 min-w-[140px] text-center select-none"
      style={{
        backgroundColor: data.bgColor,
        borderColor: data.borderColor,
        boxShadow: data.selected ? `0 0 20px ${data.color}50` : 'none',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: data.color, border: 'none' }} />
      <Handle type="source" position={Position.Bottom} style={{ background: data.color, border: 'none' }} />
      <Handle type="source" position={Position.Right} style={{ background: data.color, border: 'none', top: '50%' }} />
      <Handle type="target" position={Position.Left} style={{ background: data.color, border: 'none', top: '50%' }} />
      <p className="text-xs font-bold" style={{ color: data.color }}>{data.label}</p>
      {data.subtitle && <p className="text-[9px] mt-0.5" style={{ color: `${data.color}80` }}>{data.subtitle}</p>}
    </div>
  );
}

const nodeTypes = { jvm: JvmNode };

// ── Graph Data ─────────────────────────────────────────────────────────────────
const initialNodes: Node[] = [
  // Source
  { id: 'source', type: 'jvm', position: { x: 280, y: 20 },
    data: { label: '.java Source', subtitle: 'Your Code', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.1)', borderColor: 'rgba(148,163,184,0.3)' } },
  { id: 'compiler', type: 'jvm', position: { x: 280, y: 110 },
    data: { label: 'javac Compiler', subtitle: 'JDK Tool', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.1)', borderColor: 'rgba(148,163,184,0.3)' } },
  { id: 'bytecode', type: 'jvm', position: { x: 280, y: 200 },
    data: { label: '.class Bytecode', subtitle: 'Platform-neutral', color: '#94a3b8', bgColor: 'rgba(148,163,184,0.1)', borderColor: 'rgba(148,163,184,0.3)' } },

  // JVM boundary
  { id: 'classloader', type: 'jvm', position: { x: 280, y: 320 },
    data: { label: 'Class Loader', subtitle: 'Load · Link · Init', color: '#3B82F6', bgColor: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.4)' } },

  // Runtime Data Areas
  { id: 'heap', type: 'jvm', position: { x: 60, y: 440 },
    data: { label: 'Heap', subtitle: 'Objects & Arrays', color: '#8B5CF6', bgColor: 'rgba(139,92,246,0.1)', borderColor: 'rgba(139,92,246,0.4)' } },
  { id: 'metaspace', type: 'jvm', position: { x: 220, y: 440 },
    data: { label: 'Metaspace', subtitle: 'Class Metadata', color: '#EC4899', bgColor: 'rgba(236,72,153,0.1)', borderColor: 'rgba(236,72,153,0.4)' } },
  { id: 'stack', type: 'jvm', position: { x: 380, y: 440 },
    data: { label: 'JVM Stack', subtitle: 'Per Thread', color: '#06B6D4', bgColor: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.4)' } },
  { id: 'pc', type: 'jvm', position: { x: 540, y: 440 },
    data: { label: 'PC Register', subtitle: 'Per Thread', color: '#06B6D4', bgColor: 'rgba(6,182,212,0.08)', borderColor: 'rgba(6,182,212,0.3)' } },

  // Execution Engine
  { id: 'execengine', type: 'jvm', position: { x: 280, y: 560 },
    data: { label: 'Execution Engine', subtitle: 'Interpreter + JIT + GC', color: '#10B981', bgColor: 'rgba(16,185,129,0.1)', borderColor: 'rgba(16,185,129,0.4)' } },
  { id: 'interpreter', type: 'jvm', position: { x: 120, y: 660 },
    data: { label: 'Interpreter', subtitle: 'Bytecode → native', color: '#10B981', bgColor: 'rgba(16,185,129,0.07)', borderColor: 'rgba(16,185,129,0.3)' } },
  { id: 'jit', type: 'jvm', position: { x: 280, y: 660 },
    data: { label: 'JIT Compiler', subtitle: 'C1 + C2 Tiered', color: '#10B981', bgColor: 'rgba(16,185,129,0.07)', borderColor: 'rgba(16,185,129,0.3)' } },
  { id: 'gc', type: 'jvm', position: { x: 440, y: 660 },
    data: { label: 'Garbage Collector', subtitle: 'G1 / ZGC / Serial', color: '#F59E0B', bgColor: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.4)' } },

  // JNI
  { id: 'jni', type: 'jvm', position: { x: 700, y: 320 },
    data: { label: 'JNI', subtitle: 'Native Bridge', color: '#EC4899', bgColor: 'rgba(236,72,153,0.1)', borderColor: 'rgba(236,72,153,0.4)' } },
  { id: 'nativelibs', type: 'jvm', position: { x: 700, y: 440 },
    data: { label: 'Native Libs', subtitle: '.dll / .so', color: '#06B6D4', bgColor: 'rgba(6,182,212,0.1)', borderColor: 'rgba(6,182,212,0.3)' } },
];

const initialEdges: Edge[] = [
  { id: 'e1', source: 'source', target: 'compiler', animated: false, style: { stroke: '#475569', strokeWidth: 1.5 } },
  { id: 'e2', source: 'compiler', target: 'bytecode', animated: false, style: { stroke: '#475569', strokeWidth: 1.5 } },
  { id: 'e3', source: 'bytecode', target: 'classloader', animated: true, style: { stroke: '#3B82F6', strokeWidth: 2 } },
  { id: 'e4', source: 'classloader', target: 'heap', animated: true, style: { stroke: '#8B5CF6', strokeWidth: 1.5 } },
  { id: 'e5', source: 'classloader', target: 'metaspace', animated: true, style: { stroke: '#EC4899', strokeWidth: 1.5 } },
  { id: 'e6', source: 'classloader', target: 'stack', animated: true, style: { stroke: '#06B6D4', strokeWidth: 1.5 } },
  { id: 'e7', source: 'classloader', target: 'execengine', animated: true, style: { stroke: '#10B981', strokeWidth: 2 } },
  { id: 'e8', source: 'execengine', target: 'interpreter', style: { stroke: '#10B981', strokeWidth: 1.5 } },
  { id: 'e9', source: 'execengine', target: 'jit', style: { stroke: '#10B981', strokeWidth: 1.5 } },
  { id: 'e10', source: 'execengine', target: 'gc', style: { stroke: '#F59E0B', strokeWidth: 1.5 } },
  { id: 'e11', source: 'gc', target: 'heap', animated: true, style: { stroke: '#F59E0B', strokeWidth: 1.5 } },
  { id: 'e12', source: 'classloader', target: 'jni', style: { stroke: '#EC4899', strokeWidth: 1.5 } },
  { id: 'e13', source: 'jni', target: 'nativelibs', style: { stroke: '#06B6D4', strokeWidth: 1.5 } },
  { id: 'e14', source: 'stack', target: 'execengine', style: { stroke: '#06B6D4', strokeWidth: 1, strokeDasharray: '4 4' } },
  { id: 'e15', source: 'pc', target: 'execengine', style: { stroke: '#06B6D4', strokeWidth: 1, strokeDasharray: '4 4' } },
];

// Node id → component id mapping
const nodeToComponent: Record<string, string> = {
  classloader: 'class-loader',
  heap: 'runtime-data-areas',
  metaspace: 'runtime-data-areas',
  stack: 'runtime-data-areas',
  pc: 'runtime-data-areas',
  execengine: 'execution-engine',
  interpreter: 'execution-engine',
  jit: 'execution-engine',
  gc: 'garbage-collector',
  jni: 'jni',
  nativelibs: 'native-method-libs',
};

export default function ArchitecturePage() {
  const [selectedComponent, setSelectedComponent] = useState<JvmComponent | null>(null);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const compId = nodeToComponent[node.id];
    if (compId) {
      const comp = jvmComponents.find((c) => c.id === compId);
      setSelectedComponent(comp ?? null);
    }
  }, []);

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="JVM Internals"
        title="JVM"
        titleHighlight="Architecture"
        description="Click any component in the interactive diagram to explore its role, responsibilities, and how it fits into the JVM execution pipeline."
        icon={Cpu}
        iconColor="#3B82F6"
        gradient="from-blue-400 via-purple-400 to-cyan-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Flow Diagram */}
          <div className="lg:col-span-2">
            <AnimatedSection>
              <GlassCard className="overflow-hidden" style={{ height: '680px' } as React.CSSProperties}>
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-slate-400 font-mono">JVM Execution Pipeline</span>
                  </div>
                  <span className="text-xs text-slate-600">Click a node to explore</span>
                </div>
                <div style={{ height: 'calc(100% - 45px)' }}>
                  <ReactFlow
                    nodes={initialNodes}
                    edges={initialEdges}
                    nodeTypes={nodeTypes}
                    onNodeClick={onNodeClick}
                    fitView
                    fitViewOptions={{ padding: 0.2 }}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="rgba(255,255,255,0.07)" />
                    <Controls />
                  </ReactFlow>
                </div>
              </GlassCard>
            </AnimatedSection>
          </div>

          {/* Side panel */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedComponent ? (
                <motion.div
                  key={selectedComponent.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                >
                  <GlassCard className="p-5 sticky top-24">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-white text-lg leading-tight">{selectedComponent.name}</h3>
                      </div>
                      <button
                        onClick={() => setSelectedComponent(null)}
                        className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-white/[0.08] transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed mb-5">{selectedComponent.description}</p>

                    <div className="mb-5">
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">How it works</h4>
                      <ul className="space-y-2">
                        {selectedComponent.details.map((d, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                            <ChevronRight className="w-3 h-3 mt-0.5 shrink-0" style={{ color: selectedComponent.color }} />
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Key Facts</h4>
                      <div className="space-y-2">
                        {selectedComponent.keyFacts.map((f, i) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 text-xs p-2.5 rounded-lg"
                            style={{ backgroundColor: `${selectedComponent.color}10`, border: `1px solid ${selectedComponent.color}25` }}
                          >
                            <Info className="w-3 h-3 mt-0.5 shrink-0" style={{ color: selectedComponent.color }} />
                            <span className="text-slate-300">{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <GlassCard className="p-6 sticky top-24">
                    <div className="text-center py-8">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mx-auto mb-4">
                        <Cpu className="w-6 h-6 text-blue-400" />
                      </div>
                      <p className="text-slate-400 text-sm mb-2">Click any node in the diagram</p>
                      <p className="text-slate-600 text-xs">Component details will appear here</p>
                    </div>

                    <div className="border-t border-white/[0.06] pt-5 mt-2">
                      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Components</h4>
                      <div className="space-y-2">
                        {jvmComponents.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setSelectedComponent(c)}
                            className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.04] transition-all text-left"
                          >
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                            <span className="text-sm text-slate-400 hover:text-slate-200 transition-colors">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Component cards below */}
        <AnimatedSection className="mt-16">
          <h2 className="text-2xl font-bold text-white mb-8">All Components</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {jvmComponents.map((comp, i) => (
              <motion.div
                key={comp.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07 }}
              >
                <GlassCard
                  hover
                  className="p-5 cursor-pointer h-full"
                  onClick={() => { setSelectedComponent(comp); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: `${comp.color}20`, border: `1px solid ${comp.color}40`, color: comp.color }}
                    >
                      {comp.shortName.charAt(0)}
                    </div>
                    <h3 className="font-semibold text-white text-sm">{comp.name}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{comp.description}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {comp.keyFacts.slice(0, 2).map((_, i) => (
                      <span key={i} className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded border',
                      )} style={{ borderColor: `${comp.color}30`, color: comp.color, backgroundColor: `${comp.color}10` }}>
                        {i === 0 ? 'Core' : 'Important'}
                      </span>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
