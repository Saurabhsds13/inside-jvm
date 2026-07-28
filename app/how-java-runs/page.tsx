'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FileCode, Cpu, Package, Play, ArrowRight, CheckCircle2, HelpCircle } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import CodeBlock from '@/components/ui/CodeBlock';

// ─── Pipeline Steps ───────────────────────────────────────────────────────────

const PIPELINE_STEPS = [
  {
    id: 'source',
    label: '.java',
    title: 'Source Code',
    color: '#3B82F6',
    icon: FileCode,
    description: 'You write human-readable Java code in .java files. This is what developers create and maintain.',
    detail: 'Java source files use Unicode encoding. One public class per file. The file name must match the public class name.',
    example: `// HelloWorld.java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
  },
  {
    id: 'compiler',
    label: 'javac',
    title: 'Java Compiler',
    color: '#8B5CF6',
    icon: Package,
    description: 'The javac compiler translates .java source into .class bytecode files. It performs syntax checking, type checking, and generates platform-independent bytecode.',
    detail: 'javac does NOT produce native machine code. It produces bytecode — an intermediate representation that any JVM can execute regardless of operating system or CPU.',
    example: `# Compile source to bytecode
javac HelloWorld.java

# This creates HelloWorld.class
# The .class file contains bytecode, NOT native code

# View the bytecode with javap
javap -c HelloWorld.class`,
  },
  {
    id: 'bytecode',
    label: '.class',
    title: 'Bytecode',
    color: '#06B6D4',
    icon: Cpu,
    description: 'Bytecode is a compact, platform-independent instruction set for the JVM. Each .class file contains the bytecode for one class.',
    detail: 'Bytecode instructions are 1 byte each (hence the name). There are 256 possible opcodes. The JVM specification defines exactly what each opcode does.',
    example: `// What HelloWorld.class contains (simplified):
// Constant Pool: "Hello, World!", method refs
// 
// main method bytecode:
//   0: getstatic System.out
//   3: ldc "Hello, World!"
//   5: invokevirtual println
//   8: return`,
  },
  {
    id: 'classloader',
    label: 'ClassLoader',
    title: 'Class Loading',
    color: '#10B981',
    icon: Package,
    description: 'When you run `java HelloWorld`, the JVM\'s ClassLoader loads your .class file into memory. It verifies the bytecode is valid, prepares memory, and resolves references.',
    detail: 'Loading follows the parent-delegation model: Bootstrap → Platform → Application ClassLoader. Classes are loaded lazily — only when first referenced.',
    example: `# Run the program
java HelloWorld

# Behind the scenes:
# 1. JVM starts, loads core classes (java.lang.*)
# 2. Application ClassLoader finds HelloWorld.class
# 3. Bytecode Verifier checks the class is valid
# 4. Memory is allocated for static fields
# 5. Static initializers run`,
  },
  {
    id: 'execution',
    label: 'Execution',
    title: 'Execution Engine',
    color: '#F59E0B',
    icon: Play,
    description: 'The Execution Engine reads bytecode and executes it. It starts with interpretation (slow but immediate) and later JIT-compiles hot methods to native code (fast).',
    detail: 'The JVM uses Tiered Compilation: methods start interpreted, then get compiled by C1 (quick compile), then C2 (optimized compile) as they get "hotter".',
    example: `// Execution flow for main():
// 
// 1. Interpreter reads bytecode one-by-one
//    getstatic → look up System.out field
//    ldc → push "Hello, World!" from constant pool  
//    invokevirtual → call println method
//
// 2. If main() were called 10,000+ times,
//    JIT would compile it to native x86/ARM code`,
  },
  {
    id: 'output',
    label: 'Output',
    title: 'Native Execution',
    color: '#EF4444',
    icon: Cpu,
    description: 'Finally, the JIT-compiled native code (or interpreted bytecode) executes on your actual CPU. The output appears on screen.',
    detail: 'Once JIT-compiled, Java code runs at near-C speed. The JVM also handles garbage collection, thread scheduling, and memory management automatically.',
    example: `# Terminal output:
Hello, World!

# What actually happened:
# .java → javac → .class → ClassLoader → JVM → CPU
# 
# Total time: ~50ms for "Hello World"
# (most of that is JVM startup, not execution)`,
  },
];

// ─── JVM vs JRE vs JDK ───────────────────────────────────────────────────────

