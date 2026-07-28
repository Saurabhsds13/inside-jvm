'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, SkipForward, RotateCcw, Pause, Code2, Layers, Database } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import CodeBlock from '@/components/ui/CodeBlock';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BytecodeInstruction {
  offset: number;
  opcode: string;
  operand?: string;
  description: string;
  stackEffect: string; // e.g. "→ value" or "value1, value2 → result"
}

interface ExecutionState {
  pc: number; // current instruction index
  operandStack: StackValue[];
  locals: LocalVar[];
  finished: boolean;
}

interface StackValue {
  value: string;
  type: 'int' | 'ref' | 'float' | 'string';
  highlight?: boolean;
}

interface LocalVar {
  index: number;
  name: string;
  value: string;
  type: 'int' | 'ref' | 'float' | 'string';
}

interface BytecodeExample {
  id: string;
  name: string;
  description: string;
  java: string;
  bytecode: BytecodeInstruction[];
  initialLocals: LocalVar[];
  executionSteps: ExecutionState[];
}

// ─── Example Programs ─────────────────────────────────────────────────────────

const EXAMPLES: BytecodeExample[] = [
  {
    id: 'add',
    name: 'Addition',
    description: 'Simple integer addition: a + b',
    java: `public static int add(int a, int b) {
    return a + b;
}`,
    bytecode: [
      { offset: 0, opcode: 'iload_0', description: 'Load int from local variable 0 (a)', stackEffect: '→ a' },
      { offset: 1, opcode: 'iload_1', description: 'Load int from local variable 1 (b)', stackEffect: '→ b' },
      { offset: 2, opcode: 'iadd', description: 'Pop two ints, push their sum', stackEffect: 'a, b → result' },
      { offset: 3, opcode: 'ireturn', description: 'Return int from top of operand stack', stackEffect: 'result →' },
    ],
    initialLocals: [
      { index: 0, name: 'a', value: '5', type: 'int' },
      { index: 1, name: 'b', value: '3', type: 'int' },
    ],
    executionSteps: [
      { pc: 0, operandStack: [], locals: [{ index: 0, name: 'a', value: '5', type: 'int' }, { index: 1, name: 'b', value: '3', type: 'int' }], finished: false },
      { pc: 1, operandStack: [{ value: '5', type: 'int', highlight: true }], locals: [{ index: 0, name: 'a', value: '5', type: 'int' }, { index: 1, name: 'b', value: '3', type: 'int' }], finished: false },
      { pc: 2, operandStack: [{ value: '5', type: 'int' }, { value: '3', type: 'int', highlight: true }], locals: [{ index: 0, name: 'a', value: '5', type: 'int' }, { index: 1, name: 'b', value: '3', type: 'int' }], finished: false },
      { pc: 3, operandStack: [{ value: '8', type: 'int', highlight: true }], locals: [{ index: 0, name: 'a', value: '5', type: 'int' }, { index: 1, name: 'b', value: '3', type: 'int' }], finished: false },
      { pc: 3, operandStack: [], locals: [{ index: 0, name: 'a', value: '5', type: 'int' }, { index: 1, name: 'b', value: '3', type: 'int' }], finished: true },
    ],
  },
  {
    id: 'loop',
    name: 'Loop Counter',
    description: 'Sum numbers from 0 to 4 using a loop',
    java: `public static int sumToFour() {
    int sum = 0;
    for (int i = 0; i < 5; i++) {
        sum += i;
    }
    return sum;  // returns 10
}`,
    bytecode: [
      { offset: 0, opcode: 'iconst_0', description: 'Push constant 0 onto stack', stackEffect: '→ 0' },
      { offset: 1, opcode: 'istore_0', description: 'Store top of stack into local 0 (sum)', stackEffect: '0 →' },
      { offset: 2, opcode: 'iconst_0', description: 'Push constant 0 onto stack', stackEffect: '→ 0' },
      { offset: 3, opcode: 'istore_1', description: 'Store top of stack into local 1 (i)', stackEffect: '0 →' },
      { offset: 4, opcode: 'iload_1', description: 'Load i onto stack', stackEffect: '→ i' },
      { offset: 5, opcode: 'iconst_5', description: 'Push constant 5 onto stack', stackEffect: '→ 5' },
      { offset: 6, opcode: 'if_icmpge 14', description: 'If i >= 5, jump to offset 14 (exit)', stackEffect: 'i, 5 →' },
      { offset: 7, opcode: 'iload_0', description: 'Load sum onto stack', stackEffect: '→ sum' },
      { offset: 8, opcode: 'iload_1', description: 'Load i onto stack', stackEffect: '→ i' },
      { offset: 9, opcode: 'iadd', description: 'Add sum + i', stackEffect: 'sum, i → result' },
      { offset: 10, opcode: 'istore_0', description: 'Store result into sum', stackEffect: 'result →' },
      { offset: 11, opcode: 'iinc 1, 1', description: 'Increment local 1 (i) by 1', stackEffect: '(no stack change)' },
      { offset: 12, opcode: 'goto 4', description: 'Jump back to loop condition', stackEffect: '(branch)' },
      { offset: 13, opcode: 'iload_0', description: 'Load final sum onto stack', stackEffect: '→ sum' },
      { offset: 14, opcode: 'ireturn', description: 'Return sum', stackEffect: 'sum →' },
    ],
    initialLocals: [
      { index: 0, name: 'sum', value: '0', type: 'int' },
      { index: 1, name: 'i', value: '0', type: 'int' },
    ],
    executionSteps: [
      // init sum=0
      { pc: 0, operandStack: [], locals: [{ index: 0, name: 'sum', value: '?', type: 'int' }, { index: 1, name: 'i', value: '?', type: 'int' }], finished: false },
      { pc: 1, operandStack: [{ value: '0', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '?', type: 'int' }, { index: 1, name: 'i', value: '?', type: 'int' }], finished: false },
      // init i=0
      { pc: 2, operandStack: [], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '?', type: 'int' }], finished: false },
      { pc: 3, operandStack: [{ value: '0', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '?', type: 'int' }], finished: false },
      // iteration 1: i=0, check i<5
      { pc: 4, operandStack: [], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '0', type: 'int' }], finished: false },
      { pc: 5, operandStack: [{ value: '0', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '0', type: 'int' }], finished: false },
      { pc: 6, operandStack: [{ value: '0', type: 'int' }, { value: '5', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '0', type: 'int' }], finished: false },
      // sum += 0
      { pc: 7, operandStack: [], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '0', type: 'int' }], finished: false },
      { pc: 8, operandStack: [{ value: '0', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '0', type: 'int' }], finished: false },
      { pc: 9, operandStack: [{ value: '0', type: 'int' }, { value: '0', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '0', type: 'int' }], finished: false },
      { pc: 10, operandStack: [{ value: '0', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '0', type: 'int' }], finished: false },
      // i++ and loop back
      { pc: 11, operandStack: [], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '0', type: 'int' }], finished: false },
      { pc: 12, operandStack: [], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '1', type: 'int' }], finished: false },
      // iteration 2: i=1, check i<5
      { pc: 4, operandStack: [], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '1', type: 'int' }], finished: false },
      { pc: 5, operandStack: [{ value: '1', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '1', type: 'int' }], finished: false },
      { pc: 6, operandStack: [{ value: '1', type: 'int' }, { value: '5', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '1', type: 'int' }], finished: false },
      // sum += 1 → sum=1
      { pc: 7, operandStack: [], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '1', type: 'int' }], finished: false },
      { pc: 8, operandStack: [{ value: '0', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '1', type: 'int' }], finished: false },
      { pc: 9, operandStack: [{ value: '0', type: 'int' }, { value: '1', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '1', type: 'int' }], finished: false },
      { pc: 10, operandStack: [{ value: '1', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '0', type: 'int' }, { index: 1, name: 'i', value: '1', type: 'int' }], finished: false },
      { pc: 11, operandStack: [], locals: [{ index: 0, name: 'sum', value: '1', type: 'int' }, { index: 1, name: 'i', value: '1', type: 'int' }], finished: false },
      { pc: 12, operandStack: [], locals: [{ index: 0, name: 'sum', value: '1', type: 'int' }, { index: 1, name: 'i', value: '2', type: 'int' }], finished: false },
      // Skip ahead to final state (i=5, sum=10)
      { pc: 13, operandStack: [], locals: [{ index: 0, name: 'sum', value: '10', type: 'int' }, { index: 1, name: 'i', value: '5', type: 'int' }], finished: false },
      { pc: 14, operandStack: [{ value: '10', type: 'int', highlight: true }], locals: [{ index: 0, name: 'sum', value: '10', type: 'int' }, { index: 1, name: 'i', value: '5', type: 'int' }], finished: false },
      { pc: 14, operandStack: [], locals: [{ index: 0, name: 'sum', value: '10', type: 'int' }, { index: 1, name: 'i', value: '5', type: 'int' }], finished: true },
    ],
  },
  {
    id: 'object',
    name: 'Object Creation',
    description: 'new keyword, constructor call, field assignment',
    java: `public static Object create() {
    StringBuilder sb = new StringBuilder();
    sb.append("Hello");
    return sb;
}`,
    bytecode: [
      { offset: 0, opcode: 'new', operand: '#StringBuilder', description: 'Allocate memory for StringBuilder, push ref', stackEffect: '→ objectref' },
      { offset: 1, opcode: 'dup', description: 'Duplicate top of stack (need ref for both init and store)', stackEffect: 'ref → ref, ref' },
      { offset: 2, opcode: 'invokespecial', operand: 'StringBuilder.<init>', description: 'Call constructor (consumes one ref)', stackEffect: 'ref →' },
      { offset: 3, opcode: 'astore_0', description: 'Store object reference into local 0 (sb)', stackEffect: 'ref →' },
      { offset: 4, opcode: 'aload_0', description: 'Load sb reference onto stack', stackEffect: '→ ref' },
      { offset: 5, opcode: 'ldc', operand: '"Hello"', description: 'Push string constant from constant pool', stackEffect: '→ "Hello"' },
      { offset: 6, opcode: 'invokevirtual', operand: 'StringBuilder.append', description: 'Call append(String), returns this', stackEffect: 'ref, str → ref' },
      { offset: 7, opcode: 'pop', description: 'Discard append return value', stackEffect: 'ref →' },
      { offset: 8, opcode: 'aload_0', description: 'Load sb reference for return', stackEffect: '→ ref' },
      { offset: 9, opcode: 'areturn', description: 'Return object reference', stackEffect: 'ref →' },
    ],
    initialLocals: [
      { index: 0, name: 'sb', value: 'null', type: 'ref' },
    ],
    executionSteps: [
      { pc: 0, operandStack: [], locals: [{ index: 0, name: 'sb', value: 'null', type: 'ref' }], finished: false },
      { pc: 1, operandStack: [{ value: 'StringBuilder@1a', type: 'ref', highlight: true }], locals: [{ index: 0, name: 'sb', value: 'null', type: 'ref' }], finished: false },
      { pc: 2, operandStack: [{ value: 'StringBuilder@1a', type: 'ref' }, { value: 'StringBuilder@1a', type: 'ref', highlight: true }], locals: [{ index: 0, name: 'sb', value: 'null', type: 'ref' }], finished: false },
      { pc: 3, operandStack: [{ value: 'StringBuilder@1a', type: 'ref', highlight: true }], locals: [{ index: 0, name: 'sb', value: 'null', type: 'ref' }], finished: false },
      { pc: 4, operandStack: [], locals: [{ index: 0, name: 'sb', value: 'StringBuilder@1a', type: 'ref' }], finished: false },
      { pc: 5, operandStack: [{ value: 'StringBuilder@1a', type: 'ref', highlight: true }], locals: [{ index: 0, name: 'sb', value: 'StringBuilder@1a', type: 'ref' }], finished: false },
      { pc: 6, operandStack: [{ value: 'StringBuilder@1a', type: 'ref' }, { value: '"Hello"', type: 'string', highlight: true }], locals: [{ index: 0, name: 'sb', value: 'StringBuilder@1a', type: 'ref' }], finished: false },
      { pc: 7, operandStack: [{ value: 'StringBuilder@1a', type: 'ref', highlight: true }], locals: [{ index: 0, name: 'sb', value: 'StringBuilder@1a', type: 'ref' }], finished: false },
      { pc: 8, operandStack: [], locals: [{ index: 0, name: 'sb', value: 'StringBuilder@1a', type: 'ref' }], finished: false },
      { pc: 9, operandStack: [{ value: 'StringBuilder@1a', type: 'ref', highlight: true }], locals: [{ index: 0, name: 'sb', value: 'StringBuilder@1a', type: 'ref' }], finished: false },
      { pc: 9, operandStack: [], locals: [{ index: 0, name: 'sb', value: 'StringBuilder@1a', type: 'ref' }], finished: true },
    ],
  },
  {
    id: 'conditional',
    name: 'If-Else',
    description: 'Conditional branching with comparison',
    java: `public static int max(int a, int b) {
    if (a >= b) {
        return a;
    } else {
        return b;
    }
}`,
    bytecode: [
      { offset: 0, opcode: 'iload_0', description: 'Load a onto stack', stackEffect: '→ a' },
      { offset: 1, opcode: 'iload_1', description: 'Load b onto stack', stackEffect: '→ b' },
      { offset: 2, opcode: 'if_icmplt 5', description: 'If a < b, jump to offset 5 (else branch)', stackEffect: 'a, b →' },
      { offset: 3, opcode: 'iload_0', description: 'Load a (then branch)', stackEffect: '→ a' },
      { offset: 4, opcode: 'ireturn', description: 'Return a', stackEffect: 'a →' },
      { offset: 5, opcode: 'iload_1', description: 'Load b (else branch)', stackEffect: '→ b' },
      { offset: 6, opcode: 'ireturn', description: 'Return b', stackEffect: 'b →' },
    ],
    initialLocals: [
      { index: 0, name: 'a', value: '7', type: 'int' },
      { index: 1, name: 'b', value: '4', type: 'int' },
    ],
    executionSteps: [
      { pc: 0, operandStack: [], locals: [{ index: 0, name: 'a', value: '7', type: 'int' }, { index: 1, name: 'b', value: '4', type: 'int' }], finished: false },
      { pc: 1, operandStack: [{ value: '7', type: 'int', highlight: true }], locals: [{ index: 0, name: 'a', value: '7', type: 'int' }, { index: 1, name: 'b', value: '4', type: 'int' }], finished: false },
      { pc: 2, operandStack: [{ value: '7', type: 'int' }, { value: '4', type: 'int', highlight: true }], locals: [{ index: 0, name: 'a', value: '7', type: 'int' }, { index: 1, name: 'b', value: '4', type: 'int' }], finished: false },
      // 7 >= 4, so no jump — continue to then branch
      { pc: 3, operandStack: [], locals: [{ index: 0, name: 'a', value: '7', type: 'int' }, { index: 1, name: 'b', value: '4', type: 'int' }], finished: false },
      { pc: 4, operandStack: [{ value: '7', type: 'int', highlight: true }], locals: [{ index: 0, name: 'a', value: '7', type: 'int' }, { index: 1, name: 'b', value: '4', type: 'int' }], finished: false },
      { pc: 4, operandStack: [], locals: [{ index: 0, name: 'a', value: '7', type: 'int' }, { index: 1, name: 'b', value: '4', type: 'int' }], finished: true },
    ],
  },
];

