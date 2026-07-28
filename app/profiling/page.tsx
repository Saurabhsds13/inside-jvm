'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Terminal, Search, Cpu, HardDrive, Bug, AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import CodeBlock from '@/components/ui/CodeBlock';

// ─── Tools ────────────────────────────────────────────────────────────────────

interface Tool {
  id: string;
  name: string;
  fullName: string;
  color: string;
  purpose: string;
  when: string;
  flags: string[];
  example: string;
  output: string;
  tips: string[];
}

const TOOLS: Tool[] = [
  {
    id: 'jps',
    name: 'jps',
    fullName: 'JVM Process Status',
    color: '#64748b',
    purpose: 'List all running JVM processes on the machine with their PIDs.',
    when: 'First step — you need the PID before using any other tool.',
    flags: ['-l (full class name)', '-v (JVM arguments)', '-m (main method args)'],
    example: `# List running Java processes
jps -lv

# Output:
# 12345 com.myapp.Main -Xmx2g -XX:+UseG1GC
# 67890 org.kafka.Kafka -Xmx8g`,
    output: `12345 com.myapp.Main -Xmx2g -XX:+UseG1GC
67890 org.kafka.Kafka -Xmx8g -XX:+UseG1GC
11111 jdk.jcmd/sun.tools.jps.Jps -l`,
    tips: ['Always start here to find your process PID', 'Use -l to see full main class name', 'The jps process itself shows up in the list'],
  },
  {
    id: 'jstack',
    name: 'jstack',
    fullName: 'Thread Stack Dump',
    color: '#EC4899',
    purpose: 'Print stack traces of all threads in a running JVM. Essential for finding deadlocks, thread leaks, and understanding what your app is doing.',
    when: 'App is hanging, CPU is 100%, deadlock suspected, or you need to see what threads are doing.',
    flags: ['-l (locks info)', '-e (extended info, JDK 14+)', '-F (force, unresponsive JVM)'],
    example: `# Take a thread dump
jstack 12345

# Take 3 dumps 5 seconds apart (find stuck threads)
for i in 1 2 3; do
  jstack 12345 > dump_$i.txt
  sleep 5
done

# Force dump on unresponsive JVM
jstack -F 12345`,
    output: `"main" #1 prio=5 os_prio=0 tid=0x0001 nid=0x1a03 
   java.lang.Thread.State: RUNNABLE
    at com.myapp.Service.processRequest(Service.java:42)
    at com.myapp.Controller.handle(Controller.java:18)

"pool-1-thread-3" #14 prio=5 tid=0x0042 nid=0x2b01
   java.lang.Thread.State: BLOCKED (on object monitor)
    - waiting to lock <0x00000007160a> (a java.util.HashMap)
    - locked <0x00000007160b> (a java.util.ArrayList)
    at com.myapp.Cache.update(Cache.java:67)`,
    tips: [
      'Take 3-5 dumps seconds apart — if a thread is stuck in the same place, that is your problem',
      'Look for BLOCKED threads waiting on the same lock',
      'grep "deadlock" in the output — JVM auto-detects deadlocks',
      'In production, prefer jcmd Thread.print over jstack',
    ],
  },
  {
    id: 'jmap',
    name: 'jmap',
    fullName: 'Memory Map',
    color: '#8B5CF6',
    purpose: 'Inspect heap memory — object histogram, heap dump, class loader stats. Essential for finding memory leaks.',
    when: 'OutOfMemoryError, memory growing unboundedly, need to find what objects are consuming heap.',
    flags: ['-histo (object histogram)', '-dump:format=b,file=heap.hprof (heap dump)', '-clstats (classloader stats)'],
    example: `# Quick histogram — what objects are using memory?
jmap -histo 12345 | head -20

# Full heap dump for analysis
jmap -dump:format=b,file=heap.hprof 12345

# Then analyze with Eclipse MAT or JDK Mission Control
# Look for: retained size, dominator tree, leak suspects`,
    output: ` num     #instances   #bytes  class name
   1:       2847103  182214592  [B (byte arrays)
   2:       1923847   92344656  java.lang.String
   3:        847291   67783280  com.myapp.CacheEntry
   4:        523841   41907280  java.util.HashMap$Node
   5:        412093   19780464  java.lang.Object[]`,
    tips: [
      'jmap -histo is lightweight — safe in production',
      'Heap dumps cause a full GC pause — avoid during peak traffic',
      'Compare two histograms taken minutes apart to find growing objects',
      'Use -XX:+HeapDumpOnOutOfMemoryError to auto-dump on OOM',
    ],
  },
  {
    id: 'jstat',
    name: 'jstat',
    fullName: 'JVM Statistics Monitor',
    color: '#10B981',
    purpose: 'Monitor GC behavior in real-time — heap usage, GC frequency, pause times, promotion rates.',
    when: 'GC pauses suspected, need to monitor allocation rate, verify GC tuning changes.',
    flags: ['-gcutil (GC utilization %)', '-gc (GC stats in KB)', '-gccause (last GC cause)', '-printcompilation (JIT)'],
    example: `# GC utilization — poll every 1 second, 10 samples
jstat -gcutil 12345 1000 10

# GC statistics with cause
jstat -gccause 12345 2000

# Watch compilation activity
jstat -printcompilation 12345 1000`,
    output: `  S0     S1     E      O      M     CCS    YGC   YGCT    FGC  FGCT   CGC  CGCT    GCT
  0.00  98.44  67.21  45.33  97.01  94.12   142  1.234    2   0.567   18  0.234  2.035
  0.00  98.44  78.92  45.33  97.01  94.12   142  1.234    2   0.567   18  0.234  2.035
 52.31   0.00  12.45  45.38  97.01  94.12   143  1.256    2   0.567   18  0.234  2.057`,
    tips: [
      'S0/S1 = Survivor spaces, E = Eden, O = Old Gen, M = Metaspace',
      'YGC/FGC = Young/Full GC count, YGCT/FGCT = time spent',
      'If O keeps climbing and FGC count is rising → memory leak',
      'High YGCT per YGC → objects are surviving too long, increase young gen',
    ],
  },
  {
    id: 'jcmd',
    name: 'jcmd',
    fullName: 'JVM Command (Swiss Army Knife)',
    color: '#F59E0B',
    purpose: 'The modern replacement for jstack/jmap/jinfo combined. Sends diagnostic commands to a running JVM. Preferred for production.',
    when: 'Any diagnostic task — thread dump, heap info, GC run, JFR recording, VM flags, class histogram.',
    flags: ['Thread.print', 'GC.heap_info', 'GC.run', 'VM.flags', 'VM.system_properties', 'JFR.start'],
    example: `# Thread dump (replaces jstack)
jcmd 12345 Thread.print

# Heap info (quick summary)
jcmd 12345 GC.heap_info

# Force GC
jcmd 12345 GC.run

# Show all VM flags
jcmd 12345 VM.flags

# Start JFR recording
jcmd 12345 JFR.start duration=60s filename=rec.jfr

# List available commands
jcmd 12345 help`,
    output: `# GC.heap_info output:
garbage-first heap   total 2097152K, used 892416K
  region size 2048K, 198 young (405504K), 12 survivors (24576K)
 Metaspace       used 84321K, committed 85760K
  class space    used 10234K, committed 10752K`,
    tips: [
      'jcmd is the recommended tool for production (Oracle official)',
      'Thread.print gives same output as jstack but without attaching',
      'JFR.start is the lowest-overhead profiling method — always use JFR in prod',
      'VM.flags -all shows ALL JVM flags including hidden ones',
    ],
  },
  {
    id: 'jfr',
    name: 'JFR',
    fullName: 'Java Flight Recorder',
    color: '#EF4444',
    purpose: 'Continuous, low-overhead profiling built into the JVM. Records events: method execution, GC, threads, I/O, locks, allocations. The gold standard for Java profiling.',
    when: 'Always-on in production. Essential for: latency analysis, finding hot methods, GC analysis, lock contention, memory allocation profiling.',
    flags: ['-XX:StartFlightRecording=...', 'jcmd JFR.start', 'jcmd JFR.dump', 'jcmd JFR.stop'],
    example: `# Start recording at JVM launch
java -XX:StartFlightRecording=duration=300s,\\
  filename=app.jfr,settings=profile \\
  -jar app.jar

# Start recording on running JVM
jcmd 12345 JFR.start duration=60s \\
  filename=recording.jfr settings=profile

# Dump current recording
jcmd 12345 JFR.dump filename=snapshot.jfr

# Analyze with JDK Mission Control (jmc)
jmc recording.jfr`,
    output: `# JFR captures these events (among 100+ event types):
# 
# jdk.CPULoad          - CPU usage over time
# jdk.GarbageCollection - every GC pause with duration
# jdk.ThreadPark       - where threads wait
# jdk.ObjectAllocationSample - allocation hot spots
# jdk.ExecutionSample  - method profiling (flame graph)
# jdk.JavaMonitorWait  - lock contention
# jdk.FileRead/Write   - I/O latency`,
    tips: [
      'JFR overhead is <1% — safe for always-on production use',
      'Use "default" settings for continuous, "profile" for detailed analysis',
      'JDK Mission Control (jmc) visualizes JFR files with flame graphs',
      'IntelliJ IDEA and async-profiler can also read .jfr files',
      'Replaces the need for external profilers in most cases',
    ],
  },
  {
    id: 'jinfo',
    name: 'jinfo',
    fullName: 'JVM Configuration Info',
    color: '#06B6D4',
    purpose: 'View and dynamically change certain JVM flags on a running process. Useful for toggling diagnostics without restart.',
    when: 'Need to check what flags a JVM is running with, or toggle diagnostic flags (like GC logging) at runtime.',
    flags: ['-flags (all flags)', '-sysprops (system properties)', '-flag +FlagName (enable)', '-flag -FlagName (disable)'],
    example: `# Show all flags
jinfo -flags 12345

# Check specific flag value
jinfo -flag MaxHeapSize 12345
jinfo -flag UseG1GC 12345

# Enable a manageable flag at runtime
jinfo -flag +HeapDumpOnOutOfMemoryError 12345
jinfo -flag +PrintGCDetails 12345`,
    output: `# jinfo -flags output:
-XX:CICompilerCount=4 -XX:ConcGCThreads=2
-XX:G1HeapRegionSize=2097152 -XX:InitialHeapSize=2147483648
-XX:MaxHeapSize=2147483648 -XX:+UseG1GC
-XX:+UseCompressedOops -XX:+UseCompressedClassPointers`,
    tips: [
      'Only "manageable" flags can be changed at runtime',
      'Use jcmd VM.flags instead for a complete view',
      'Great for enabling HeapDumpOnOOM in production without restart',
      'Deprecated in newer JDKs — prefer jcmd VM.set_flag',
    ],
  },
];

