import type { InterviewQuestion } from '@/types';

export const interviewQuestions: InterviewQuestion[] = [
  {
    id: 'q1',
    question: 'What are the main components of the JVM architecture?',
    answer:
      'The JVM consists of three main subsystems: the Class Loader Subsystem (loads, links, and initializes .class files), the Runtime Data Areas (Heap, Method Area/Metaspace, JVM Stack, PC Register, Native Method Stack), and the Execution Engine (Interpreter, JIT Compiler, and Garbage Collector). These work together with the Java Native Interface (JNI) and native method libraries to execute Java programs.',
    keyPoints: [
      'Class Loader Subsystem: Loading → Linking (Verify, Prepare, Resolve) → Initialization',
      'Runtime Data Areas: Heap and Method Area are shared; Stack, PC, Native Stack are per-thread',
      'Execution Engine contains both Interpreter and JIT Compiler',
      'Garbage Collector is part of the Execution Engine',
    ],
    difficulty: 'Beginner',
    category: 'Architecture',
    followUps: [
      'What is the difference between the JVM, JRE, and JDK?',
      'How does the JVM achieve platform independence?',
    ],
  },
  {
    id: 'q2',
    question: 'Explain the difference between the Heap and the Stack in the JVM.',
    answer:
      'The Heap is a shared memory region where all object instances and arrays are allocated. It is managed by the Garbage Collector and is accessible from all threads. The Stack (JVM Stack) is per-thread and stores stack frames. Each frame contains local variables, an operand stack, and a reference to the runtime constant pool. The Stack holds primitive local variables and object references, while actual objects always live on the Heap.',
    keyPoints: [
      'Heap: Shared, GC-managed, stores all objects and arrays',
      'Stack: Per-thread, stores frames with locals and operand stacks',
      'Object references on the Stack point to objects in the Heap',
      'StackOverflowError vs OutOfMemoryError',
      'Stack size is typically much smaller (default ~512KB–1MB per thread)',
    ],
    difficulty: 'Beginner',
    category: 'Memory',
    followUps: [
      'What is escape analysis and how does it affect object allocation?',
      'Can objects be allocated on the Stack?',
    ],
    codeExample: `// Stack: primitives and references
void method() {
    int x = 42;           // stored in stack frame locals
    String s = new String("hi"); // reference in stack, object in heap
}

// Heap: all object instances
String s = new String("hello"); // object on heap`,
  },
  {
    id: 'q3',
    question: 'What is the parent-delegation model in Class Loading?',
    answer:
      'The parent-delegation model means that when a ClassLoader is asked to load a class, it first delegates the request to its parent ClassLoader before attempting to load it itself. The hierarchy is: Bootstrap ClassLoader → Extension/Platform ClassLoader → Application ClassLoader → Custom ClassLoaders. A class is only loaded by the current ClassLoader if no parent can find it. This ensures core Java classes cannot be overridden by application code, providing security and preventing duplicate class definitions.',
    keyPoints: [
      'Delegation goes up the chain before loading locally',
      'Bootstrap ClassLoader is the root; it loads java.*, javax.* from the JDK',
      'Prevents malicious java.lang.String replacements',
      'Classes are unique per (name + ClassLoader) pair',
      'Can be broken via Thread.currentThread().setContextClassLoader()',
    ],
    difficulty: 'Intermediate',
    category: 'Class Loading',
    followUps: [
      'When would you create a custom ClassLoader?',
      'How does OSGi break the parent-delegation model and why?',
    ],
  },
  {
    id: 'q4',
    question: 'What is the difference between Minor GC, Major GC, and Full GC?',
    answer:
      'Minor GC collects only the Young Generation (Eden + Survivor spaces). It is triggered when Eden is full and is generally fast. Major GC (sometimes called Old GC) collects the Old Generation and is triggered when it fills up. Full GC collects the entire heap (Young + Old + Metaspace) and is the most expensive. Full GC is typically a Stop-The-World event and should be minimized in production systems.',
    keyPoints: [
      'Minor GC: Young Generation only; fast; triggered by Eden fill',
      'Major GC: Old Generation; slower; triggered by tenuring',
      'Full GC: Entire heap + Metaspace; most expensive STW event',
      'System.gc() requests (not guarantees) a Full GC',
      'G1 and ZGC aim to avoid Full GC entirely',
    ],
    difficulty: 'Intermediate',
    category: 'Garbage Collection',
    followUps: ['What causes objects to be promoted from Young to Old Generation?', 'How does G1 GC avoid Full GC?'],
  },
  {
    id: 'q5',
    question: 'What are GC roots? Why are they important?',
    answer:
      'GC roots are the starting points for the garbage collector\'s reachability traversal. Any object reachable from a GC root (directly or transitively) is considered live and will not be collected. GC roots include: local variables and operand stack entries in all active thread stacks, static fields of loaded classes, JNI global references, and references held by the JVM itself (e.g., class loaders, exception handlers). Any object not reachable from any GC root is eligible for collection.',
    keyPoints: [
      'GC roots are the foundation of reachability-based collection',
      'Types: stack locals, static fields, JNI globals, JVM internals',
      'Mark phase starts from all GC roots simultaneously',
      'Memory leaks occur when GC roots accidentally hold references to unused objects',
      'Tools like JVisualVM and Eclipse MAT help trace GC root paths',
    ],
    difficulty: 'Intermediate',
    category: 'Garbage Collection',
    followUps: ['How does a memory leak occur in Java despite having a GC?', 'What is the purpose of WeakReference?'],
  },
  {
    id: 'q6',
    question: 'Explain the Java Memory Model (JMM) and the concept of happens-before.',
    answer:
      'The Java Memory Model defines the rules by which reads and writes to shared variables are visible across threads. Without synchronization, each thread may work with a cached (local) copy of a variable. The happens-before relationship is a guarantee: if action A happens-before action B, then all memory writes by A are visible to B. Key happens-before rules: a lock release HB the subsequent acquisition of the same lock; a write to a volatile variable HB any subsequent read of that variable; Thread.start() HB any action in the started thread.',
    keyPoints: [
      'JMM defines visibility, ordering, and atomicity of shared memory accesses',
      'Without synchronization, threads may see stale values (CPU cache coherency)',
      'volatile guarantees visibility but not atomicity for compound actions',
      'synchronized guarantees both mutual exclusion and happens-before',
      'final fields: once constructed, safely visible to all threads without sync',
    ],
    difficulty: 'Advanced',
    category: 'Java Memory Model',
    followUps: ['What is a data race? How do you avoid one?', 'Why is double-checked locking broken without volatile?'],
    codeExample: `// Broken: no happens-before
boolean ready = false;
int value = 0;

// Thread A
value = 42;
ready = true; // not volatile — may be reordered

// Thread B
while (!ready) {} // may never see ready = true
System.out.println(value); // may print 0!

// Fixed: volatile establishes happens-before
volatile boolean ready = false;`,
  },
  {
    id: 'q7',
    question: 'What is JIT compilation and what optimizations does the HotSpot JIT perform?',
    answer:
      'JIT (Just-In-Time) compilation converts frequently executed bytecode ("hot" methods) into optimized native machine code at runtime. HotSpot uses a tiered compilation model with C1 (client compiler, fast compile) and C2 (server compiler, aggressive optimization). Key C2 optimizations include: method inlining (eliminates virtual dispatch overhead), escape analysis (stack allocation of non-escaping objects), loop unrolling and vectorization, dead code elimination, and null-check elimination. The JIT also performs speculative optimizations with deoptimization fallback.',
    keyPoints: [
      'Tiered compilation: Tier 0 (interpreter) → Tier 1–3 (C1) → Tier 4 (C2)',
      'Method inlining is the most impactful JIT optimization',
      'Escape analysis enables scalar replacement and stack allocation',
      'Deoptimization reverts to interpreter when assumptions break',
      '-XX:+PrintCompilation shows JIT activity',
      'JMH (Java Microbenchmark Harness) is the correct way to measure JIT effects',
    ],
    difficulty: 'Advanced',
    category: 'JIT',
    followUps: [
      'What is on-stack replacement (OSR)?',
      'How does JIT interact with virtual dispatch (megamorphic call sites)?',
    ],
  },
  {
    id: 'q8',
    question: 'What is the difference between synchronized and volatile in Java?',
    answer:
      'volatile guarantees that reads and writes to a variable are atomic (for 64-bit types on 64-bit VMs) and visible to all threads immediately — no thread-local caching. However, volatile does not provide mutual exclusion, so compound actions (check-then-act, read-modify-write) are still not thread-safe. synchronized provides both mutual exclusion (only one thread in the block at a time) and the full happens-before guarantee for all variables written before the lock release. Use volatile for simple flags; use synchronized (or java.util.concurrent classes) for compound operations.',
    keyPoints: [
      'volatile: visibility + atomicity for single reads/writes only',
      'synchronized: mutual exclusion + full memory visibility (happens-before)',
      'volatile does NOT prevent race conditions on i++ (read-modify-write)',
      'AtomicInteger/AtomicReference use CAS for lock-free thread-safety',
      'synchronized has been heavily optimized: biased locking, lock elision, lock coarsening',
    ],
    difficulty: 'Intermediate',
    category: 'Threads',
    codeExample: `// volatile: safe flag, but NOT safe counter
volatile boolean stop = false; // OK for simple flag
volatile int counter = 0;
counter++; // NOT atomic! Race condition!

// synchronized: safe compound operation
synchronized (this) {
    counter++; // read + increment + write atomically
}

// Better: use AtomicInteger
AtomicInteger counter = new AtomicInteger(0);
counter.incrementAndGet(); // lock-free, thread-safe`,
  },
  {
    id: 'q9',
    question: 'Describe the phases of the G1 Garbage Collector.',
    answer:
      'G1 GC operates in several phases: (1) Young-only Phase — Minor GCs collect Eden/Survivor regions concurrently to an adjustable pause target. (2) Concurrent Marking Cycle — triggered when Old Gen occupancy exceeds InitiatingHeapOccupancyPercent; consists of Initial Mark (STW, piggybacks on Minor GC), Root Region Scanning, Concurrent Mark, Remark (STW), and Cleanup (partially STW). (3) Mixed GC Phase — collects Young regions plus selected Old regions with most garbage. (4) Optional: Full GC as a last resort (single-threaded in JDK 10+, parallel in JDK 10+).',
    keyPoints: [
      'Heap is split into ~2048 equal regions; no fixed generational boundaries',
      'Concurrent marking identifies live objects without STW',
      'Mixed GC collects Old regions chosen by highest garbage-to-live ratio',
      'Key flags: -XX:MaxGCPauseMillis, -XX:InitiatingHeapOccupancyPercent',
      'Humongous allocations (>50% region size) can cause premature GC cycles',
    ],
    difficulty: 'Advanced',
    category: 'Garbage Collection',
    followUps: [
      'What is the difference between G1 and ZGC?',
      'How would you tune G1 for a latency-sensitive application?',
    ],
  },
  {
    id: 'q10',
    question: 'What is Metaspace and how does it differ from PermGen?',
    answer:
      'PermGen (Permanent Generation) was a fixed-size heap region in Java 7 and earlier that stored class metadata, interned Strings, and static variables. It was notoriously prone to java.lang.OutOfMemoryError: PermGen space in applications with many classes or frameworks using runtime code generation. In Java 8, PermGen was replaced by Metaspace, which resides in native memory (outside the JVM heap). Metaspace grows dynamically by default, only bounded by available system memory (or -XX:MaxMetaspaceSize). Interned Strings moved to the main heap.',
    keyPoints: [
      'PermGen: fixed-size heap region, removed in Java 8',
      'Metaspace: native memory, auto-resizing, no fixed upper bound by default',
      'Class metadata, method bytecode, constant pools stored in Metaspace',
      'Interned Strings moved from PermGen to heap in Java 7+',
      '-XX:MetaspaceSize sets initial size; -XX:MaxMetaspaceSize caps it',
      'ClassLoader leaks (e.g., in web containers) fill Metaspace with unreachable metadata',
    ],
    difficulty: 'Intermediate',
    category: 'Memory',
    followUps: [
      'How does Metaspace GC work?',
      'What causes a Metaspace OutOfMemoryError in a production application?',
    ],
  },
  {
    id: 'q11',
    question: 'What is Thread.State and what are the valid thread state transitions?',
    answer:
      'Java threads have six states defined in Thread.State: NEW (created, not started), RUNNABLE (executing or ready to execute), BLOCKED (waiting to acquire a monitor lock for synchronized), WAITING (waiting indefinitely: Object.wait(), Thread.join(), LockSupport.park()), TIMED_WAITING (waiting with a timeout: Thread.sleep(), Object.wait(long), Thread.join(long)), and TERMINATED (execution completed). Key transitions: start() moves NEW → RUNNABLE; entering a synchronized block moves RUNNABLE → BLOCKED if lock is held; Object.wait() moves RUNNABLE → WAITING; notify() moves WAITING → BLOCKED (competing for lock); thread exits → TERMINATED.',
    keyPoints: [
      'BLOCKED is specifically about monitor (synchronized) contention',
      'WAITING and TIMED_WAITING are about explicit waiting (wait/join/park)',
      'RUNNABLE includes both actively running and OS-scheduled-but-waiting threads',
      'Thread dumps (jstack) show states useful for diagnosing deadlocks',
      'Virtual threads (Java 21+) are mounted/unmounted from carrier threads — states differ',
    ],
    difficulty: 'Intermediate',
    category: 'Threads',
    followUps: ['How do you detect a deadlock using thread dumps?', 'What is the difference between wait() and sleep()?'],
  },
  {
    id: 'q12',
    question: 'What is escape analysis and how does it optimize memory allocation?',
    answer:
      'Escape analysis is a JIT compiler optimization where the JVM determines whether an object\'s reference can "escape" its creating method or thread. If an object does not escape (only used locally), the JVM can: (1) allocate it on the stack instead of the heap (stack allocation), avoiding GC pressure; (2) apply scalar replacement, decomposing the object into its individual fields stored as local variables, avoiding object creation entirely; (3) eliminate synchronization on non-escaping objects (lock elision). Escape analysis is enabled by default in HotSpot (-XX:+DoEscapeAnalysis).',
    keyPoints: [
      'An object "escapes" if it is returned, stored in a heap field, or passed to another thread',
      'Stack allocation avoids GC overhead for short-lived objects',
      'Scalar replacement avoids object header overhead entirely',
      'Lock elision removes synchronized from objects only reachable by one thread',
      'Escape analysis requires JIT — not available in interpreter mode',
    ],
    difficulty: 'Advanced',
    category: 'JIT',
    codeExample: `// Object does NOT escape — JIT may eliminate allocation entirely
void compute() {
    Point p = new Point(1, 2); // only used locally
    int result = p.x + p.y;    // JIT: scalar replace p.x, p.y as locals
    return result;
}

// Object ESCAPES — must be heap-allocated
Point getPoint() {
    return new Point(1, 2); // escapes via return value
}`,
  },
  {
    id: 'q13',
    question: 'What is the difference between shallow heap, retained heap, and deep heap?',
    answer:
      'These terms are used in heap analysis tools (Eclipse MAT, JVisualVM). Shallow heap is the memory consumed by the object itself — its header plus field values, not including referenced objects. Retained heap is the total memory that would be freed if the object were garbage collected — the object itself plus all objects exclusively referenced (directly or indirectly) through it. Deep heap (less common term) is sometimes used for the transitive closure of all referenced objects regardless of exclusivity. Retained heap is the most actionable metric for memory optimization.',
    keyPoints: [
      'Shallow heap = object header + fields (typically 16–32 bytes for a simple object)',
      'Retained heap = shallow heap + exclusively retained reference tree',
      'An object in the retained heap of X is freed when X is collected',
      'Dominator tree in heap analysis tools shows retained heap hierarchy',
      'Large retained heap objects are the primary targets for memory leak investigation',
    ],
    difficulty: 'Advanced',
    category: 'Memory',
    followUps: ['How do you take and analyze a heap dump?', 'What is a dominator tree?'],
  },
  {
    id: 'q14',
    question: 'What is class loading verification and why is it necessary?',
    answer:
      'Verification is the second step of the class linking phase. The bytecode verifier performs structural and semantic checks on the loaded .class file before execution. It verifies: the class file format is well-formed (magic number 0xCAFEBABE, correct version), operand stack does not overflow or underflow, local variable types are consistent, method descriptors are valid, and there are no illegal bytecode instructions. Verification is essential for JVM security — it prevents maliciously crafted bytecode from corrupting JVM internals or bypassing type safety. It also catches class files compiled by buggy compilers.',
    keyPoints: [
      'Four verification passes: file format, semantic, bytecode, symbolic reference',
      'Verification can be skipped for trusted code (-Xverify:none) but is a security risk',
      'The bytecode verifier is a critical security boundary for the JVM sandbox',
      'Verification happens once at load time, not at every execution',
      'Stack map frames (introduced in Java 6) speed up bytecode verification',
    ],
    difficulty: 'Advanced',
    category: 'Class Loading',
  },
  {
    id: 'q15',
    question: 'How does the ZGC achieve sub-millisecond pause times?',
    answer:
      'ZGC achieves sub-millisecond pauses through three key mechanisms: (1) Colored pointers — 4 bits in 64-bit pointers encode GC state (marked0, marked1, remapped, finalizable), allowing the GC to use pointer metadata without touching the objects themselves; (2) Load barriers — JIT-inserted code at every pointer read that "heals" stale pointers on the fly, allowing relocation to happen concurrently while the application runs; (3) Concurrent phases — marking, relocation set selection, and actual relocation all run concurrently with the application. Only two brief STW phases remain: initial root scanning (<1 ms) and a second root scan. Pause times are O(number of GC roots), not O(heap size).',
    keyPoints: [
      'Colored pointers: GC metadata lives in pointer bits, not object headers',
      'Load barriers: fix stale references at read time — key to concurrent relocation',
      'Pause time is O(GC roots) not O(live objects) — scales to TB heaps',
      'Multi-mapping: same physical page mapped at multiple virtual addresses for pointer coloring',
      'Generational ZGC (Java 21+) adds young/old generations for ~3–4× throughput improvement',
    ],
    difficulty: 'Advanced',
    category: 'Garbage Collection',
    followUps: ['How does Shenandoah GC differ from ZGC?', 'When would you choose ZGC over G1?'],
  },
  {
    id: 'q16',
    question: 'What is the difference between WeakReference, SoftReference, and PhantomReference?',
    answer:
      'Java provides reference types with different GC behavior. Strong references (normal assignment) prevent GC. SoftReferences are cleared by the GC only when memory is low — ideal for memory-sensitive caches. WeakReferences do not prevent GC and are cleared as soon as the object has no strong/soft references — used in WeakHashMap and canonicalizing maps. PhantomReferences are enqueued after the object is finalized but before its memory is reclaimed — used for post-finalization cleanup (replacing finalizers). All non-strong references can be registered with a ReferenceQueue to receive notifications when collected.',
    keyPoints: [
      'Strong > Soft > Weak > Phantom in terms of GC resistance',
      'SoftReference: cleared when JVM needs memory (heap pressure)',
      'WeakReference: cleared at next GC once no strong references remain',
      'PhantomReference: get() always returns null; used for resource cleanup',
      'ReferenceQueue: allows code to react when a reference is cleared',
      'Avoid finalizers — use Cleaner or PhantomReference instead',
    ],
    difficulty: 'Intermediate',
    category: 'Memory',
    codeExample: `WeakReference<MyCache> weakRef = new WeakReference<>(myCache);
// Later...
MyCache cache = weakRef.get(); // may return null if GC collected it
if (cache == null) {
    // Object was collected, recreate if needed
}`,
  },
  {
    id: 'q17',
    question: 'What is on-stack replacement (OSR) in HotSpot JVM?',
    answer:
      'On-Stack Replacement (OSR) is a JIT technique that replaces an interpreted stack frame with a compiled stack frame while the method is still executing — specifically while it is inside a long-running loop. Without OSR, a method would remain interpreted for its entire current invocation even if it is compiled during that invocation. OSR allows HotSpot to switch from bytecode interpretation to compiled native code mid-execution at a loop back-edge, enabling long-running methods (like top-level benchmark loops) to benefit from JIT compilation without waiting for the next invocation.',
    keyPoints: [
      'OSR fires at loop back-edges when loop iteration count exceeds a threshold',
      'The interpreter and JIT must agree on the layout of local variable state',
      'OSR methods have a special entry point different from normal JIT entry',
      '-XX:+PrintCompilation shows OSR compilations with % marker',
      'Relevant for benchmarking: OSR-compiled code may differ from normal JIT — use JMH',
    ],
    difficulty: 'Advanced',
    category: 'JIT',
  },
  {
    id: 'q18',
    question: 'How do virtual threads (Project Loom) change the JVM threading model?',
    answer:
      'Virtual threads (introduced as preview in Java 19, stable in Java 21) are lightweight threads managed by the JVM rather than the OS. Traditional platform threads are 1:1 with OS threads, requiring ~1 MB of stack space and OS context switches. Virtual threads are M:N mapped onto a small pool of carrier (platform) threads. When a virtual thread blocks on I/O or a blocking API, it is unmounted from the carrier thread, freeing the carrier for another virtual thread. This enables millions of concurrent virtual threads with minimal memory. Virtual threads use the same Thread API and integrate transparently with synchronized and java.util.concurrent.',
    keyPoints: [
      'Virtual thread: lightweight, JVM-managed, ~1 KB initial stack',
      'Carrier thread pool (ForkJoinPool) runs virtual threads',
      'Blocking operations unmount the virtual thread — no carrier thread wasted',
      'Structured concurrency (Java 21+) provides scoped lifetime management',
      'Pinning: synchronized native methods or JNI pin the carrier thread',
      'Use Thread.ofVirtual().start() or Executors.newVirtualThreadPerTaskExecutor()',
    ],
    difficulty: 'Advanced',
    category: 'Threads',
    followUps: ['What is pinning in virtual threads and how to avoid it?', 'How do virtual threads interact with ThreadLocal?'],
    codeExample: `// Create a virtual thread
Thread vt = Thread.ofVirtual().start(() -> {
    // Blocking call unmounts the virtual thread — carrier not blocked
    var result = httpClient.send(request, bodyHandler);
});

// Executor creating virtual threads per task
try (var executor = Executors.newVirtualThreadPerTaskExecutor()) {
    IntStream.range(0, 1_000_000).forEach(i ->
        executor.submit(() -> process(i))
    );
}`,
  },
];