// ─── Type colors ──────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  int: '#3B82F6',
  ref: '#8B5CF6',
  float: '#F59E0B',
  string: '#10B981',
};

// ─── Page Component ───────────────────────────────────────────────────────────

export default function BytecodePage() {
  const [selectedExample, setSelectedExample] = useState(EXAMPLES[0]);
  const [stepIndex, setStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const currentState = selectedExample.executionSteps[stepIndex];
  const totalSteps = selectedExample.executionSteps.length;

  const step = useCallback(() => {
    setStepIndex((prev) => {
      if (prev < totalSteps - 1) return prev + 1;
      setIsPlaying(false);
      return prev;
    });
  }, [totalSteps]);

  const reset = useCallback(() => {
    setStepIndex(0);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(step, 1800);
    return () => clearInterval(id);
  }, [isPlaying, step]);

  const selectExample = (ex: BytecodeExample) => {
    setSelectedExample(ex);
    setStepIndex(0);
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="JVM Internals"
        title="Bytecode"
        titleHighlight="Playground"
        description="Step through JVM bytecode instruction by instruction. Watch the operand stack and local variable table change in real-time as each opcode executes."
        icon={Code2}
        iconColor="#F59E0B"
        gradient="from-amber-400 via-orange-400 to-red-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">

        {/* Example Selector */}
        <AnimatedSection>
          <div className="flex flex-wrap gap-3">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.id}
                onClick={() => selectExample(ex)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium"
                style={{
                  borderColor: selectedExample.id === ex.id ? '#F59E0B40' : 'rgba(255,255,255,0.08)',
                  backgroundColor: selectedExample.id === ex.id ? '#F59E0B18' : 'rgba(255,255,255,0.02)',
                  color: selectedExample.id === ex.id ? '#F59E0B' : '#94a3b8',
                }}
              >
                {ex.name}
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* Controls */}
        <AnimatedSection delay={0.05}>
          <GlassCard className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  disabled={currentState.finished}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 disabled:opacity-40 transition-all"
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  {isPlaying ? 'Pause' : 'Auto Play'}
                </button>
                <button
                  onClick={step}
                  disabled={currentState.finished}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.15] disabled:opacity-40 transition-all"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  Step
                </button>
                <button
                  onClick={reset}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium border border-white/[0.08] text-slate-400 hover:text-white transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  Step <span className="text-white font-mono">{stepIndex + 1}</span> / {totalSteps}
                </span>
                {currentState.finished && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/40 text-green-400 font-medium">
                    Complete
                  </span>
                )}
                {/* Progress bar */}
                <div className="w-32 h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-amber-500"
                    animate={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Main Layout: Source + Bytecode | Stack + Locals */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Left: Source Code + Bytecode Instructions */}
          <AnimatedSection className="lg:col-span-3" delay={0.1}>
            <div className="space-y-6">
              {/* Java Source */}
              <CodeBlock
                title={`${selectedExample.name} — Java Source`}
                language="java"
                code={selectedExample.java}
                showLineNumbers
              />

              {/* Bytecode Instructions */}
              <GlassCard className="overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-amber-400" />
                  <span className="text-sm font-bold text-white">Bytecode Instructions</span>
                  <span className="ml-auto text-[10px] text-slate-600 font-mono">javap -c output</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {selectedExample.bytecode.map((instr, i) => {
                    const isActive = !currentState.finished && instr.offset === currentState.pc;
                    return (
                      <motion.div
                        key={`${instr.offset}-${i}`}
                        className="flex items-center gap-4 px-5 py-2.5 transition-colors"
                        animate={{
                          backgroundColor: isActive ? 'rgba(245, 158, 11, 0.08)' : 'rgba(0,0,0,0)',
                        }}
                      >
                        {/* PC indicator */}
                        <div className="w-5 flex justify-center">
                          {isActive && (
                            <motion.div
                              layoutId="pc-indicator"
                              className="w-2 h-2 rounded-full bg-amber-400"
                              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            />
                          )}
                        </div>
                        {/* Offset */}
                        <span className="text-[10px] font-mono text-slate-600 w-6 text-right">{instr.offset}</span>
                        {/* Opcode */}
                        <span className={`text-xs font-mono font-bold w-28 ${isActive ? 'text-amber-400' : 'text-slate-300'}`}>
                          {instr.opcode}
                        </span>
                        {/* Operand */}
                        <span className="text-xs font-mono text-purple-400 w-36 truncate">
                          {instr.operand || ''}
                        </span>
                        {/* Stack effect */}
                        <span className="text-[10px] text-slate-600 ml-auto hidden sm:block">
                          [{instr.stackEffect}]
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
                {/* Current instruction description */}
                {!currentState.finished && (
                  <div className="px-5 py-3 border-t border-white/[0.06] bg-amber-500/5">
                    <p className="text-xs text-amber-300/80">
                      <span className="font-bold text-amber-400">
                        {selectedExample.bytecode.find((b) => b.offset === currentState.pc)?.opcode}:
                      </span>{' '}
                      {selectedExample.bytecode.find((b) => b.offset === currentState.pc)?.description}
                    </p>
                  </div>
                )}
              </GlassCard>
            </div>
          </AnimatedSection>

          {/* Right: Operand Stack + Local Variables */}
          <AnimatedSection className="lg:col-span-2" delay={0.15}>
            <div className="space-y-6">
              {/* Operand Stack */}
              <GlassCard className="overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-white">Operand Stack</span>
                  <span className="ml-auto text-[10px] text-slate-600">
                    depth: {currentState.operandStack.length}
                  </span>
                </div>
                <div className="p-5">
                  {currentState.operandStack.length === 0 ? (
                    <div className="text-center py-6">
                      <div className="text-slate-700 text-xs font-mono">(empty)</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {/* Render stack top-to-bottom (top of stack first) */}
                      {[...currentState.operandStack].reverse().map((item, i) => (
                        <motion.div
                          key={`${stepIndex}-${i}`}
                          initial={{ opacity: 0, x: -10, scale: 0.95 }}
                          animate={{ opacity: 1, x: 0, scale: 1 }}
                          className="flex items-center gap-3 p-3 rounded-xl border"
                          style={{
                            borderColor: item.highlight ? `${TYPE_COLORS[item.type]}50` : 'rgba(255,255,255,0.06)',
                            backgroundColor: item.highlight ? `${TYPE_COLORS[item.type]}10` : 'rgba(255,255,255,0.02)',
                          }}
                        >
                          <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: TYPE_COLORS[item.type] }}
                          />
                          <span className="text-sm font-mono font-bold" style={{ color: TYPE_COLORS[item.type] }}>
                            {item.value}
                          </span>
                          <span className="text-[10px] text-slate-600 ml-auto">{item.type}</span>
                          {i === 0 && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-500">TOP</span>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {/* Stack grows upward label */}
                  <div className="mt-3 pt-3 border-t border-white/[0.04] text-center">
                    <span className="text-[9px] text-slate-700 font-mono">↑ stack grows upward ↑</span>
                  </div>
                </div>
              </GlassCard>

              {/* Local Variable Table */}
              <GlassCard className="overflow-hidden">
                <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-bold text-white">Local Variables</span>
                </div>
                <div className="p-5 space-y-2">
                  {currentState.locals.map((local) => (
                    <div
                      key={local.index}
                      className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]"
                    >
                      <span className="text-[10px] font-mono text-slate-600 w-4">{local.index}</span>
                      <span className="text-xs font-mono text-slate-400">{local.name}</span>
                      <span className="text-xs text-slate-600">=</span>
                      <span
                        className="text-sm font-mono font-bold"
                        style={{ color: TYPE_COLORS[local.type] }}
                      >
                        {local.value}
                      </span>
                      <span className="text-[10px] text-slate-600 ml-auto">{local.type}</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </AnimatedSection>
        </div>

        {/* Bytecode Reference */}
        <AnimatedSection delay={0.2}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Bytecode Quick Reference</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { category: 'Load/Store', opcodes: ['iload', 'istore', 'aload', 'astore', 'ldc'], color: '#3B82F6', desc: 'Move data between locals and stack' },
                { category: 'Arithmetic', opcodes: ['iadd', 'isub', 'imul', 'idiv', 'iinc'], color: '#10B981', desc: 'Integer and float math operations' },
                { category: 'Stack Ops', opcodes: ['dup', 'pop', 'swap', 'dup_x1'], color: '#F59E0B', desc: 'Manipulate the operand stack directly' },
                { category: 'Control Flow', opcodes: ['goto', 'if_icmpge', 'if_icmplt', 'ireturn'], color: '#EF4444', desc: 'Branching and method return' },
                { category: 'Objects', opcodes: ['new', 'invokespecial', 'invokevirtual', 'getfield'], color: '#8B5CF6', desc: 'Create objects, call methods' },
                { category: 'Constants', opcodes: ['iconst_0', 'iconst_5', 'bipush', 'sipush'], color: '#06B6D4', desc: 'Push constant values onto stack' },
              ].map((cat) => (
                <div
                  key={cat.category}
                  className="rounded-xl border p-4"
                  style={{ borderColor: `${cat.color}30`, backgroundColor: `${cat.color}05` }}
                >
                  <h4 className="text-xs font-bold mb-1.5" style={{ color: cat.color }}>{cat.category}</h4>
                  <p className="text-[10px] text-slate-500 mb-3">{cat.desc}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cat.opcodes.map((op) => (
                      <span
                        key={op}
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                        style={{ borderColor: `${cat.color}30`, color: cat.color, backgroundColor: `${cat.color}10` }}
                      >
                        {op}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* How Bytecode Works */}
        <AnimatedSection delay={0.25}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">How Bytecode Execution Works</h2>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                { step: '1', title: 'Stack Machine', desc: 'The JVM is a stack-based virtual machine. All computation happens by pushing values onto and popping values from the operand stack. There are no general-purpose registers.', color: '#3B82F6' },
                { step: '2', title: 'Local Variables', desc: 'Each method frame has a fixed-size array of local variables (slots). Method parameters occupy the first slots. iload/istore move data between locals and the stack.', color: '#8B5CF6' },
                { step: '3', title: 'Verification', desc: 'The JVM verifier checks bytecode before execution: stack depth is consistent at each point, types match, no uninitialized variables are used. Invalid bytecode is rejected.', color: '#10B981' },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-white/[0.06] p-5">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mb-3"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}
                  >
                    {item.step}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">{item.title}</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

      </div>
    </div>
  );
}