const JDK_LAYERS = [
  {
    name: 'JDK (Java Development Kit)',
    color: '#3B82F6',
    contains: 'JRE + Development Tools',
    tools: ['javac (compiler)', 'javap (disassembler)', 'jdb (debugger)', 'jar (archiver)', 'javadoc', 'jlink'],
    description: 'Everything needed to DEVELOP Java applications. Includes the compiler and all tools.',
    forWhom: 'Developers',
  },
  {
    name: 'JRE (Java Runtime Environment)',
    color: '#8B5CF6',
    contains: 'JVM + Core Libraries',
    tools: ['java.lang.*', 'java.util.*', 'java.io.*', 'java.net.*', 'java.sql.*', 'Security Manager'],
    description: 'Everything needed to RUN Java applications. No compiler — you cannot write new code with just the JRE.',
    forWhom: 'End Users',
  },
  {
    name: 'JVM (Java Virtual Machine)',
    color: '#10B981',
    contains: 'Execution Engine + Memory Management',
    tools: ['ClassLoader', 'Bytecode Verifier', 'Interpreter', 'JIT Compiler', 'Garbage Collector', 'Thread Scheduler'],
    description: 'The core engine that actually executes bytecode. Platform-specific — there\'s a different JVM for Windows, macOS, Linux.',
    forWhom: 'Bytecode',
  },
];

// ─── Common Misconceptions ────────────────────────────────────────────────────

const MISCONCEPTIONS = [
  { myth: 'Java is slow', reality: 'After JIT compilation, Java runs at near-C speed. The JVM optimizes code at runtime based on actual usage patterns — something ahead-of-time compiled languages cannot do.' },
  { myth: 'Java is interpreted', reality: 'Java is BOTH interpreted AND compiled. It starts interpreted for fast startup, then JIT-compiles hot paths to native code. Production Java code runs as native machine instructions.' },
  { myth: 'javac compiles to machine code', reality: 'javac compiles to BYTECODE (.class files), not native code. The JVM\'s JIT compiler creates native code at runtime. This is why Java is "write once, run anywhere".' },
  { myth: 'JVM = Java only', reality: 'The JVM runs ANY language that compiles to bytecode: Kotlin, Scala, Groovy, Clojure, JRuby, Jython. The JVM doesn\'t care what language produced the .class file.' },
  { myth: 'Garbage Collection means no memory leaks', reality: 'GC only collects unreachable objects. If you accidentally keep references alive (e.g., in a static List), objects will never be collected — that\'s a memory leak.' },
];

// ─── Interview Questions ──────────────────────────────────────────────────────