// ─── Troubleshooting Scenarios ────────────────────────────────────────────────

const SCENARIOS = [
  {
    id: 'high-cpu',
    title: 'High CPU Usage',
    icon: Cpu,
    color: '#EF4444',
    symptoms: ['CPU at 100%', 'Application slow', 'Fans spinning'],
    steps: [
      'Find the PID: jps -l',
      'Take 3 thread dumps 5s apart: jstack <pid> > dump1.txt',
      'Find OS thread consuming CPU: top -H -p <pid> (Linux)',
      'Convert thread ID to hex: printf "%x" <tid>',
      'Search for that hex nid in the thread dump',
      'The stack trace shows what code is burning CPU',
    ],
    rootCauses: ['Infinite loop', 'Regex backtracking', 'Expensive computation in hot path', 'Busy-wait spin loop', 'JIT compilation storm at startup'],
  },
  {
    id: 'oom',
    title: 'OutOfMemoryError',
    icon: HardDrive,
    color: '#8B5CF6',
    symptoms: ['java.lang.OutOfMemoryError: Java heap space', 'App crashes after hours/days', 'GC overhead limit exceeded'],
    steps: [
      'Enable auto heap dump: -XX:+HeapDumpOnOutOfMemoryError',
      'When OOM occurs, open heap dump in Eclipse MAT',
      'Look at "Leak Suspects" report',
      'Check dominator tree — what retains the most memory?',
      'Trace GC root path to find WHY objects are kept alive',
      'Common culprits: static Map, unclosed resources, listener lists',
    ],
    rootCauses: ['Static collections growing unboundedly', 'Cache without eviction', 'Unclosed streams/connections', 'ClassLoader leak (redeploy)', 'Large query result sets held in memory'],
  },
  {
    id: 'gc-pauses',
    title: 'Long GC Pauses',
    icon: Activity,
    color: '#F59E0B',
    symptoms: ['Application freezes periodically', 'Latency spikes', 'Timeouts during GC'],
    steps: [
      'Enable GC logging: -Xlog:gc*:file=gc.log:time',
      'Monitor with: jstat -gcutil <pid> 1000',
      'Look for Full GC events in the log',
      'Check if Old Gen is full (O column near 100%)',
      'If yes → likely memory leak or heap too small',
      'If no → consider switching to ZGC for sub-ms pauses',
    ],
    rootCauses: ['Heap too small for workload', 'Too many long-lived objects', 'Humongous allocations (G1)', 'Reference processing (weak/soft refs)', 'Metaspace growth triggering Full GC'],
  },
  {
    id: 'deadlock',
    title: 'Application Hanging',
    icon: Bug,
    color: '#EC4899',
    symptoms: ['App stops responding', 'Threads appear stuck', 'No CPU usage but no progress'],
    steps: [
      'Take thread dump: jcmd <pid> Thread.print',
      'Look for "Found one Java-level deadlock" message',
      'If deadlock: identify the two threads and locks involved',
      'If not deadlock: look for threads in BLOCKED/WAITING state',
      'Check what lock they are waiting for and who holds it',
      'Fix: use lock ordering, timeouts, or ReentrantLock.tryLock()',
    ],
    rootCauses: ['Deadlock (lock ordering violation)', 'Thread starvation (pool exhausted)', 'Blocking I/O without timeout', 'Database connection pool exhausted', 'Waiting for external service indefinitely'],
  },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function ProfilingPage() {
  const [selectedTool, setSelectedTool] = useState(TOOLS[0]);
  const [activeScenario, setActiveScenario] = useState(0);

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Production Debugging"
        title="JVM Profiling &"
        titleHighlight="Troubleshooting"
        description="Master the diagnostic tools every Java developer needs — from finding memory leaks to diagnosing deadlocks. These skills separate junior developers from senior engineers."
        icon={Activity}
        iconColor="#EF4444"
        gradient="from-red-400 via-rose-400 to-pink-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">

        {/* Tool Selector */}
        <AnimatedSection>
          <div className="flex flex-wrap gap-2">
            {TOOLS.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setSelectedTool(tool)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium"
                style={{
                  borderColor: selectedTool.id === tool.id ? `${tool.color}50` : 'rgba(255,255,255,0.08)',
                  backgroundColor: selectedTool.id === tool.id ? `${tool.color}18` : 'rgba(255,255,255,0.02)',
                  color: selectedTool.id === tool.id ? tool.color : '#94a3b8',
                }}
              >
                <Terminal className="w-3.5 h-3.5" />
                {tool.name}
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* Selected Tool Detail */}
        <AnimatedSection delay={0.05}>
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Info Panel */}
            <GlassCard className="p-6 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${selectedTool.color}20` }}>
                  <Terminal className="w-5 h-5" style={{ color: selectedTool.color }} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white">{selectedTool.name}</h2>
                  <p className="text-[10px] text-slate-500">{selectedTool.fullName}</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed mb-4">{selectedTool.purpose}</p>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-400">When to use</span>
                <p className="text-xs text-slate-300 mt-1">{selectedTool.when}</p>
              </div>

              <div className="mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Key Flags</span>
                <div className="mt-2 space-y-1.5">
                  {selectedTool.flags.map((flag) => (
                    <div key={flag} className="text-[10px] font-mono text-slate-400 px-2 py-1 rounded bg-white/[0.03] border border-white/[0.04]">
                      {flag}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">Pro Tips</span>
                <ul className="mt-2 space-y-1.5">
                  {selectedTool.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] text-slate-400">
                      <CheckCircle2 className="w-3 h-3 text-green-400 shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>

            {/* Example + Output */}
            <div className="lg:col-span-2 space-y-4">
              <CodeBlock
                title={`${selectedTool.name} — Usage`}
                language="bash"
                code={selectedTool.example}
                showLineNumbers
              />
              <GlassCard className="overflow-hidden">
                <div className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: selectedTool.color }} />
                  <span className="text-xs font-bold text-white">Sample Output</span>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-[11px] font-mono text-slate-400 leading-relaxed whitespace-pre">
                    {selectedTool.output}
                  </pre>
                </div>
              </GlassCard>
            </div>
          </div>
        </AnimatedSection>

        {/* Troubleshooting Scenarios */}
        <AnimatedSection delay={0.15}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-2">Troubleshooting Playbooks</h2>
            <p className="text-xs text-slate-500 mb-5">Real-world scenarios with step-by-step resolution guides.</p>

            {/* Scenario tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {SCENARIOS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActiveScenario(i)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium"
                    style={{
                      borderColor: activeScenario === i ? `${s.color}40` : 'rgba(255,255,255,0.08)',
                      backgroundColor: activeScenario === i ? `${s.color}15` : 'rgba(255,255,255,0.02)',
                      color: activeScenario === i ? s.color : '#94a3b8',
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {s.title}
                  </button>
                );
              })}
            </div>

            {/* Active scenario */}
            <motion.div
              key={activeScenario}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {(() => {
                const s = SCENARIOS[activeScenario];
                const Icon = s.icon;
                return (
                  <div className="grid lg:grid-cols-3 gap-5">
                    {/* Symptoms */}
                    <div className="rounded-xl border p-4" style={{ borderColor: `${s.color}20`, backgroundColor: `${s.color}05` }}>
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="w-4 h-4" style={{ color: s.color }} />
                        <span className="text-xs font-bold" style={{ color: s.color }}>Symptoms</span>
                      </div>
                      <ul className="space-y-2">
                        {s.symptoms.map((sym, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                            {sym}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Step-by-step */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Search className="w-4 h-4 text-blue-400" />
                        <span className="text-xs font-bold text-blue-400">Diagnosis Steps</span>
                      </div>
                      <ol className="space-y-2">
                        {s.steps.map((step, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-xs text-slate-400">
                            <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 bg-blue-500/20 text-blue-400">
                              {i + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Root causes */}
                    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Bug className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-amber-400">Common Root Causes</span>
                      </div>
                      <ul className="space-y-2">
                        {s.rootCauses.map((cause, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                            <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                            {cause}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          </GlassCard>
        </AnimatedSection>

        {/* Tool Decision Tree */}
        <AnimatedSection delay={0.2}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Which Tool When?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { problem: 'Need the PID', tool: 'jps', color: '#64748b' },
                { problem: 'App is hanging / deadlock', tool: 'jstack / jcmd Thread.print', color: '#EC4899' },
                { problem: 'OutOfMemoryError', tool: 'jmap -dump + Eclipse MAT', color: '#8B5CF6' },
                { problem: 'GC pauses too long', tool: 'jstat -gcutil + GC logs', color: '#10B981' },
                { problem: 'Need comprehensive profiling', tool: 'JFR + JDK Mission Control', color: '#EF4444' },
                { problem: 'Check/change JVM flags', tool: 'jcmd VM.flags / jinfo', color: '#F59E0B' },
                { problem: 'Find hottest methods', tool: 'JFR + async-profiler', color: '#EF4444' },
                { problem: 'Memory leak investigation', tool: 'jmap -histo (compare over time)', color: '#8B5CF6' },
                { problem: 'Monitor GC in real-time', tool: 'jstat -gcutil 1000', color: '#10B981' },
              ].map((item) => (
                <div key={item.problem} className="flex items-start gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                  <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: item.color }} />
                  <div>
                    <p className="text-xs text-slate-300">{item.problem}</p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: item.color }}>{item.tool}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Interview Questions */}
        <AnimatedSection delay={0.25}>
          <GlassCard className="p-6">
            <div className="mb-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-red-400">Interview Ready</span>
              <h2 className="text-lg font-bold text-white mt-1">Profiling Interview Questions</h2>
            </div>
            {[
              { q: 'How do you diagnose a memory leak in production?', a: 'Enable -XX:+HeapDumpOnOutOfMemoryError. When OOM occurs, analyze the heap dump with Eclipse MAT. Look at the Leak Suspects report and dominator tree. Trace GC root paths to find what retains dead objects. Common culprits: static Map growing unbounded, unclosed database connections, event listeners never unregistered.' },
              { q: 'Your app has 100% CPU usage. How do you find the cause?', a: 'Take 3 thread dumps 5 seconds apart (jstack or jcmd Thread.print). Find threads consistently in RUNNABLE state at the same stack frame. Cross-reference with OS thread IDs (top -H -p <pid> on Linux). The stack trace of the hot thread reveals the code burning CPU.' },
              { q: 'What is JFR and why should it always be enabled?', a: 'Java Flight Recorder is a built-in, always-on profiler with <1% overhead. It continuously records JVM events (GC, threads, I/O, allocations, compilation). When an incident occurs, you dump the recording and analyze with JDK Mission Control. Unlike external profilers, JFR is production-safe and captures data you cannot get after the fact.' },
              { q: 'How do you detect if GC is causing latency?', a: 'Enable GC logging (-Xlog:gc*:file=gc.log). Monitor with jstat -gcutil. Look for Full GC events, long STW pauses, and Old Gen filling up. If O% stays high and FGC count rises, you likely have a leak. If pauses are long but heap is fine, consider ZGC for sub-ms pauses.' },
              { q: 'Difference between jstack, jcmd Thread.print, and kill -3?', a: 'All produce thread dumps. jstack attaches to the JVM externally. jcmd Thread.print sends a diagnostic command via the JVM attach API (preferred). kill -3 (SIGQUIT on Unix) makes the JVM print the dump to stdout. In production, jcmd is safest. kill -3 is useful when other tools cannot attach.' },
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
