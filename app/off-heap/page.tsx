'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, AlertTriangle, CheckCircle2, Shield, Zap } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import CodeBlock from '@/components/ui/CodeBlock';
import StatBar from '@/components/ui/StatBar';

// ─── Memory Regions ───────────────────────────────────────────────────────────

const MEMORY_REGIONS = [
  { name: 'Java Heap', managed: true, gc: true, color: '#3B82F6', size: 'Controlled by -Xmx', desc: 'Where Java objects live. Managed by GC. Safe. Subject to GC pauses.' },
  { name: 'Metaspace', managed: true, gc: true, color: '#8B5CF6', size: '-XX:MaxMetaspaceSize', desc: 'Class metadata, method bytecode, constant pools. Native memory. GC can unload classes.' },
  { name: 'Thread Stacks', managed: true, gc: false, color: '#10B981', size: '-Xss per thread', desc: 'One stack per thread. Fixed size. StackOverflowError if exceeded.' },
  { name: 'Code Cache', managed: true, gc: false, color: '#F59E0B', size: '-XX:ReservedCodeCacheSize', desc: 'JIT-compiled native code. Fixed reservation. JIT stops if full.' },
  { name: 'Direct ByteBuffers', managed: false, gc: false, color: '#EF4444', size: '-XX:MaxDirectMemorySize', desc: 'Off-heap memory allocated via ByteBuffer.allocateDirect(). Not GC-managed directly.' },
  { name: 'Native/Unsafe Memory', managed: false, gc: false, color: '#EC4899', size: 'Unlimited (OS limit)', desc: 'Allocated via Unsafe.allocateMemory() or MemorySegment. Completely unmanaged.' },
];

// ─── Off-Heap techniques ──────────────────────────────────────────────────────

interface OffHeapTechnique {
  id: string;
  name: string;
  color: string;
  era: string;
  description: string;
  useCase: string;
  risks: string[];
  code: string;
}

