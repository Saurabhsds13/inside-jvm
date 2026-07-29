'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Droplets, TrendingUp, Search, Wrench, BookOpen, Flame } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import CodeBlock from '@/components/ui/CodeBlock';
import StatBar from '@/components/ui/StatBar';

// ─── Leak Patterns ────────────────────────────────────────────────────────────

interface LeakPattern {
  id: string;
  title: string;
  severity: 'Critical' | 'High' | 'Medium';
  color: string;
  description: string;
  cause: string;
  badCode: string;
  fixedCode: string;
  detection: string;
  prevention: string;
}

const LEAK_PATTERNS: LeakPattern[] = [
  {
    id: 'static-collection',
    title: 'Static Collection Growth',
    severity: 'Critical',
    color: '#EF4444',
    description: 'A static Map, List, or Set that objects are added to but never removed. Since static fields are GC roots, everything in the collection is reachable forever.',
    cause: 'Static fields live as long as the ClassLoader (usually the entire JVM lifetime). Any object reachable from a static field cannot be garbage collected.',
    badCode: `public class EventManager {
    // LEAK: This map grows forever!
    private static final Map<String, List<Event>>
        history = new HashMap<>();

    public void recordEvent(String userId, Event e) {
        history.computeIfAbsent(userId,
            k -> new ArrayList<>()).add(e);
        // Events are NEVER removed
        // After days/weeks → OOM
    }
}`,
    fixedCode: `public class EventManager {
    // FIX 1: Use bounded cache with eviction
    private static final Map<String, List<Event>>
        history = new LinkedHashMap<>(1000, 0.75f, true) {
        protected boolean removeEldestEntry(
                Map.Entry eldest) {
            return size() > 10_000; // cap at 10K entries
        }
    };

    // FIX 2: Use Caffeine/Guava cache
    // Cache<String, List<Event>> history =
    //     Caffeine.newBuilder()
    //         .maximumSize(10_000)
    //         .expireAfterWrite(1, TimeUnit.HOURS)
    //         .build();
}`,
    detection: 'jmap -histo shows HashMap$Node count growing over time. Heap dump shows large retained size under the static field.',
    prevention: 'Never use unbounded static collections. Always use caches with size limits and TTL eviction policies.',
  },
  {
    id: 'listener-leak',
    title: 'Unregistered Listeners / Callbacks',
    severity: 'High',
    color: '#F59E0B',
    description: 'Registering a listener or callback but never unregistering it. The event source holds a reference to your object, preventing GC.',
    cause: 'The publisher/observable holds a strong reference to all registered listeners. Even after the subscriber is no longer needed, it cannot be collected.',
    badCode: `public class DashboardView {
    public DashboardView(EventBus bus) {
        // LEAK: 'this' is now referenced by EventBus
        bus.register(this);
        // If DashboardView is closed/disposed
        // but never calls bus.unregister(this)
        // → this entire object + its fields stay in memory
    }

    @Subscribe
    public void onDataUpdate(DataEvent event) {
        updateChart(event);
    }
    // No cleanup method!
}`,
    fixedCode: `public class DashboardView implements AutoCloseable {
    private final EventBus bus;

    public DashboardView(EventBus bus) {
        this.bus = bus;
        bus.register(this);
    }

    @Subscribe
    public void onDataUpdate(DataEvent event) {
        updateChart(event);
    }

    @Override
    public void close() {
        bus.unregister(this); // Always unregister!
    }
}
// Usage: try (var view = new DashboardView(bus)) { ... }`,
    detection: 'Heap dump shows many instances of the listener class that should have been collected. GC root path traces back to the event bus.',
    prevention: 'Always implement cleanup/close methods. Use WeakReference-based listeners when possible. Consider lifecycle-aware components.',
  },
  {
    id: 'classloader-leak',
    title: 'ClassLoader Leak (Redeploy)',
    severity: 'Critical',
    color: '#EF4444',
    description: 'After redeploying a web application, the old ClassLoader and ALL classes it loaded remain in memory. Common in Tomcat/Jetty hot-redeploys.',
    cause: 'A single reference from outside the webapp ClassLoader to any class/object inside it prevents the ENTIRE ClassLoader (and all loaded classes, static fields, etc.) from being collected.',
    badCode: `// Common causes of ClassLoader leaks:

// 1. ThreadLocal not cleaned up
ThreadLocal<MyAppObject> local = new ThreadLocal<>();
local.set(new MyAppObject());
// Thread outlives the webapp → holds ref to MyAppObject
// → holds ref to MyAppObject.class
// → holds ref to WebappClassLoader → EVERYTHING leaks

// 2. JDBC driver registered but not deregistered
// DriverManager holds a static ref to your Driver class

// 3. Shutdown hook referencing webapp class
Runtime.getRuntime().addShutdownHook(
    new Thread(() -> myService.shutdown()));`,
    fixedCode: `// FIX 1: Clean ThreadLocals in a Filter
public class CleanupFilter implements Filter {
    public void doFilter(...) throws ... {
        try {
            chain.doFilter(req, res);
        } finally {
            MyThreadLocal.remove(); // ALWAYS clean up
        }
    }
}

// FIX 2: Deregister JDBC drivers on undeploy
@WebListener
public class AppShutdown implements
        ServletContextListener {
    public void contextDestroyed(ServletContextEvent e) {
        Enumeration<Driver> drivers =
            DriverManager.getDrivers();
        while (drivers.hasMoreElements()) {
            DriverManager.deregisterDriver(
                drivers.nextElement());
        }
    }
}`,
    detection: 'Metaspace grows after each redeploy. jmap -clstats shows duplicate ClassLoaders. Heap dump shows old ClassLoader instances not collected.',
    prevention: 'Always clean ThreadLocals in finally blocks. Deregister JDBC drivers. Remove shutdown hooks. Use Tomcat leak detection valve.',
  },
  {
    id: 'connection-leak',
    title: 'Unclosed Resources (Connections, Streams)',
    severity: 'High',
    color: '#F59E0B',
    description: 'Opening a database connection, file stream, or network socket but not closing it in all code paths (especially exception paths).',
    cause: 'The resource object itself is small, but it holds native handles (file descriptors, socket buffers, DB cursors). These consume OS resources and the associated objects stay in heap.',
    badCode: `public List<User> getUsers() throws SQLException {
    Connection conn = dataSource.getConnection();
    Statement stmt = conn.createStatement();
    ResultSet rs = stmt.executeQuery("SELECT * FROM users");

    List<User> users = new ArrayList<>();
    while (rs.next()) {
        users.add(mapUser(rs));
    }
    // BUG: If mapUser() throws, conn is NEVER closed!
    // Connection pool exhausted → app hangs
    conn.close();
    return users;
}`,
    fixedCode: `public List<User> getUsers() throws SQLException {
    // FIX: try-with-resources guarantees cleanup
    try (Connection conn = dataSource.getConnection();
         Statement stmt = conn.createStatement();
         ResultSet rs = stmt.executeQuery(
             "SELECT * FROM users")) {

        List<User> users = new ArrayList<>();
        while (rs.next()) {
            users.add(mapUser(rs));
        }
        return users;
    }
    // conn, stmt, rs ALL closed even if exception thrown
}`,
    detection: 'Connection pool timeouts in logs. jstack shows threads waiting for connections. OS shows many open file descriptors (lsof -p <pid>).',
    prevention: 'ALWAYS use try-with-resources. Configure connection pool leak detection (HikariCP leakDetectionThreshold). Set maxLifetime on connections.',
  },
  {
    id: 'inner-class',
    title: 'Inner Class Holding Outer Reference',
    severity: 'Medium',
    color: '#06B6D4',
    description: 'Non-static inner classes (and anonymous classes) implicitly hold a reference to the enclosing outer class instance. If the inner class outlives the outer, the outer cannot be collected.',
    cause: 'Java compiler generates a hidden field (this$0) in non-static inner classes pointing to the outer instance. This is invisible in source code but very real in bytecode.',
    badCode: `public class Activity {
    private byte[] largeData = new byte[10_000_000]; // 10MB

    public void startBackgroundWork() {
        // LEAK: This Runnable is a non-static inner class
        // It holds an implicit reference to Activity.this
        executor.submit(new Runnable() {
            public void run() {
                doWork(); // only needs doWork()
                // But holds ref to ALL of Activity (10MB!)
            }
        });
    }
    // Even if Activity is "done", the 10MB stays
    // until the Runnable completes
}`,
    fixedCode: `public class Activity {
    private byte[] largeData = new byte[10_000_000];

    public void startBackgroundWork() {
        // FIX 1: Use a static inner class or lambda
        // that only captures what it needs
        Runnable task = Activity::doStaticWork;
        executor.submit(task);
    }

    // FIX 2: Static method — no implicit reference
    private static void doStaticWork() {
        // Cannot accidentally reference outer fields
    }

    // FIX 3: Extract needed data before submitting
    public void startWork() {
        String needed = this.computeValue();
        executor.submit(() -> process(needed));
        // Lambda captures only 'needed', not 'this'
    }
}`,
    detection: 'Heap dump shows unexpectedly large retained size for Runnable/Callable instances. Look for this$0 field in inner class instances.',
    prevention: 'Prefer static inner classes. Use lambdas that only capture needed values. Be especially careful with long-running async tasks.',
  },
];