const FAQ = [
  { q: 'What happens when you type `java HelloWorld`?', a: 'The OS starts the JVM process → JVM initializes → Bootstrap ClassLoader loads core classes → Application ClassLoader finds HelloWorld.class → Bytecode Verifier validates it → main() method is located → Interpreter starts executing bytecode → JIT compiles hot methods → Output produced.' },
  { q: 'Why is Java platform independent?', a: 'Because javac produces bytecode (not native code). Bytecode is the same on every platform. Each platform has its own JVM implementation that translates bytecode to native instructions for that specific OS/CPU.' },
  { q: 'What is the difference between compile-time and runtime?', a: 'Compile-time: javac checks syntax, types, resolves imports → produces .class. Runtime: JVM loads classes, allocates memory, executes code, manages threads, runs GC. Errors can occur at either stage.' },
  { q: 'Can we run Java without JDK?', a: 'Yes — you only need the JRE (or just the JVM + required libraries) to RUN Java. The JDK is only needed to COMPILE source code. Pre-compiled .class or .jar files run with just the JRE.' },
  { q: 'What is bytecode verification?', a: 'Before executing any class, the JVM Verifier checks: stack depth is consistent, types are correct, no illegal memory access, no uninitialized variables used, control flow is valid. This prevents malicious or corrupted code from crashing the JVM.' },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HowJavaRunsPage() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Start Here"
        title="How Java"
        titleHighlight="Actually Runs"
        description="From writing source code to seeing output — understand the complete journey. This is the foundation for everything else on this site."
        icon={Play}
        iconColor="#3B82F6"
        gradient="from-blue-400 via-indigo-400 to-purple-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">

        {/* Pipeline Flow */}
        <AnimatedSection>
          <GlassCard className="overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.06] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-400" />
              <span className="text-sm font-bold text-white">The Java Execution Pipeline</span>
              <span className="ml-auto text-xs text-slate-600">Click each stage to explore</span>
            </div>
            <div className="p-6">
              {/* Step selector */}
              <div className="flex items-center justify-center gap-2 flex-wrap mb-6">
                {PIPELINE_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.id} className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveStep(i)}
                        className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border transition-all text-xs font-medium"
                        style={{
                          borderColor: activeStep === i ? `${step.color}50` : 'rgba(255,255,255,0.08)',
                          backgroundColor: activeStep === i ? `${step.color}15` : 'rgba(255,255,255,0.02)',
                          color: activeStep === i ? step.color : '#94a3b8',
                        }}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {step.label}
                      </button>
                      {i < PIPELINE_STEPS.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Active step detail */}
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="grid lg:grid-cols-2 gap-6"
              >
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    {PIPELINE_STEPS[activeStep].title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed mb-4">
                    {PIPELINE_STEPS[activeStep].description}
                  </p>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Key Detail</span>
                    <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
                      {PIPELINE_STEPS[activeStep].detail}
                    </p>
                  </div>
                </div>
                <CodeBlock
                  title={PIPELINE_STEPS[activeStep].title}
                  language="java"
                  code={PIPELINE_STEPS[activeStep].example}
                  showLineNumbers
                />
              </motion.div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* JVM vs JRE vs JDK */}
        <AnimatedSection delay={0.1}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-2">JVM vs JRE vs JDK</h2>
            <p className="text-xs text-slate-500 mb-6">The most commonly asked question in every Java interview at every level.</p>
            <div className="space-y-4">
              {JDK_LAYERS.map((layer, i) => (
                <motion.div
                  key={layer.name}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl border p-5"
                  style={{ borderColor: `${layer.color}30`, backgroundColor: `${layer.color}05` }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: layer.color }}>{layer.name}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Contains: {layer.contains}</p>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border font-medium shrink-0"
                      style={{ borderColor: `${layer.color}40`, color: layer.color, backgroundColor: `${layer.color}15` }}>
                      For: {layer.forWhom}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{layer.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {layer.tools.map((tool) => (
                      <span key={tool} className="text-[10px] font-mono px-2 py-0.5 rounded border border-white/[0.06] bg-white/[0.03] text-slate-400">
                        {tool}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Platform Independence Visual */}
        <AnimatedSection delay={0.15}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Write Once, Run Anywhere</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5 text-center">
                <div className="text-2xl mb-2">💻</div>
                <h4 className="text-sm font-bold text-blue-400 mb-1">You Write</h4>
                <p className="text-xs text-slate-400">One set of .java source files</p>
                <div className="mt-3 font-mono text-[10px] text-blue-300 bg-blue-500/10 rounded-lg px-3 py-2">
                  HelloWorld.java
                </div>
              </div>
              <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5 text-center">
                <div className="text-2xl mb-2">📦</div>
                <h4 className="text-sm font-bold text-purple-400 mb-1">javac Produces</h4>
                <p className="text-xs text-slate-400">One set of .class bytecode files</p>
                <div className="mt-3 font-mono text-[10px] text-purple-300 bg-purple-500/10 rounded-lg px-3 py-2">
                  HelloWorld.class
                </div>
              </div>
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-5 text-center">
                <div className="text-2xl mb-2">🌍</div>
                <h4 className="text-sm font-bold text-green-400 mb-1">Runs On</h4>
                <p className="text-xs text-slate-400">Any platform with a JVM</p>
                <div className="mt-3 space-y-1">
                  {['Windows JVM', 'macOS JVM', 'Linux JVM'].map((os) => (
                    <div key={os} className="font-mono text-[10px] text-green-300 bg-green-500/10 rounded-lg px-3 py-1">
                      {os}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Common Misconceptions */}
        <AnimatedSection delay={0.2}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-2">Common Misconceptions</h2>
            <p className="text-xs text-slate-500 mb-5">Things most developers get wrong about Java execution.</p>
            <div className="space-y-3">
              {MISCONCEPTIONS.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div className="flex items-start gap-3 mb-2">
                    <HelpCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="text-sm font-bold text-red-400">&quot;{item.myth}&quot;</span>
                  </div>
                  <div className="flex items-start gap-3 ml-7">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 leading-relaxed">{item.reality}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Interview Questions */}
        <AnimatedSection delay={0.25}>
          <GlassCard className="p-6">
            <div className="mb-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-blue-400">Interview Ready</span>
              <h2 className="text-lg font-bold text-white mt-1">Frequently Asked Questions</h2>
            </div>
            {FAQ.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="border-b border-white/[0.06] last:border-none py-4"
              >
                <div className="text-sm font-bold text-white">{item.q}</div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.a}</p>
              </motion.div>
            ))}
          </GlassCard>
        </AnimatedSection>

        {/* Quick Reference */}
        <AnimatedSection delay={0.3}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Quick Reference: Key Commands</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { cmd: 'javac Main.java', desc: 'Compile source to bytecode', category: 'Compile' },
                { cmd: 'java Main', desc: 'Run the compiled class', category: 'Run' },
                { cmd: 'javap -c Main.class', desc: 'Disassemble bytecode', category: 'Inspect' },
                { cmd: 'java -version', desc: 'Check installed JVM version', category: 'Info' },
                { cmd: 'jar cf app.jar *.class', desc: 'Package classes into JAR', category: 'Package' },
                { cmd: 'java -jar app.jar', desc: 'Run a JAR file', category: 'Run' },
              ].map((item) => (
                <div key={item.cmd} className="flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium shrink-0">
                    {item.category}
                  </span>
                  <div>
                    <code className="text-xs font-mono text-amber-400">{item.cmd}</code>
                    <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

      </div>
    </div>
  );
}