const TECHNIQUES: OffHeapTechnique[] = [
  {
    id: 'direct-buffer',
    name: 'Direct ByteBuffer',
    color: '#3B82F6',
    era: 'Java 1.4+',
    description: 'Allocates memory outside the Java heap via the OS. Used for I/O operations to avoid copying between Java heap and native memory (zero-copy I/O).',
    useCase: 'Network I/O (Netty, NIO channels), file-mapped memory, large data buffers that must not trigger GC pauses.',
    risks: ['Memory not freed until GC collects the ByteBuffer object', 'Can cause OOM if many buffers allocated without GC', 'Harder to debug (not in heap dumps)'],
    code: `// Allocate 64MB off-heap
ByteBuffer buf = ByteBuffer.allocateDirect(64 * 1024 * 1024);

// Write data (no GC pressure)
buf.putInt(42);
buf.putLong(System.nanoTime());
buf.flip();

// Zero-copy I/O: OS reads directly from this buffer
// No copy from heap to native memory needed
channel.write(buf);

// Memory freed when buf is garbage collected
// Force cleanup: ((DirectBuffer) buf).cleaner().clean();

// Limit: -XX:MaxDirectMemorySize=256m (default = -Xmx)
// Monitor: jcmd <pid> VM.native_memory (NMT)`,
  },
  {
    id: 'unsafe',
    name: 'sun.misc.Unsafe',
    color: '#EF4444',
    era: 'Java 1.4+ (internal API)',
    description: 'Low-level memory access: raw allocation, pointer arithmetic, CAS operations, memory fences. Used by frameworks (Netty, Kafka, off-heap caches) for maximum performance.',
    useCase: 'Off-heap data structures, lock-free algorithms, direct memory access, serialization without constructors, cache-line padding.',
    risks: ['Can crash the JVM (segfault)', 'No bounds checking', 'No type safety', 'Being phased out (replaced by VarHandle and MemorySegment)'],
    code: `// Get Unsafe instance (reflection hack)
Field f = Unsafe.class.getDeclaredField("theUnsafe");
f.setAccessible(true);
Unsafe unsafe = (Unsafe) f.get(null);

// Allocate raw memory (no GC, no zero-init)
long address = unsafe.allocateMemory(1024);

// Write/read at raw addresses
unsafe.putInt(address, 42);
unsafe.putLong(address + 4, System.nanoTime());
int value = unsafe.getInt(address); // 42

// CAS operation (lock-free algorithms)
unsafe.compareAndSwapInt(obj, fieldOffset, expected, newVal);

// MUST manually free (or leak forever)
unsafe.freeMemory(address);

// Java 9+: --add-opens java.base/sun.misc=ALL-UNNAMED`,
  },
  {
    id: 'memory-segment',
    name: 'MemorySegment (Panama)',
    color: '#10B981',
    era: 'Java 21+ (Final)',
    description: 'The modern replacement for Unsafe. Provides safe, performant off-heap memory access with bounds checking, deterministic deallocation via Arena, and no JVM crash risk.',
    useCase: 'Same as Unsafe but safe: off-heap data structures, native interop (FFM API), memory-mapped files, high-performance serialization.',
    risks: ['Requires Java 21+', 'Learning curve for Arena lifecycle', 'Slightly slower than raw Unsafe (bounds checks)'],
    code: `// Java 21+ Foreign Function & Memory API
import java.lang.foreign.*;

// Allocate off-heap memory with deterministic cleanup
try (Arena arena = Arena.ofConfined()) {

    // Allocate 1024 bytes off-heap
    MemorySegment segment = arena.allocate(1024);

    // Type-safe access with bounds checking
    segment.set(ValueLayout.JAVA_INT, 0, 42);
    segment.set(ValueLayout.JAVA_LONG, 4, System.nanoTime());

    int value = segment.get(ValueLayout.JAVA_INT, 0); // 42

    // Bounds-checked: this throws, not segfault!
    // segment.get(ValueLayout.JAVA_INT, 2000); // IndexOOB

    // Memory-mapped file
    MemorySegment mapped = arena.map(
        path, 0, Files.size(path), FileChannel.MapMode.READ_ONLY);

} // Memory freed here (deterministic, no GC needed)`,
  },
  {
    id: 'mmap',
    name: 'Memory-Mapped Files',
    color: '#F59E0B',
    era: 'Java 1.4+ (NIO)',
    description: 'Map a file directly into the process address space. The OS manages paging - reading from the mapped region reads from disk transparently. Used by databases and message queues.',
    useCase: 'Database storage engines (RocksDB, LMDB), message queues (Kafka log segments), large read-only datasets, shared memory between processes.',
    risks: ['OS page faults can cause unpredictable latency', 'File size limited by address space (irrelevant on 64-bit)', 'Cleanup requires GC or explicit unmap'],
    code: `// Classic NIO memory-mapped file
try (FileChannel channel = FileChannel.open(path, READ, WRITE)) {
    MappedByteBuffer mapped = channel.map(
        FileChannel.MapMode.READ_WRITE, 0, channel.size());

    // Read/write as if it were memory
    mapped.putInt(0, 42);      // writes to file
    int val = mapped.getInt(0); // reads from file

    mapped.force(); // flush to disk (like fsync)
}

// Kafka uses this for log segments:
// - Producer appends to mapped buffer (fast)
// - Consumer reads from same mapped file
// - OS handles caching/paging transparently
// - sendfile() syscall for zero-copy network transfer

// Java 21+: Use Arena.map() for safer API
try (Arena arena = Arena.ofConfined()) {
    MemorySegment mapped = arena.map(path, 0, size, READ_WRITE);
    mapped.set(ValueLayout.JAVA_INT, 0, 42);
}`,
  },
];

// ─── Page Component ───────────────────────────────────────────────────────────