// ─── GC Tuning Scenarios ──────────────────────────────────────────────────────

interface TuningScenario {
  id: string;
  title: string;
  color: string;
  symptom: string;
  metrics: { label: string; before: number; after: number }[];
  diagnosis: string;
  solution: string;
  flags: string;
}

const TUNING_SCENARIOS: TuningScenario[] = [
  {
    id: 'frequent-full-gc',
    title: 'Frequent Full GC',
    color: '#EF4444',
    symptom: 'Full GC every few minutes, each pausing the app for 2-5 seconds. Old Gen fills up repeatedly.',
    metrics: [
      { label: 'Full GC Frequency', before: 85, after: 10 },
      { label: 'Avg Pause Time', before: 90, after: 15 },
      { label: 'Throughput', before: 30, after: 90 },
    ],
    diagnosis: 'Old Gen fills up because too many objects are being promoted from Young Gen. Either Young Gen is too small (objects tenured prematurely) or there is a genuine memory leak.',
    solution: 'Increase heap size (-Xmx). Set -Xms = -Xmx. Increase Young Gen ratio (-XX:NewRatio=2 or -Xmn). If Old Gen still fills → memory leak investigation needed.',
    flags: '-Xmx4g -Xms4g -XX:NewRatio=2 -XX:MaxGCPauseMillis=200',
  },
  {
    id: 'long-minor-gc',
    title: 'Long Minor GC Pauses',
    color: '#F59E0B',
    symptom: 'Young GC pauses of 50-200ms. Acceptable for batch but too slow for latency-sensitive services.',
    metrics: [
      { label: 'Minor GC Pause', before: 70, after: 20 },
      { label: 'Promotion Rate', before: 80, after: 30 },
      { label: 'Survivor Overflow', before: 75, after: 10 },
    ],
    diagnosis: 'Too many objects survive Minor GC (high survival rate). Survivor spaces overflow, causing premature promotion to Old Gen. Objects that would die in the next GC cycle are being tenured.',
    solution: 'Increase survivor space size. Increase tenuring threshold (-XX:MaxTenuringThreshold=15). Reduce allocation rate if possible. Consider G1 with smaller regions.',
    flags: '-XX:SurvivorRatio=6 -XX:MaxTenuringThreshold=15 -XX:+AlwaysTenure=false',
  },
  {
    id: 'latency-spikes',
    title: 'Periodic Latency Spikes',
    color: '#8B5CF6',
    symptom: 'Every 30-60 seconds the app has 500ms+ latency spikes. Between spikes, performance is great. Caused by GC pauses.',
    metrics: [
      { label: 'P99 Latency', before: 95, after: 10 },
      { label: 'Max Pause', before: 85, after: 5 },
      { label: 'Consistency', before: 20, after: 95 },
    ],
    diagnosis: 'G1 mixed GC or concurrent cycle causing stop-the-world pauses. The heap is large and G1 cannot meet pause targets. Marking cycle takes too long.',
    solution: 'Switch to ZGC (-XX:+UseZGC) for sub-millisecond pauses. If staying on G1, reduce MaxGCPauseMillis, increase concurrent GC threads, or reduce heap fragmentation.',
    flags: '-XX:+UseZGC -XX:+ZGenerational (Java 21+)',
  },
  {
    id: 'metaspace-oom',
    title: 'Metaspace OOM',
    color: '#06B6D4',
    symptom: 'OutOfMemoryError: Metaspace. Happens gradually, often after multiple hot-redeploys or with dynamic class generation.',
    metrics: [
      { label: 'Metaspace Growth', before: 90, after: 25 },
      { label: 'ClassLoader Count', before: 85, after: 20 },
      { label: 'Redeploy Safety', before: 10, after: 90 },
    ],
    diagnosis: 'Old ClassLoaders not collected after redeploy (ClassLoader leak), or frameworks generating too many dynamic classes (proxies, reflection, bytecode generation).',
    solution: 'Set -XX:MaxMetaspaceSize to catch leaks early. Fix ClassLoader leaks (clean ThreadLocals, deregister drivers). Limit dynamic proxy generation. Restart periodically if unfixable.',
    flags: '-XX:MaxMetaspaceSize=512m -XX:+TraceClassLoading -XX:+TraceClassUnloading',
  },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function MemoryLeaksPage() {
  const [selectedLeak, setSelectedLeak] = useState(0);
  const [selectedScenario, setSelectedScenario] = useState(0);
  const [showFix, setShowFix] = useState(false);

  const leak = LEAK_PATTERNS[selectedLeak];
  const scenario = TUNING_SCENARIOS[selectedScenario];

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Production Skills"
        title="Memory Leaks &"
        titleHighlight="GC Tuning"
        description="Learn to identify, diagnose, and fix the most common Java memory leaks. Master GC tuning scenarios that come up in real-world production systems and MAANG interviews."
        icon={Droplets}
        iconColor="#8B5CF6"
        gradient="from-purple-400 via-violet-400 to-indigo-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">

        {/* Leak Pattern Selector */}
        <AnimatedSection>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-bold text-white">Memory Leak Patterns</h2>
              <span className="ml-auto text-xs text-slate-600">Select a pattern to explore</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {LEAK_PATTERNS.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedLeak(i); setShowFix(false); }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all text-xs font-medium"
                  style={{
                    borderColor: selectedLeak === i ? `${p.color}50` : 'rgba(255,255,255,0.08)',
                    backgroundColor: selectedLeak === i ? `${p.color}15` : 'rgba(255,255,255,0.02)',
                    color: selectedLeak === i ? p.color : '#94a3b8',
                  }}
                >
                  {p.title}
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${p.color}20`, color: p.color }}>
                    {p.severity}
                  </span>
                </button>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Leak Detail */}
        <AnimatedSection delay={0.05}>
          <motion.div
            key={leak.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Info */}
              <GlassCard className="p-5">
                <h3 className="text-sm font-bold text-white mb-3">{leak.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{leak.description}</p>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Why it leaks</span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{leak.cause}</p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Detection</span>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">{leak.detection}</p>
                </div>

                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-3">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">Prevention</span>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">{leak.prevention}</p>
                </div>
              </GlassCard>

              {/* Code — Bad vs Fixed */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFix(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${!showFix ? 'border-red-500/40 bg-red-500/15 text-red-400' : 'border-white/[0.08] text-slate-400'}`}
                  >
                    ❌ Buggy Code
                  </button>
                  <button
                    onClick={() => setShowFix(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${showFix ? 'border-green-500/40 bg-green-500/15 text-green-400' : 'border-white/[0.08] text-slate-400'}`}
                  >
                    ✅ Fixed Code
                  </button>
                </div>
                <CodeBlock
                  title={showFix ? 'Fixed — No Leak' : 'Bug — Memory Leak'}
                  language="java"
                  code={showFix ? leak.fixedCode : leak.badCode}
                  showLineNumbers
                />
              </div>
            </div>
          </motion.div>
        </AnimatedSection>

        {/* GC Tuning Scenarios */}
        <AnimatedSection delay={0.15}>
          <GlassCard className="p-6">
            <div className="flex items-center gap-2 mb-5">
              <Wrench className="w-4 h-4 text-amber-400" />
              <h2 className="text-lg font-bold text-white">GC Tuning Scenarios</h2>
            </div>

            {/* Scenario tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {TUNING_SCENARIOS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedScenario(i)}
                  className="px-3 py-1.5 rounded-xl border transition-all text-xs font-medium"
                  style={{
                    borderColor: selectedScenario === i ? `${s.color}40` : 'rgba(255,255,255,0.08)',
                    backgroundColor: selectedScenario === i ? `${s.color}15` : 'rgba(255,255,255,0.02)',
                    color: selectedScenario === i ? s.color : '#94a3b8',
                  }}
                >
                  {s.title}
                </button>
              ))}
            </div>

            <motion.div
              key={scenario.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="grid lg:grid-cols-2 gap-6"
            >
              {/* Left: Problem + Solution */}
              <div className="space-y-4">
                <div className="rounded-xl border p-4" style={{ borderColor: `${scenario.color}20`, backgroundColor: `${scenario.color}05` }}>
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: scenario.color }}>Symptom</span>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{scenario.symptom}</p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400">Diagnosis</span>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{scenario.diagnosis}</p>
                </div>

                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">Solution</span>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{scenario.solution}</p>
                </div>

                <div className="rounded-xl border border-white/[0.06] bg-[#0a0f1e] p-3">
                  <span className="text-[10px] text-slate-500">Recommended flags:</span>
                  <code className="block text-[11px] font-mono text-amber-400 mt-1">{scenario.flags}</code>
                </div>
              </div>

              {/* Right: Before/After Metrics */}
              <div className="space-y-5">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">Before → After Tuning</h4>
                {scenario.metrics.map((m) => (
                  <div key={m.label} className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">{m.label}</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-red-400 w-12">Before</span>
                        <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-red-500/70"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${m.before}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        <span className="text-[10px] text-red-400 font-mono w-8">{m.before}%</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[9px] text-green-400 w-12">After</span>
                        <div className="flex-1 h-2 bg-white/[0.05] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full rounded-full bg-green-500/70"
                            initial={{ width: 0 }}
                            whileInView={{ width: `${m.after}%` }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                          />
                        </div>
                        <span className="text-[10px] text-green-400 font-mono w-8">{m.after}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </GlassCard>
        </AnimatedSection>

        {/* Heap Dump Analysis Workflow */}
        <AnimatedSection delay={0.2}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Heap Dump Analysis Workflow</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { step: '1', title: 'Capture', desc: 'jmap -dump:format=b,file=heap.hprof <pid> or auto via -XX:+HeapDumpOnOutOfMemoryError', color: '#3B82F6' },
                { step: '2', title: 'Open in MAT', desc: 'Eclipse Memory Analyzer Tool. Run "Leak Suspects" report automatically on open.', color: '#8B5CF6' },
                { step: '3', title: 'Dominator Tree', desc: 'Find objects with largest retained size. The dominator is what keeps everything alive.', color: '#F59E0B' },
                { step: '4', title: 'GC Root Path', desc: 'Right-click suspect → "Path to GC Roots" → "exclude weak refs". This shows WHY it cannot be collected.', color: '#10B981' },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-white/[0.06] p-4">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold mb-3"
                    style={{ backgroundColor: `${item.color}20`, color: item.color }}>
                    {item.step}
                  </div>
                  <h4 className="text-sm font-bold text-white mb-1.5">{item.title}</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Interview Questions */}
        <AnimatedSection delay={0.25}>
          <GlassCard className="p-6">
            <div className="mb-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-purple-400">Interview Ready</span>
              <h2 className="text-lg font-bold text-white mt-1">Memory & GC Interview Questions</h2>
            </div>
            {[
              { q: 'How do you find a memory leak in Java?', a: 'Step 1: Enable -XX:+HeapDumpOnOutOfMemoryError. Step 2: When OOM occurs (or take a manual dump with jmap), open in Eclipse MAT. Step 3: Check "Leak Suspects" report. Step 4: Examine dominator tree for unexpectedly large retained sizes. Step 5: Trace GC root path to find what holds the reference. Common roots: static fields, ThreadLocals, listener registrations.' },
              { q: 'What is the difference between a memory leak and high memory usage?', a: 'High memory usage means your app legitimately needs that memory (large cache, many active requests). A memory leak means objects that are no longer needed cannot be collected because something accidentally holds a reference to them. The key difference: legitimate usage plateaus, leaks grow continuously over time.' },
              { q: 'When would you choose ZGC over G1?', a: 'ZGC when: max pause time must be < 1ms (finance, gaming, real-time), heap is very large (multi-GB to TB), you can afford 10-15% throughput loss for consistency. G1 when: balanced throughput and latency, heap < 32GB, pause targets of 50-200ms are acceptable, you want the most predictable default behavior.' },
              { q: 'What is the difference between -Xmx and -XX:MaxRAMPercentage?', a: '-Xmx sets an absolute max heap (e.g., 4g). MaxRAMPercentage sets heap as a % of available RAM — ideal for containers where memory varies. In containers: use MaxRAMPercentage=75 (leave 25% for Metaspace, threads, native memory). On bare metal: use -Xmx with an explicit value.' },
              { q: 'How do you handle Metaspace OOM?', a: 'Set -XX:MaxMetaspaceSize to catch it early (default is unlimited). Common causes: ClassLoader leaks in web containers (fix ThreadLocals, deregister drivers), excessive dynamic proxy generation, or too many Groovy/script classes. Use -XX:+TraceClassLoading to see what is loading classes. After each redeploy, check if old ClassLoader was collected.' },
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