export default function OffHeapPage() {
  const [selectedTechnique, setSelectedTechnique] = useState(0);
  const technique = TECHNIQUES[selectedTechnique];

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Senior / MAANG Level"
        title="Unsafe &"
        titleHighlight="Off-Heap Memory"
        description="When the managed heap is not enough. Direct ByteBuffers, sun.misc.Unsafe, MemorySegment (Panama), and memory-mapped files - the tools that power Kafka, Netty, and database engines."
        icon={HardDrive}
        iconColor="#EC4899"
        gradient="from-pink-400 via-rose-400 to-red-400"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-10">

        {/* Memory Regions */}
        <AnimatedSection>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-2">JVM Memory Regions</h2>
            <p className="text-xs text-slate-500 mb-5">Not all memory used by a Java process is on the GC-managed heap.</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {MEMORY_REGIONS.map((region, i) => (
                <motion.div
                  key={region.name}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="rounded-xl border p-4"
                  style={{ borderColor: `${region.color}25`, backgroundColor: `${region.color}05` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-bold" style={{ color: region.color }}>{region.name}</h4>
                    <div className="flex gap-1">
                      {region.managed && <span className="text-[8px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400">managed</span>}
                      {region.gc && <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">GC</span>}
                      {!region.managed && <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">manual</span>}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed mb-2">{region.desc}</p>
                  <code className="text-[9px] font-mono text-slate-500">{region.size}</code>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Technique Selector */}
        <AnimatedSection delay={0.1}>
          <div className="flex flex-wrap gap-2">
            {TECHNIQUES.map((t, i) => (
              <button
                key={t.id}
                onClick={() => setSelectedTechnique(i)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium"
                style={{
                  borderColor: selectedTechnique === i ? `${t.color}50` : 'rgba(255,255,255,0.08)',
                  backgroundColor: selectedTechnique === i ? `${t.color}18` : 'rgba(255,255,255,0.02)',
                  color: selectedTechnique === i ? t.color : '#94a3b8',
                }}
              >
                {t.name}
                <span className="text-[9px] text-slate-600">{t.era}</span>
              </button>
            ))}
          </div>
        </AnimatedSection>

        {/* Technique Detail */}
        <AnimatedSection delay={0.15}>
          <motion.div
            key={technique.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            <GlassCard className="p-5">
              <h3 className="text-sm font-bold text-white mb-3">{technique.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">{technique.description}</p>

              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 mb-4">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-green-400">Use case</span>
                <p className="text-xs text-slate-300 mt-1">{technique.useCase}</p>
              </div>

              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-red-400">Risks</span>
                <ul className="mt-2 space-y-1.5">
                  {technique.risks.map((risk, i) => (
                    <li key={i} className="flex items-start gap-2 text-[10px] text-slate-400">
                      <AlertTriangle className="w-3 h-3 text-red-400 shrink-0 mt-0.5" />
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            </GlassCard>

            <div className="lg:col-span-2">
              <CodeBlock
                title={`${technique.name} (${technique.era})`}
                language="java"
                code={technique.code}
                showLineNumbers
              />
            </div>
          </motion.div>
        </AnimatedSection>

        {/* Interview Questions */}
        <AnimatedSection delay={0.2}>
          <GlassCard className="p-6">
            <div className="mb-5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-pink-400">MAANG Interview</span>
              <h2 className="text-lg font-bold text-white mt-1">Off-Heap Interview Questions</h2>
            </div>
            {[
              { q: 'When would you use off-heap memory instead of the Java heap?', a: 'Off-heap when: you need to avoid GC pauses on large datasets (caches, databases), zero-copy I/O (network buffers), shared memory between processes, or memory-mapped files. The trade-off: you lose GC safety and must manage memory lifecycle manually. Frameworks like Netty, Kafka, and Cassandra use off-heap extensively for predictable latency.' },
              { q: 'What is sun.misc.Unsafe and why is it being removed?', a: 'Unsafe provides raw memory access, CAS operations, and object manipulation without safety checks. It can crash the JVM with a segfault. Oracle is removing it because: 1) VarHandle replaces CAS/memory fences, 2) MemorySegment (Panama) replaces raw allocation, 3) MethodHandles replaces reflective object creation. Java 21+ FFM API is the official replacement.' },
              { q: 'How does Kafka achieve high throughput with off-heap memory?', a: 'Kafka uses memory-mapped files for log segments. Producers append to the mapped buffer (OS writes to page cache). Consumers read from the same file (OS serves from page cache). sendfile() syscall copies directly from page cache to network socket (zero-copy). No Java heap involved - no GC pressure even at GB/s throughput.' },
              { q: 'What is the difference between DirectByteBuffer and MappedByteBuffer?', a: 'DirectByteBuffer: off-heap memory allocated by the JVM (malloc). Used for I/O buffers. Freed by GC + Cleaner. MappedByteBuffer: memory-mapped file - a region of virtual memory backed by a file on disk. The OS handles paging. Both are off-heap, but mapped buffers are file-backed and persist.' },
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
