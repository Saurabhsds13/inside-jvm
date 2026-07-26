import type { InterviewQuestion } from "@/types";

export const interviewQuestions: InterviewQuestion[] = [
  {
    id: "q1",
    question: "What are the main components of the JVM architecture?",
    answer:
      "The JVM consists of three main subsystems: the Class Loader Subsystem (loads, links, and initializes .class files), the Runtime Data Areas (Heap, Method Area/Metaspace, JVM Stack, PC Register, Native Method Stack), and the Execution Engine (Interpreter, JIT Compiler, and Garbage Collector). These work together with the Java Native Interface (JNI) and native method libraries to execute Java programs.",
    keyPoints: [
      "Class Loader Subsystem: Loading → Linking (Verify, Prepare, Resolve) → Initialization",
      "Runtime Data Areas: Heap and Method Area are shared; Stack, PC, Native Stack are per-thread",
      "Execution Engine contains both Interpreter and JIT Compiler",
      "Garbage Collector is part of the Execution Engine",
    ],
    difficulty: "Beginner",
    category: "Architecture",
    followUps: [  
      "What is the difference between the JVM, JRE, and JDK?",
      "How does the JVM achieve platform independence?",
    ],
  },
  {
    id: "q2",
    question:
      "Explain the difference between the Heap and the Stack in the JVM.",
    answer:
      "The Heap is a shared memory region where all object instances and arrays are allocated. It is managed by the Garbage Collector and is accessible from all threads. The Stack (JVM Stack) is per-thread and stores stack frames. Each frame contains local variables, an operand stack, and a reference to the runtime constant pool. The Stack holds primitive local variables and object references, while actual objects always live on the Heap.",
    keyPoints: [
      "Heap: Shared, GC-managed, stores all objects and arrays",
      "Stack: Per-thread, stores frames with locals and operand stacks",
      "Object references on the Stack point to objects in the Heap",
      "StackOverflowError vs OutOfMemoryError",
      "Stack size is typically much smaller (default ~512KB–1MB per thread)",
    ],
    difficulty: "Beginner",
    category: "Memory",
    followUps: [
      "What is escape analysis and how does it affect object allocation?",
      "Can objects be allocated on the Stack?",
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
    id: "q3",
    question: "What is the parent-delegation model in Class Loading?",
    answer:
      "The parent-delegation model means that when a ClassLoader is asked to load a class, it first delegates the request to its parent ClassLoader before attempting to load it itself. The hierarchy is: Bootstrap ClassLoader → Extension/Platform ClassLoader → Application ClassLoader → Custom ClassLoaders. A class is only loaded by the current ClassLoader if no parent can find it. This ensures core Java classes cannot be overridden by application code, providing security and preventing duplicate class definitions.",
    keyPoints: [
      "Delegation goes up the chain before loading locally",
      "Bootstrap ClassLoader is the root; it loads java.*, javax.* from the JDK",
      "Prevents malicious java.lang.String replacements",
      "Classes are unique per (name + ClassLoader) pair",
      "Can be broken via Thread.currentThread().setContextClassLoader()",
    ],
    difficulty: "Intermediate",
    category: "Class Loading",
    followUps: [
      "When would you create a custom ClassLoader?",
      "How does OSGi break the parent-delegation model and why?",
    ],
  },
  {
    id: "q4",
    question: "What is the difference between Minor GC, Major GC, and Full GC?",
    answer:
      "Minor GC collects only the Young Generation (Eden + Survivor spaces). It is triggered when Eden is full and is generally fast. Major GC (sometimes called Old GC) collects the Old Generation and is triggered when it fills up. Full GC collects the entire heap (Young + Old + Metaspace) and is the most expensive. Full GC is typically a Stop-The-World event and should be minimized in production systems.",
    keyPoints: [
      "Minor GC: Young Generation only; fast; triggered by Eden fill",
      "Major GC: Old Generation; slower; triggered by tenuring",
      "Full GC: Entire heap + Metaspace; most expensive STW event",
      "System.gc() requests (not guarantees) a Full GC",
      "G1 and ZGC aim to avoid Full GC entirely",
    ],
    difficulty: "Intermediate",
    category: "Garbage Collection",
    followUps: [
      "What causes objects to be promoted from Young to Old Generation?",
      "How does G1 GC avoid Full GC?",
    ],
  },
  {
    id: "q5",
    question: "What are GC roots? Why are they important?",
    answer:
      "GC roots are the starting points for the garbage collector's reachability traversal. Any object reachable from a GC root (directly or transitively) is considered live and will not be collected. GC roots include: local variables and operand stack entries in all active thread stacks, static fields of loaded classes, JNI global references, and references held by the JVM itself (e.g., class loaders, exception handlers). Any object not reachable from any GC root is eligible for collection.",
    keyPoints: [
      "GC roots are the foundation of reachability-based collection",
      "Types: stack locals, static fields, JNI globals, JVM internals",
      "Mark phase starts from all GC roots simultaneously",
      "Memory leaks occur when GC roots accidentally hold references to unused objects",
      "Tools like JVisualVM and Eclipse MAT help trace GC root paths",
    ],
    difficulty: "Intermediate",
    category: "Garbage Collection",
    followUps: [
      "How does a memory leak occur in Java despite having a GC?",
      "What is the purpose of WeakReference?",
    ],
  },
  {
    id: "q6",
    question:
      "Explain the Java Memory Model (JMM) and the concept of happens-before.",
    answer:
      "The Java Memory Model defines the rules by which reads and writes to shared variables are visible across threads. Without synchronization, each thread may work with a cached (local) copy of a variable. The happens-before relationship is a guarantee: if action A happens-before action B, then all memory writes by A are visible to B. Key happens-before rules: a lock release HB the subsequent acquisition of the same lock; a write to a volatile variable HB any subsequent read of that variable; Thread.start() HB any action in the started thread.",
    keyPoints: [
      "JMM defines visibility, ordering, and atomicity of shared memory accesses",
      "Without synchronization, threads may see stale values (CPU cache coherency)",
      "volatile guarantees visibility but not atomicity for compound actions",
      "synchronized guarantees both mutual exclusion and happens-before",
      "final fields: once constructed, safely visible to all threads without sync",
    ],
    difficulty: "Advanced",
    category: "Java Memory Model",
    followUps: [
      "What is a data race? How do you avoid one?",
      "Why is double-checked locking broken without volatile?",
    ],
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
    id: "q7",
    question:
      "What is JIT compilation and what optimizations does the HotSpot JIT perform?",
    answer:
      'JIT (Just-In-Time) compilation converts frequently executed bytecode ("hot" methods) into optimized native machine code at runtime. HotSpot uses a tiered compilation model with C1 (client compiler, fast compile) and C2 (server compiler, aggressive optimization). Key C2 optimizations include: method inlining (eliminates virtual dispatch overhead), escape analysis (stack allocation of non-escaping objects), loop unrolling and vectorization, dead code elimination, and null-check elimination. The JIT also performs speculative optimizations with deoptimization fallback.',
    keyPoints: [
      "Tiered compilation: Tier 0 (interpreter) → Tier 1–3 (C1) → Tier 4 (C2)",
      "Method inlining is the most impactful JIT optimization",
      "Escape analysis enables scalar replacement and stack allocation",
      "Deoptimization reverts to interpreter when assumptions break",
      "-XX:+PrintCompilation shows JIT activity",
      "JMH (Java Microbenchmark Harness) is the correct way to measure JIT effects",
    ],
    difficulty: "Advanced",
    category: "JIT",
    followUps: [
      "What is on-stack replacement (OSR)?",
      "How does JIT interact with virtual dispatch (megamorphic call sites)?",
    ],
  },
  {
    id: "q8",
    question:
      "What is the difference between synchronized and volatile in Java?",
    answer:
      "volatile guarantees that reads and writes to a variable are atomic (for 64-bit types on 64-bit VMs) and visible to all threads immediately — no thread-local caching. However, volatile does not provide mutual exclusion, so compound actions (check-then-act, read-modify-write) are still not thread-safe. synchronized provides both mutual exclusion (only one thread in the block at a time) and the full happens-before guarantee for all variables written before the lock release. Use volatile for simple flags; use synchronized (or java.util.concurrent classes) for compound operations.",
    keyPoints: [
      "volatile: visibility + atomicity for single reads/writes only",
      "synchronized: mutual exclusion + full memory visibility (happens-before)",
      "volatile does NOT prevent race conditions on i++ (read-modify-write)",
      "AtomicInteger/AtomicReference use CAS for lock-free thread-safety",
      "synchronized has been heavily optimized: biased locking, lock elision, lock coarsening",
    ],
    difficulty: "Intermediate",
    category: "Threads",
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
    id: "q9",
    question: "Describe the phases of the G1 Garbage Collector.",
    answer:
      "G1 GC operates in several phases: (1) Young-only Phase — Minor GCs collect Eden/Survivor regions concurrently to an adjustable pause target. (2) Concurrent Marking Cycle — triggered when Old Gen occupancy exceeds InitiatingHeapOccupancyPercent; consists of Initial Mark (STW, piggybacks on Minor GC), Root Region Scanning, Concurrent Mark, Remark (STW), and Cleanup (partially STW). (3) Mixed GC Phase — collects Young regions plus selected Old regions with most garbage. (4) Optional: Full GC as a last resort (single-threaded in JDK 10+, parallel in JDK 10+).",
    keyPoints: [
      "Heap is split into ~2048 equal regions; no fixed generational boundaries",
      "Concurrent marking identifies live objects without STW",
      "Mixed GC collects Old regions chosen by highest garbage-to-live ratio",
      "Key flags: -XX:MaxGCPauseMillis, -XX:InitiatingHeapOccupancyPercent",
      "Humongous allocations (>50% region size) can cause premature GC cycles",
    ],
    difficulty: "Advanced",
    category: "Garbage Collection",
    followUps: [
      "What is the difference between G1 and ZGC?",
      "How would you tune G1 for a latency-sensitive application?",
    ],
  },
  {
    id: "q10",
    question: "What is Metaspace and how does it differ from PermGen?",
    answer:
      "PermGen (Permanent Generation) was a fixed-size heap region in Java 7 and earlier that stored class metadata, interned Strings, and static variables. It was notoriously prone to java.lang.OutOfMemoryError: PermGen space in applications with many classes or frameworks using runtime code generation. In Java 8, PermGen was replaced by Metaspace, which resides in native memory (outside the JVM heap). Metaspace grows dynamically by default, only bounded by available system memory (or -XX:MaxMetaspaceSize). Interned Strings moved to the main heap.",
    keyPoints: [
      "PermGen: fixed-size heap region, removed in Java 8",
      "Metaspace: native memory, auto-resizing, no fixed upper bound by default",
      "Class metadata, method bytecode, constant pools stored in Metaspace",
      "Interned Strings moved from PermGen to heap in Java 7+",
      "-XX:MetaspaceSize sets initial size; -XX:MaxMetaspaceSize caps it",
      "ClassLoader leaks (e.g., in web containers) fill Metaspace with unreachable metadata",
    ],
    difficulty: "Intermediate",
    category: "Memory",
    followUps: [
      "How does Metaspace GC work?",
      "What causes a Metaspace OutOfMemoryError in a production application?",
    ],
  },
  {
    id: "q11",
    question:
      "What is Thread.State and what are the valid thread state transitions?",
    answer:
      "Java threads have six states defined in Thread.State: NEW (created, not started), RUNNABLE (executing or ready to execute), BLOCKED (waiting to acquire a monitor lock for synchronized), WAITING (waiting indefinitely: Object.wait(), Thread.join(), LockSupport.park()), TIMED_WAITING (waiting with a timeout: Thread.sleep(), Object.wait(long), Thread.join(long)), and TERMINATED (execution completed). Key transitions: start() moves NEW → RUNNABLE; entering a synchronized block moves RUNNABLE → BLOCKED if lock is held; Object.wait() moves RUNNABLE → WAITING; notify() moves WAITING → BLOCKED (competing for lock); thread exits → TERMINATED.",
    keyPoints: [
      "BLOCKED is specifically about monitor (synchronized) contention",
      "WAITING and TIMED_WAITING are about explicit waiting (wait/join/park)",
      "RUNNABLE includes both actively running and OS-scheduled-but-waiting threads",
      "Thread dumps (jstack) show states useful for diagnosing deadlocks",
      "Virtual threads (Java 21+) are mounted/unmounted from carrier threads — states differ",
    ],
    difficulty: "Intermediate",
    category: "Threads",
    followUps: [
      "How do you detect a deadlock using thread dumps?",
      "What is the difference between wait() and sleep()?",
    ],
  },
  {
    id: "q12",
    question:
      "What is escape analysis and how does it optimize memory allocation?",
    answer:
      'Escape analysis is a JIT compiler optimization where the JVM determines whether an object\'s reference can "escape" its creating method or thread. If an object does not escape (only used locally), the JVM can: (1) allocate it on the stack instead of the heap (stack allocation), avoiding GC pressure; (2) apply scalar replacement, decomposing the object into its individual fields stored as local variables, avoiding object creation entirely; (3) eliminate synchronization on non-escaping objects (lock elision). Escape analysis is enabled by default in HotSpot (-XX:+DoEscapeAnalysis).',
    keyPoints: [
      'An object "escapes" if it is returned, stored in a heap field, or passed to another thread',
      "Stack allocation avoids GC overhead for short-lived objects",
      "Scalar replacement avoids object header overhead entirely",
      "Lock elision removes synchronized from objects only reachable by one thread",
      "Escape analysis requires JIT — not available in interpreter mode",
    ],
    difficulty: "Advanced",
    category: "JIT",
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
    id: "q13",
    question:
      "What is the difference between shallow heap, retained heap, and deep heap?",
    answer:
      "These terms are used in heap analysis tools (Eclipse MAT, JVisualVM). Shallow heap is the memory consumed by the object itself — its header plus field values, not including referenced objects. Retained heap is the total memory that would be freed if the object were garbage collected — the object itself plus all objects exclusively referenced (directly or indirectly) through it. Deep heap (less common term) is sometimes used for the transitive closure of all referenced objects regardless of exclusivity. Retained heap is the most actionable metric for memory optimization.",
    keyPoints: [
      "Shallow heap = object header + fields (typically 16–32 bytes for a simple object)",
      "Retained heap = shallow heap + exclusively retained reference tree",
      "An object in the retained heap of X is freed when X is collected",
      "Dominator tree in heap analysis tools shows retained heap hierarchy",
      "Large retained heap objects are the primary targets for memory leak investigation",
    ],
    difficulty: "Advanced",
    category: "Memory",
    followUps: [
      "How do you take and analyze a heap dump?",
      "What is a dominator tree?",
    ],
  },
  {
    id: "q14",
    question: "What is class loading verification and why is it necessary?",
    answer:
      "Verification is the second step of the class linking phase. The bytecode verifier performs structural and semantic checks on the loaded .class file before execution. It verifies: the class file format is well-formed (magic number 0xCAFEBABE, correct version), operand stack does not overflow or underflow, local variable types are consistent, method descriptors are valid, and there are no illegal bytecode instructions. Verification is essential for JVM security — it prevents maliciously crafted bytecode from corrupting JVM internals or bypassing type safety. It also catches class files compiled by buggy compilers.",
    keyPoints: [
      "Four verification passes: file format, semantic, bytecode, symbolic reference",
      "Verification can be skipped for trusted code (-Xverify:none) but is a security risk",
      "The bytecode verifier is a critical security boundary for the JVM sandbox",
      "Verification happens once at load time, not at every execution",
      "Stack map frames (introduced in Java 6) speed up bytecode verification",
    ],
    difficulty: "Advanced",
    category: "Class Loading",
  },
  {
    id: "q15",
    question: "How does the ZGC achieve sub-millisecond pause times?",
    answer:
      'ZGC achieves sub-millisecond pauses through three key mechanisms: (1) Colored pointers — 4 bits in 64-bit pointers encode GC state (marked0, marked1, remapped, finalizable), allowing the GC to use pointer metadata without touching the objects themselves; (2) Load barriers — JIT-inserted code at every pointer read that "heals" stale pointers on the fly, allowing relocation to happen concurrently while the application runs; (3) Concurrent phases — marking, relocation set selection, and actual relocation all run concurrently with the application. Only two brief STW phases remain: initial root scanning (<1 ms) and a second root scan. Pause times are O(number of GC roots), not O(heap size).',
    keyPoints: [
      "Colored pointers: GC metadata lives in pointer bits, not object headers",
      "Load barriers: fix stale references at read time — key to concurrent relocation",
      "Pause time is O(GC roots) not O(live objects) — scales to TB heaps",
      "Multi-mapping: same physical page mapped at multiple virtual addresses for pointer coloring",
      "Generational ZGC (Java 21+) adds young/old generations for ~3–4× throughput improvement",
    ],
    difficulty: "Advanced",
    category: "Garbage Collection",
    followUps: [
      "How does Shenandoah GC differ from ZGC?",
      "When would you choose ZGC over G1?",
    ],
  },
  {
    id: "q16",
    question:
      "What is the difference between WeakReference, SoftReference, and PhantomReference?",
    answer:
      "Java provides reference types with different GC behavior. Strong references (normal assignment) prevent GC. SoftReferences are cleared by the GC only when memory is low — ideal for memory-sensitive caches. WeakReferences do not prevent GC and are cleared as soon as the object has no strong/soft references — used in WeakHashMap and canonicalizing maps. PhantomReferences are enqueued after the object is finalized but before its memory is reclaimed — used for post-finalization cleanup (replacing finalizers). All non-strong references can be registered with a ReferenceQueue to receive notifications when collected.",
    keyPoints: [
      "Strong > Soft > Weak > Phantom in terms of GC resistance",
      "SoftReference: cleared when JVM needs memory (heap pressure)",
      "WeakReference: cleared at next GC once no strong references remain",
      "PhantomReference: get() always returns null; used for resource cleanup",
      "ReferenceQueue: allows code to react when a reference is cleared",
      "Avoid finalizers — use Cleaner or PhantomReference instead",
    ],
    difficulty: "Intermediate",
    category: "Memory",
    codeExample: `WeakReference<MyCache> weakRef = new WeakReference<>(myCache);
// Later...
MyCache cache = weakRef.get(); // may return null if GC collected it
if (cache == null) {
    // Object was collected, recreate if needed
}`,
  },
  {
    id: "q17",
    question: "What is on-stack replacement (OSR) in HotSpot JVM?",
    answer:
      "On-Stack Replacement (OSR) is a JIT technique that replaces an interpreted stack frame with a compiled stack frame while the method is still executing — specifically while it is inside a long-running loop. Without OSR, a method would remain interpreted for its entire current invocation even if it is compiled during that invocation. OSR allows HotSpot to switch from bytecode interpretation to compiled native code mid-execution at a loop back-edge, enabling long-running methods (like top-level benchmark loops) to benefit from JIT compilation without waiting for the next invocation.",
    keyPoints: [
      "OSR fires at loop back-edges when loop iteration count exceeds a threshold",
      "The interpreter and JIT must agree on the layout of local variable state",
      "OSR methods have a special entry point different from normal JIT entry",
      "-XX:+PrintCompilation shows OSR compilations with % marker",
      "Relevant for benchmarking: OSR-compiled code may differ from normal JIT — use JMH",
    ],
    difficulty: "Advanced",
    category: "JIT",
  },
  {
    id: "q18",
    question:
      "How do virtual threads (Project Loom) change the JVM threading model?",
    answer:
      "Virtual threads (introduced as preview in Java 19, stable in Java 21) are lightweight threads managed by the JVM rather than the OS. Traditional platform threads are 1:1 with OS threads, requiring ~1 MB of stack space and OS context switches. Virtual threads are M:N mapped onto a small pool of carrier (platform) threads. When a virtual thread blocks on I/O or a blocking API, it is unmounted from the carrier thread, freeing the carrier for another virtual thread. This enables millions of concurrent virtual threads with minimal memory. Virtual threads use the same Thread API and integrate transparently with synchronized and java.util.concurrent.",
    keyPoints: [
      "Virtual thread: lightweight, JVM-managed, ~1 KB initial stack",
      "Carrier thread pool (ForkJoinPool) runs virtual threads",
      "Blocking operations unmount the virtual thread — no carrier thread wasted",
      "Structured concurrency (Java 21+) provides scoped lifetime management",
      "Pinning: synchronized native methods or JNI pin the carrier thread",
      "Use Thread.ofVirtual().start() or Executors.newVirtualThreadPerTaskExecutor()",
    ],
    difficulty: "Advanced",
    category: "Threads",
    followUps: [
      "What is pinning in virtual threads and how to avoid it?",
      "How do virtual threads interact with ThreadLocal?",
    ],
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
  
  // ─── q19–q30: JVM Internals & Startup ────────────────────────────────────────

  {
    id: "q19",
    question:
      "What happens between typing `java MyApp` and `main()` executing?",
    answer:
      "The JVM startup sequence: (1) OS creates a process, loads the JVM shared library. (2) JVM initializes subsystems: memory management, thread system, signal handlers. (3) Bootstrap ClassLoader loads java.base module classes. (4) Application ClassLoader locates and loads MyApp.class. (5) Class linking: verification, preparation (static fields zeroed), resolution. (6) Static initialization: <clinit> methods run in dependency order. (7) JVM creates the main thread, sets up its stack. (8) main(String[] args) is invoked. Throughout, the JIT starts profiling and tiered compilation begins warming up.",
    keyPoints: [
      "JVM library loaded before any Java code runs",
      "Bootstrap ClassLoader is C++ code, not a Java class",
      "Static initializers run in class dependency order — order matters",
      "JIT starts at Tier 0 (interpreter) — first calls are always interpreted",
      "-verbose:class shows class loading order during startup",
      "GraalVM Native Image eliminates most of this startup by AOT compilation",
    ],
    difficulty: "Advanced",
    category: "Architecture",
    followUps: [
      "What is the difference between cold start and warm JVM?",
      "How does CDS (Class Data Sharing) improve startup?",
    ],
  },
  {
    id: "q20",
    question: "What is a safepoint in the JVM and when does it occur?",
    answer:
      'A safepoint is a point in execution where all JVM threads are paused and the JVM has a consistent view of the heap — all object references are known and the GC can safely inspect them. Safepoints occur at: method returns, loop back-edges (counted), JNI calls, and explicit safepoint polls inserted by the JIT. When the JVM needs a safepoint (for GC, deoptimization, thread dump, etc.), it sets a flag and all threads stop at their next safepoint poll. "Stop-The-World" pauses are safepoints. Long loops without back-edges can delay safepoints — this is "time-to-safepoint" (TTSP) latency.',
    keyPoints: [
      "All threads must reach a safepoint before GC can begin",
      "JIT inserts safepoint polls at method returns and loop back-edges",
      'A thread doing JNI is considered "safe" — GC can run without waiting for it',
      "Long counted loops can block safepoints: use -XX:+UseCountedLoopSafepoints",
      "-XX:+PrintGCApplicationStoppedTime shows TTSP + GC pause separately",
      "Safepoints are also used for: deoptimization, heap dumps, thread dumps, biased lock revocation",
    ],
    difficulty: "Advanced",
    category: "JVM Internals",
    followUps: [
      "What is time-to-safepoint (TTSP) and how do you diagnose it?",
      "How do virtual threads affect safepoints?",
    ],
  },
  {
    id: "q21",
    question: "What is a TLAB (Thread-Local Allocation Buffer)?",
    answer:
      "A TLAB is a private chunk of Eden space allocated to each thread for fast object allocation. When a thread creates an object, it bumps a pointer within its TLAB without any synchronization — no locking, no CAS. When the TLAB is exhausted, the thread requests a new one from Eden (requiring a lock/CAS on the shared Eden pointer). This makes allocation effectively free for typical workloads. If an object is too large for the TLAB, it goes directly to Eden or Old Gen (humongous allocation in G1).",
    keyPoints: [
      "TLAB allocation = single pointer bump — O(1), no synchronization",
      "Default TLAB size is dynamic, tunable with -XX:TLABSize",
      "Objects larger than -XX:TLABWasteTargetPercent of TLAB go outside TLAB",
      "Humongous objects (>50% G1 region) bypass TLAB and Young Gen entirely",
      "-XX:+PrintTLAB shows TLAB statistics per thread",
      "Thread-intensive apps benefit greatly from TLAB — reduces GC pressure",
    ],
    difficulty: "Advanced",
    category: "Memory",
    followUps: [
      "How does TLAB interact with escape analysis?",
      "What happens when TLAB is full?",
    ],
  },
  {
    id: "q22",
    question: "What is a card table and remembered set in G1 GC?",
    answer:
      'A card table divides the heap into fixed-size cards (typically 512 bytes). When a reference field is written (a store barrier fires), the card containing that field is marked "dirty". During GC, dirty cards are scanned for cross-region references. A remembered set (RSet) is per-region in G1 and tracks which other regions hold references into it. This allows G1 to collect a region without scanning the entire heap — only the regions in the RSet need to be checked. RSets are the main memory overhead of G1 (~10–20%).',
    keyPoints: [
      "Card table: coarse-grained dirty tracking — 1 bit (or byte) per 512 bytes of heap",
      "Store barrier: JIT-inserted code that marks cards dirty on reference writes",
      "Remembered set: per-region map of incoming cross-region references",
      "RSet enables G1 to collect individual regions (not the whole heap)",
      "RSet memory overhead is why G1 uses more memory than Serial/Parallel",
      "-XX:G1HeapRegionSize controls region size (1–32 MB, power of 2)",
    ],
    difficulty: "Advanced",
    category: "Garbage Collection",
    followUps: [
      "How does a write barrier work?",
      "Why do humongous objects bypass the RSet?",
    ],
  },
  {
    id: "q23",
    question: "What is string interning and how does the String Pool work?",
    answer:
      "String interning ensures that all identical string literals and explicitly interned strings share the same object reference. The JVM maintains a String Pool (String Table) — a hash table in the heap (since Java 7; was in PermGen before). String literals in bytecode are automatically interned at class load time. String.intern() can manually intern strings. Interned strings are GC roots — they stay alive as long as the class that uses them is loaded. Excessive interning can cause memory pressure and long GC pause times when the table is large.",
    keyPoints: [
      "String Pool moved from PermGen to heap in Java 7",
      'String literals ("hello") are automatically interned',
      "String.intern() returns the canonical instance from the pool",
      "s1 == s2 is true only if both are the same interned object",
      "Default pool size is 60013 buckets; -XX:StringTableSize adjusts it",
      "String deduplication in G1 (-XX:+UseStringDeduplication) reduces heap, not Pool",
    ],
    difficulty: "Intermediate",
    category: "Memory",
    codeExample: `String a = "hello";          // from String Pool
String b = "hello";          // same object as a
String c = new String("hello"); // new heap object
String d = c.intern();       // returns Pool object

System.out.println(a == b);  // true
System.out.println(a == c);  // false
System.out.println(a == d);  // true`,
    followUps: [
      "What is String deduplication and how does it differ from interning?",
    ],
  },
  {
    id: "q24",
    question: "What is the Java object header and how large is it?",
    answer:
      "Every Java object has a header prepended to its fields. On a 64-bit JVM with compressed oops (default): the header is 12 bytes — an 8-byte mark word + a 4-byte class pointer. With uncompressed oops (-XX:-UseCompressedOops) the header is 16 bytes. The mark word encodes: identity hashcode (lazily computed), GC age bits (4 bits for generational), lock state (biased/thin/fat lock bits), and GC marking bits. Arrays have an additional 4-byte length field making their header 16 bytes (compressed) or 20 bytes (uncompressed, padded to 24).",
    keyPoints: [
      "Mark word (8 bytes): hashcode, GC age, lock state, GC mark",
      "Class pointer (4 bytes compressed, 8 bytes uncompressed): points to Klass in Metaspace",
      "Compressed oops enabled by default for heaps up to ~32 GB",
      "All objects are 8-byte aligned — minimum object size is 16 bytes",
      "Arrays add 4-byte length field to the header",
      "Object identity hashcode is computed lazily and cached in the mark word",
    ],
    difficulty: "Advanced",
    category: "JVM Internals",
    followUps: [
      "How does biased locking use the mark word?",
      "What is compressed oops and when does it turn off?",
    ],
  },
  {
    id: "q25",
    question:
      "What are the different types of OutOfMemoryError and their causes?",
    answer:
      "The JVM throws different OOM subtypes depending on which memory region is exhausted: (1) Java heap space — heap full, GC cannot free enough. (2) GC overhead limit exceeded — GC is spending >98% of time recovering <2% of heap. (3) Metaspace — class metadata space exhausted (ClassLoader leaks). (4) Unable to create new native thread — OS has no thread resources. (5) Direct buffer memory — NIO direct buffers exhausted. (6) request size bytes for reason. Out of swap space? — native heap exhausted. Each requires a different diagnosis and fix.",
    keyPoints: [
      "Java heap space: increase -Xmx or fix memory leaks",
      "GC overhead limit: app is almost always GCing — fix leaks, not just -Xmx",
      "Metaspace: ClassLoader leak — frameworks creating ClassLoaders without unloading",
      "Unable to create native thread: reduce thread count or increase OS limits (ulimit)",
      "Direct buffer: increase -XX:MaxDirectMemorySize or fix NIO buffer leaks",
      "Heap dump (-XX:+HeapDumpOnOutOfMemoryError) is essential for diagnosis",
    ],
    difficulty: "Intermediate",
    category: "Memory",
    followUps: [
      "How do you diagnose a memory leak in a Java application?",
      "What is -XX:+HeapDumpOnOutOfMemoryError?",
    ],
  },
  {
    id: "q26",
    question: "How does synchronized work internally? What is lock inflation?",
    answer:
      "Synchronized uses object monitor locks. Lock implementation progresses through states: (1) Unlocked — mark word holds hashcode. (2) Biased locked — mark word records owning thread; re-entry is free, no CAS needed. Best for single-threaded objects. (3) Thin (stack) locked — lightweight CAS-based lock using a displaced mark word on the stack. Low contention. (4) Fat (inflated) locked — full OS mutex/monitor. Created when contention is detected. Biased locking is disabled by default since Java 15 (-XX:-UseBiasedLocking) due to overhead of revoking biases at safepoints.",
    keyPoints: [
      "Lock state encoded in the mark word — no separate lock object",
      "Biased locking: zero-cost re-entry for single owner thread",
      "Thin lock: CAS on mark word — cheap for uncontended access",
      "Fat lock: ObjectMonitor with wait/notify queue — for contended access",
      "Lock inflation: thin → fat on contention; cannot deflate back easily",
      'Java 21 introduces "lightweight locking" as replacement for biased locking',
    ],
    difficulty: "Advanced",
    category: "JVM Internals",
    followUps: [
      "What is lock coarsening and lock elision?",
      "How does ReentrantLock differ from synchronized?",
    ],
  },
  {
    id: "q27",
    question: "What is class unloading and when does it happen?",
    answer:
      "Class unloading removes a loaded class from the JVM when it is no longer needed. For a class to be unloaded, three conditions must all hold: (1) all instances of the class have been GC'd, (2) the Class object itself has no strong references, (3) the ClassLoader that loaded it has been GC'd. Bootstrap-loaded classes (java.lang.String etc.) are never unloaded. In practice, class unloading primarily affects custom ClassLoaders in application servers (hot-deploy scenarios). It happens during a Full GC or Metaspace GC. Failure to unload leads to Metaspace leaks.",
    keyPoints: [
      "Three conditions: all instances GCd + Class object GCd + ClassLoader GCd",
      "Bootstrap and system classes are never unloaded",
      "Class unloading happens during Full GC or Metaspace collection",
      "-XX:+TraceClassUnloading logs unloaded classes",
      "Web app hot-redeploy must null out all static references to allow unloading",
      "OSGi and plugin systems rely heavily on ClassLoader GC for isolation",
    ],
    difficulty: "Advanced",
    category: "Class Loading",
    followUps: [
      "How does a Metaspace leak occur in a web container?",
      "What is the difference between ClassLoader.loadClass() and Class.forName()?",
    ],
  },
  {
    id: "q28",
    question: "What is Compressed Ordinary Object Pointers (Compressed OOPs)?",
    answer:
      "On a 64-bit JVM, object references are normally 8 bytes. Compressed OOPs (-XX:+UseCompressedOops, enabled by default) encodes heap references as 32-bit values by exploiting 8-byte object alignment: the actual address = compressed_oop << 3 + heap_base. This works for heaps up to 32 GB (2^32 * 8 = 32 GB). Above 32 GB, compressed oops are automatically disabled and all references become 8 bytes, which significantly increases heap memory usage and reduces cache efficiency. This is a common gotcha: a heap of 31 GB uses compressed oops but 33 GB does not — the 33 GB heap may actually perform worse.",
    keyPoints: [
      "Default on for heaps ≤ 32 GB — saves 30–50% memory on reference-heavy workloads",
      "Decoded address = (compressed_oop << 3) + heap_base",
      "Above 32 GB compressed oops disabled — consider two smaller JVMs instead",
      "-XX:+UseCompressedClassPointers compresses Klass pointers independently",
      "JOL (Java Object Layout) tool shows actual object sizes with/without compressed oops",
      "Crossing the 32 GB threshold is a common production performance regression",
    ],
    difficulty: "Advanced",
    category: "JVM Internals",
  },
  {
    id: "q29",
    question: "What is the difference between System.gc() and Runtime.gc()?",
    answer:
      "Both are equivalent — Runtime.gc() calls System.gc() internally. They request (but do not guarantee) a Full GC. The JVM may ignore the request entirely if -XX:+DisableExplicitGC is set (common in JVM-managed environments). Even if honored, the GC may run asynchronously. System.gc() is frequently misused in production code and almost never needed. Legitimate uses include: before taking a heap dump (to reduce noise), in memory-sensitive benchmarks, and in NIO direct buffer cleanup when DirectByteBuffer finalizers need to run.",
    keyPoints: [
      "System.gc() == Runtime.getRuntime().gc() — identical behavior",
      "Both are a request, not a command — JVM can ignore them",
      "-XX:+DisableExplicitGC makes them complete no-ops (common in containers)",
      "-XX:+ExplicitGCInvokesConcurrent makes G1/ZGC run concurrent GC instead of Full GC",
      "Never call System.gc() in library code — let application owners control GC",
      "Direct buffer memory can force GC via Reference.reachabilityFence() patterns",
    ],
    difficulty: "Intermediate",
    category: "Garbage Collection",
  },
  {
    id: "q30",
    question: "What is sun.misc.Unsafe and why is it dangerous?",
    answer:
      "sun.misc.Unsafe is an internal JDK class providing low-level operations not available in standard Java: direct memory allocation/deallocation (allocateMemory/freeMemory), atomic CAS operations, unaligned memory access, park/unpark for thread synchronization, object field offset access, and class definition. It is used internally by java.util.concurrent, off-heap caches (Ignite, Cassandra), and serialization frameworks. It is dangerous because: memory allocated via Unsafe is off-heap and not GC-managed (leaks if not freed), incorrect offsets corrupt the JVM, and operations bypass all Java safety checks. Java 9+ replaced most uses with VarHandles; Java 22+ Foreign Memory API replaces off-heap usage.",
    keyPoints: [
      'Obtained via reflection: Unsafe.class.getDeclaredField("theUnsafe")',
      "allocateMemory/freeMemory: manual off-heap memory — GC does not manage it",
      "compareAndSwapInt/Long: basis of all java.util.concurrent CAS operations",
      "objectFieldOffset: used by AtomicFieldUpdater and serialization frameworks",
      "Java 9+ VarHandles replace Unsafe for atomic access with proper type safety",
      "Java 22+ Foreign Function & Memory API (FFM) replaces off-heap Unsafe usage",
    ],
    difficulty: "Advanced",
    category: "JVM Internals",
    codeExample: `// Getting Unsafe (reflection — works pre-Java 17)
Field f = Unsafe.class.getDeclaredField("theUnsafe");
f.setAccessible(true);
Unsafe unsafe = (Unsafe) f.get(null);

// Off-heap allocation (manual memory management!)
long addr = unsafe.allocateMemory(1024);
unsafe.putLong(addr, 42L);
long val = unsafe.getLong(addr);
unsafe.freeMemory(addr); // must free manually — no GC!`,
  },

  // ─── q31–q42: Profiling, Virtual Threads, Performance ─────────────────────────

  {
    id: "q31",
    question: "What is JFR (Java Flight Recorder) and how do you use it?",
    answer:
      "Java Flight Recorder is a low-overhead (< 1% overhead) production profiling tool built into the JDK since Java 11 (open-sourced). It continuously records JVM and application events into a circular buffer and can dump to a .jfr file on demand. Events include: GC pauses, safepoints, thread sleep/park, I/O, JIT compilation, memory allocation rates, exceptions, and custom application events. Recordings are analyzed with JDK Mission Control (JMC). JFR is safe for always-on production use — unlike sampling profilers, it instruments the JVM directly.",
    keyPoints: [
      "Start: -XX:+FlightRecorder -XX:StartFlightRecording=duration=60s,filename=app.jfr",
      "Or dynamically: jcmd <pid> JFR.start name=recording duration=60s filename=app.jfr",
      "JMC (JDK Mission Control) provides GUI analysis of .jfr files",
      "Allocation profiling: shows which code paths allocate most",
      "Custom events: extend jdk.jfr.Event for application-level recording",
      "Better than sampling profilers: catches short-lived hot methods accurately",
    ],
    difficulty: "Advanced",
    category: "Profiling",
    followUps: [
      "How does JFR differ from async-profiler?",
      "What is the overhead of JFR in production?",
    ],
    codeExample: `// Start recording programmatically (Java 14+)
Recording r = new Recording();
r.enable("jdk.GarbageCollection").withThreshold(Duration.ofMillis(10));
r.enable("jdk.CPULoad").withPeriod(Duration.ofSeconds(1));
r.start();
// ... run workload ...
r.dump(Path.of("recording.jfr"));
r.stop();`,
  },
  {
    id: "q32",
    question: "What is async-profiler and how is it different from JFR?",
    answer:
      'async-profiler is an open-source low-overhead sampling profiler that uses AsyncGetCallTrace API (and perf_events on Linux) to sample threads without requiring safepoints. Traditional JVMTI-based profilers can only sample at safepoints, causing "safepoint bias" — they miss hot code in safepoint polls. async-profiler captures true wall-clock and CPU profiles. It also profiles native (non-Java) frames, making it ideal for diagnosing I/O, GC, and kernel time. Output: flame graphs (SVG), JFR format, collapsed stacks for FlameGraph.pl.',
    keyPoints: [
      "Uses AsyncGetCallTrace — not safepoint-biased unlike JVMTI profilers",
      "Can profile: CPU, wall-clock, allocation, lock contention, cache misses",
      "Flame graphs show cumulative stack trace frequency — wide = hot",
      "Runs as Java agent: -agentpath:libasyncProfiler.so=start,event=cpu,file=out.svg",
      "alloc event profiles allocation rate per call site — great for GC pressure",
      "Works on Linux (perf_events) and macOS; Windows support is limited",
    ],
    difficulty: "Advanced",
    category: "Profiling",
    followUps: [
      "How do you read a flame graph?",
      "What is safepoint bias and why does it matter?",
    ],
  },
  {
    id: "q33",
    question: "What is pinning in virtual threads and how do you avoid it?",
    answer:
      'A virtual thread is "pinned" to its carrier thread when it cannot be unmounted during a blocking operation. This defeats the purpose of virtual threads — the carrier thread is blocked and cannot run other virtual threads. Pinning occurs in two cases: (1) when inside a synchronized block or method, and (2) when calling a native method (JNI). To avoid pinning: replace synchronized with ReentrantLock (which supports virtual thread unmounting), and minimize JNI calls in blocking paths. Java 24 is working on lifting the synchronized pinning restriction.',
    keyPoints: [
      "Pinning: virtual thread cannot unmount during blocking — carrier is stuck",
      "Causes: synchronized blocks, native (JNI) methods",
      "Fix: replace synchronized with java.util.concurrent.locks.ReentrantLock",
      "Detect: -Djdk.tracePinnedThreads=full logs pinning stack traces",
      "JDBC drivers using synchronized internally can cause pinning — check your driver",
      "Java 24+ synchronized pinning fix in progress (JEP 491)",
    ],
    difficulty: "Advanced",
    category: "Virtual Threads",
    codeExample: `// PINS the carrier thread — bad with virtual threads
synchronized (lock) {
    socket.read(buf); // blocks here — carrier cannot run others
}

// DOES NOT pin — virtual thread unmounts correctly
ReentrantLock lock = new ReentrantLock();
lock.lock();
try {
    socket.read(buf); // virtual thread unmounts, carrier is free
} finally {
    lock.unlock();
}`,
  },
  {
    id: "q34",
    question: "What is structured concurrency (Java 21+)?",
    answer:
      "Structured concurrency treats a group of concurrent tasks as a single unit of work with a defined lifetime — all sub-tasks must complete before the scope exits. Introduced via StructuredTaskScope (preview in Java 21). When the scope closes: all tasks are awaited, any cancellation propagates to all children, and resources are released cleanly. This prevents the common bugs of unstructured concurrency: orphaned threads, partial failures silently swallowed, and missing cleanup. It mirrors structured programming (if/loop blocks) but for concurrent tasks.",
    keyPoints: [
      "StructuredTaskScope: all forked tasks must finish before scope.close()",
      "ShutdownOnFailure: cancels all tasks if any one fails",
      "ShutdownOnSuccess: cancels all tasks when first succeeds (racing)",
      "Scope owner thread and task threads form a clear parent-child tree",
      "Thread dumps show the logical task tree — much easier to debug",
      "Preview feature — API may change; enable with --enable-preview",
    ],
    difficulty: "Advanced",
    category: "Virtual Threads",
    codeExample: `try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {
    Subtask<User> user = scope.fork(() -> fetchUser(id));
    Subtask<Cart> cart = scope.fork(() -> fetchCart(id));

    scope.join();           // wait for both
    scope.throwIfFailed();  // propagate any exception

    return new Page(user.get(), cart.get());
}
// Both tasks guaranteed done here — no orphaned threads`,
  },
  {
    id: "q35",
    question:
      "How do ThreadLocal and ScopedValue behave differently with virtual threads?",
    answer:
      "ThreadLocal works with virtual threads — each virtual thread has its own ThreadLocal storage. But ThreadLocal has problems at scale: (1) values are mutable and can be changed from anywhere, (2) they are inherited by child threads (InheritableThreadLocal), leading to accidental sharing, (3) with millions of virtual threads, ThreadLocal maps waste memory. ScopedValue (Java 21 preview, final in Java 23) is immutable, scoped to a code block, does not inherit unless explicitly bound, and is GC'd when the scope exits. It is the preferred replacement for ThreadLocal with virtual threads.",
    keyPoints: [
      "ThreadLocal works with virtual threads but has scalability concerns at millions of threads",
      "InheritableThreadLocal copies values to child threads — memory overhead at scale",
      "ScopedValue: immutable, cannot be set after binding, auto-GCd at scope exit",
      "ScopedValue.where(KEY, value).run(() -> { ... }) — binds for the block only",
      "ScopedValue integrates with StructuredTaskScope for automatic inheritance",
      "Use ScopedValue for request-scoped context (user, transaction, locale)",
    ],
    difficulty: "Advanced",
    category: "Virtual Threads",
    followUps: [
      "What is the memory impact of ThreadLocal with millions of virtual threads?",
    ],
  },
  {
    id: "q36",
    question:
      "What JVM flags should you set for a latency-sensitive production service?",
    answer:
      "For latency-sensitive services (REST APIs, gRPC): (1) GC: -XX:+UseZGC (Java 15+) for sub-ms pauses, or -XX:+UseG1GC -XX:MaxGCPauseMillis=50 for GC. (2) Heap: -Xms equals -Xmx to prevent heap resizing pauses. (3) JIT: -XX:+TieredCompilation (default), possibly -XX:ReservedCodeCacheSize=512m for large services. (4) GC logging: -Xlog:gc*:file=gc.log:time,uptime:filecount=5,filesize=20m. (5) OOM protection: -XX:+HeapDumpOnOutOfMemoryError -XX:HeapDumpPath=/tmp. (6) Container awareness: -XX:+UseContainerSupport (default Java 11+). Never set -XX:+DisableExplicitGC in latency-sensitive services using NIO.",
    keyPoints: [
      "-Xms == -Xmx: avoids heap resize pauses and GC cost of uncommitting memory",
      "-XX:+UseZGC: best latency; -XX:+UseG1GC: best balance for most services",
      "-XX:+HeapDumpOnOutOfMemoryError: essential for post-mortem analysis",
      "-XX:+UseContainerSupport: JVM reads cgroup limits (CPU, memory) correctly",
      "GC logging is cheap and essential — always enable in production",
      "-XX:+AlwaysPreTouch: pre-faults heap pages at startup to avoid page fault latency spikes",
    ],
    difficulty: "Advanced",
    category: "Performance",
    followUps: [
      "How do you tune G1 for 99th percentile latency?",
      "What flags would you use for a batch processing workload?",
    ],
  },
  {
    id: "q37",
    question: "What is the Foreign Function & Memory (FFM) API in Java 22?",
    answer:
      "The FFM API (finalized in Java 22, JEP 454) provides a safe, efficient way to interoperate with native code and off-heap memory without using JNI or sun.misc.Unsafe. Key components: MemorySegment (typed, bounded region of off-heap memory with automatic or explicit lifetime), Arena (controls segment lifetime — confined, shared, or global), MethodHandles to call native functions (linker.downcallHandle), and upcall stubs to pass Java callbacks to native code. FFM is type-safe, bounds-checked, and integrates with GC for lifetime management.",
    keyPoints: [
      "Replaces JNI for calling native functions — no C glue code needed",
      "MemorySegment: bounded, typed view of memory (heap or off-heap)",
      "Arena.ofConfined(): single-thread access; Arena.ofShared(): multi-thread",
      "Linker.nativeLinker().downcallHandle() creates Java MethodHandle for C function",
      "No manual free() — Arena.close() releases all associated segments",
      "jextract tool auto-generates Java bindings from C headers",
    ],
    difficulty: "Advanced",
    category: "JVM Internals",
    codeExample: `// Call C strlen() via FFM API (Java 22)
try (Arena arena = Arena.ofConfined()) {
    MemorySegment str = arena.allocateUtf8String("hello");
    MethodHandle strlen = Linker.nativeLinker()
        .downcallHandle(
            Linker.nativeLinker().defaultLookup().find("strlen").get(),
            FunctionDescriptor.of(ValueLayout.JAVA_LONG, ValueLayout.ADDRESS)
        );
    long len = (long) strlen.invoke(str); // 5
}`,
  },
  {
    id: "q38",
    question: "How do you diagnose a CPU spike in a Java application?",
    answer:
      "Systematic approach: (1) Identify the hot threads using top -H -p <pid> (Linux) or jstack + thread ID cross-reference. (2) Take a thread dump with jstack <pid> or kill -3 — look for threads in RUNNABLE state burning CPU. (3) Take multiple thread dumps 5 seconds apart and compare — threads consistently RUNNABLE in the same stack are the culprits. (4) Use async-profiler for a CPU flame graph: shows exact call stacks proportional to CPU time. (5) Check for common causes: tight loops, String concatenation in hot paths, excessive exception creation, GC overhead, infinite recursion.",
    keyPoints: [
      "top -H -p <pid>: shows per-thread CPU on Linux (thread ID in hex)",
      "jstack: convert decimal TID from top to hex to find stack trace",
      "async-profiler CPU flame graph: most accurate, no safepoint bias",
      "Multiple thread dumps (5s apart): confirms consistent CPU-burning stacks",
      "Exception creation (fillInStackTrace) is surprisingly expensive — avoid in hot paths",
      "String + in loops creates O(n) objects — use StringBuilder",
    ],
    difficulty: "Intermediate",
    category: "Profiling",
    followUps: [
      "How do you diagnose high GC CPU usage?",
      'What does a "flat" flame graph indicate?',
    ],
  },
  {
    id: "q39",
    question: "What is GC log analysis and what key metrics should you watch?",
    answer:
      "GC logs are the most reliable source of GC truth. Enable with: -Xlog:gc*:file=gc.log:time,uptime:filecount=5,filesize=20m. Key metrics: (1) Pause time (max and 99th percentile) — drives latency SLAs. (2) GC frequency — too frequent means heap is too small or allocation rate too high. (3) Heap occupancy before/after GC — steady growth means a leak. (4) Promotion failure / evacuation failure — GC cannot find space to move objects; often precedes Full GC. (5) Time spent in GC vs application — GC throughput. Tools: GCEasy.io (online), GCViewer, JDK Mission Control.",
    keyPoints: [
      "-Xlog:gc*: captures all GC events including concurrent phases",
      "Promotion failure (Parallel) / Evacuation failure (G1): critical warning signs",
      "Heap occupancy trend: flat = healthy; growing = leak",
      "Full GC frequency: should be zero in a well-tuned G1/ZGC service",
      "Time-to-safepoint shown separately from GC pause — both matter for latency",
      "GCEasy.io: free web tool to parse and visualize GC logs",
    ],
    difficulty: "Advanced",
    category: "Profiling",
    followUps: [
      "What is promotion failure and how do you fix it?",
      "How do you set -Xlog in Java 11+?",
    ],
  },
  {
    id: "q40",
    question: "What is the difference between a heap dump and a thread dump?",
    answer:
      "A heap dump is a snapshot of all objects in the JVM heap at a point in time — their types, sizes, field values, and reference graph. Used for: diagnosing OOM errors, finding memory leaks, analyzing retained heap. Generated with: jmap -dump:format=b,file=heap.hprof <pid>, jcmd <pid> GC.heap_dump, or automatically with -XX:+HeapDumpOnOutOfMemoryError. A thread dump is a snapshot of all thread stacks at a point in time — thread names, states, stack frames, and lock info. Used for: diagnosing deadlocks, high CPU, thread leaks. Generated with: jstack <pid>, jcmd <pid> Thread.print, or kill -3.",
    keyPoints: [
      "Heap dump: all objects + references — analyze with Eclipse MAT or JDK Mission Control",
      "Thread dump: all thread stacks + lock info — text file, analyze with fastthread.io",
      "Heap dump can be GBs for large heaps — takes time and causes pause",
      "Thread dump is instantaneous and safe in production",
      "Multiple thread dumps (3–5 seconds apart) needed to diagnose deadlocks/CPU",
      "jcmd is the modern replacement for jmap/jstack — supports all JDK versions",
    ],
    difficulty: "Intermediate",
    category: "Profiling",
    followUps: [
      "How do you analyze a heap dump with Eclipse MAT?",
      "What is a dominator tree in heap analysis?",
    ],
  },
  {
    id: "q41",
    question: "What is CDS (Class Data Sharing) and AppCDS?",
    answer:
      "Class Data Sharing (CDS) pre-processes JDK class files into a shared archive (.jsa file) that is memory-mapped at startup, bypassing class loading and parsing. AppCDS (Application CDS, Java 10+) extends this to application and library classes. Benefits: faster startup (class parsing eliminated), lower memory (archive is shared read-only across JVM processes). The workflow: (1) dry-run to record loaded classes (-XX:DumpLoadedClassList), (2) dump the archive (-Xshare:dump), (3) use the archive at runtime (-Xshare:on). Java 13+ Dynamic CDS eliminates the dry-run step.",
    keyPoints: [
      "CDS: JDK classes shared read-only across JVM processes",
      "AppCDS: extends to application + library classes",
      "Startup improvement: 20–50% for class-heavy apps",
      "Memory: shared archive avoids duplicate parsing per JVM process",
      "Dynamic CDS (Java 13+): -XX:ArchiveClassesAtExit=app.jsa on first run",
      "Spring AOT + CDS: major improvement for Spring Boot startup times",
    ],
    difficulty: "Intermediate",
    category: "Performance",
    followUps: [
      "How does GraalVM Native Image differ from CDS?",
      "How do you set up AppCDS for a Spring Boot application?",
    ],
  },
  {
    id: "q42",
    question:
      "What is the difference between interpreter, JIT, and AOT compilation?",
    answer:
      "Three execution strategies: (1) Interpreter: executes bytecode directly, no compilation. Fast startup, slow peak throughput. Used at Tier 0 in HotSpot. (2) JIT (Just-In-Time): compiles hot bytecode to native code at runtime using profiling data. Best peak performance with optimizations tailored to actual runtime behavior (speculative inlining). Warm-up time required. Used by HotSpot C1/C2. (3) AOT (Ahead-Of-Time): compiles code before runtime. No warm-up, fast startup, but loses runtime profile-guided optimizations. Used by GraalVM Native Image. Trade-off: JIT > AOT for peak throughput; AOT > JIT for startup and predictable latency.",
    keyPoints: [
      "Interpreter: zero startup cost, poor peak throughput (~10-100x slower than JIT)",
      "JIT: warm-up needed (thousands of invocations), then native-speed performance",
      "AOT (GraalVM Native Image): instant startup, low memory, limited runtime optimization",
      "Closed-world assumption: Native Image requires all reachable code known at build time",
      "Reflection, dynamic proxies, serialization need explicit Native Image config",
      "Tiered: starts interpreted, promotes to C1, then C2 — best of both worlds",
    ],
    difficulty: "Advanced",
    category: "JIT",
    followUps: [
      "What are the limitations of GraalVM Native Image?",
      "How does profile-guided optimization (PGO) work in Native Image?",
    ],
  },
  {
    id: "q43",
    question: "What is a Safepoint in the JVM?",
    answer:
      "A safepoint is a special state where all Java application threads are paused so the JVM can perform operations that require a consistent view of memory. Common safepoint operations include garbage collection, deoptimization, class redefinition, biased lock revocation, and thread dump generation. The JVM inserts safepoint polls into compiled code so threads can quickly stop when requested. Long-running native code or tight loops without safepoint polls can delay reaching a safepoint.",
    keyPoints: [
      "All Java threads stop at a safepoint",
      "Used for GC, deoptimization, and class redefinition",
      "Safepoint polls are inserted into compiled code",
      "Long safepoint synchronization can impact application latency",
      "Safepoint logs help diagnose unexpected pauses",
    ],
    difficulty: "Intermediate",
    category: "Performance",
    followUps: [
      "What is a safepoint poll?",
      "How do you analyze safepoint pauses?",
    ],
  },
  {
    id: "q44",
    question: "What is a Thread Local Allocation Buffer (TLAB)?",
    answer:
      "A Thread Local Allocation Buffer (TLAB) is a small portion of the Eden space reserved exclusively for a thread. Instead of synchronizing every object allocation, each thread allocates objects from its own TLAB using a simple pointer bump, making allocation extremely fast. When the TLAB becomes full, the JVM requests another TLAB or allocates directly from Eden.",
    keyPoints: [
      "Each thread owns its own TLAB",
      "Reduces synchronization during allocation",
      "Located inside Eden space",
      "Most short-lived objects are allocated in TLABs",
      "Improves allocation throughput significantly",
    ],
    difficulty: "Intermediate",
    category: "Memory",
    followUps: [
      "What happens when a TLAB becomes full?",
      "How do you disable TLAB allocation?",
    ],
  },
  {
    id: "q45",
    question: "What is a Promotion Local Allocation Buffer (PLAB)?",
    answer:
      "A Promotion Local Allocation Buffer (PLAB) is similar to a TLAB but is used by garbage collector worker threads during object promotion or copying. Instead of multiple GC threads competing for memory, each GC worker receives its own PLAB, reducing contention during parallel garbage collection.",
    keyPoints: [
      "Used only during garbage collection",
      "Owned by GC worker threads",
      "Reduces synchronization while copying objects",
      "Improves throughput of parallel collectors",
      "Automatically sized by the JVM",
    ],
    difficulty: "Advanced",
    category: "Garbage Collection",
    followUps: [
      "How is PLAB different from TLAB?",
      "Which collectors use PLAB?",
    ],
  },
  {
    id: "q46",
    question: "What is stored in an object header?",
    answer:
      "Every Java object contains an object header before its instance fields. The header typically consists of the Mark Word and the Klass Pointer. The Mark Word stores runtime information such as hash code, GC age, lock state, and thread ownership. The Klass Pointer references the class metadata describing the object type.",
    keyPoints: [
      "Every object has a header",
      "Contains Mark Word and Klass Pointer",
      "Stores lock information",
      "Stores object hash code",
      "Used by the JVM during synchronization and GC",
    ],
    difficulty: "Advanced",
    category: "JVM Internals",
    followUps: [
      "What is a Mark Word?",
      "How does compressed class pointer affect object headers?",
    ],
  },
  {
    id: "q47",
    question: "What is Compressed OOPs?",
    answer:
      "Compressed Ordinary Object Pointers (Compressed OOPs) reduce memory usage by storing 64-bit object references as 32-bit offsets when the heap size is below a certain threshold. During access, the JVM reconstructs the full address by shifting the compressed value. This reduces memory consumption while maintaining performance.",
    keyPoints: [
      "Reduces pointer size from 64-bit to 32-bit",
      "Lowers overall heap usage",
      "Improves cache utilization",
      "Enabled by default on most JVMs",
      "Works only within supported heap sizes",
    ],
    difficulty: "Intermediate",
    category: "Memory",
    followUps: [
      "When are compressed OOPs disabled?",
      "What are compressed class pointers?",
    ],
  },
  {
    id: "q48",
    question: "What is biased locking?",
    answer:
      "Biased locking was an optimization that allowed a lock to become permanently associated with a single thread, avoiding expensive synchronization operations when there was no contention. If another thread attempted to acquire the lock, the JVM revoked the bias and upgraded the locking mechanism. This optimization was disabled by default in newer JDKs and later removed because modern workloads benefited less from it.",
    keyPoints: [
      "Optimized uncontended synchronization",
      "Avoided repeated CAS operations",
      "Required bias revocation on contention",
      "Removed from modern JDK versions",
      "Improved performance for single-threaded locking",
    ],
    difficulty: "Advanced",
    category: "Threads",
    followUps: [
      "Why was biased locking removed?",
      "How is lightweight locking different?",
    ],
  },
  {
    id: "q49",
    question: "What is lock coarsening?",
    answer:
      "Lock coarsening is a JIT optimization where multiple consecutive synchronized blocks using the same lock are merged into a single larger synchronized block. This reduces the overhead of repeatedly acquiring and releasing the same monitor.",
    keyPoints: [
      "Performed by the JIT compiler",
      "Combines adjacent synchronized blocks",
      "Reduces monitor enter/exit operations",
      "Improves throughput",
      "Applies only when it is safe",
    ],
    difficulty: "Advanced",
    category: "JIT",
    followUps: [
      "How does lock coarsening improve performance?",
      "When is lock coarsening not possible?",
    ],
  },
  {
    id: "q50",
    question: "What is lock elimination?",
    answer:
      "Lock elimination is a JIT optimization that removes synchronization entirely when escape analysis proves that a locked object cannot be accessed by multiple threads. Since no contention is possible, synchronization becomes unnecessary.",
    keyPoints: [
      "Uses escape analysis",
      "Removes unnecessary synchronization",
      "Improves performance",
      "Applied during JIT compilation",
      "Works only when objects do not escape the thread",
    ],
    difficulty: "Advanced",
    category: "JIT",
    followUps: [
      "What role does escape analysis play?",
      "Can lock elimination occur for shared objects?",
    ],
  },
  {
    id: "q51",
    question: "What is scalar replacement?",
    answer:
      "Scalar replacement is a JIT optimization that breaks an object into individual variables when escape analysis determines the object never escapes its method. Instead of allocating the object on the heap, the JVM stores its fields in CPU registers or on the stack, eliminating allocation and garbage collection overhead.",
    keyPoints: [
      "Requires escape analysis",
      "Avoids heap allocation",
      "Stores fields as local variables",
      "Reduces GC pressure",
      "Improves execution speed",
    ],
    difficulty: "Advanced",
    category: "JIT",
    followUps: [
      "How does scalar replacement reduce GC?",
      "When can scalar replacement not be applied?",
    ],
  },
  {
    id: "q52",
    question: "What is deoptimization in HotSpot?",
    answer:
      "Deoptimization is the process where the JVM discards previously optimized machine code and falls back to interpreted execution when assumptions made during JIT compilation become invalid. For example, if the JIT inlined a method based on profiling data but later a new subclass changes the behavior, the JVM deoptimizes and recompiles the code with updated information.",
    keyPoints: [
      "Reverts optimized code when assumptions fail",
      "Ensures correctness of speculative optimizations",
      "Allows aggressive JIT optimizations",
      "Triggered by changing runtime behavior",
      "The JVM may later recompile the method",
    ],
    difficulty: "Advanced",
    category: "JIT",
    followUps: [
      "What triggers deoptimization?",
      "How does speculative optimization work?",
    ],
  },
  {
    id: "q53",
    question: "What is the Code Cache in the JVM?",
    answer:
      "The Code Cache is a special memory area where the JVM stores native machine code generated by the Just-In-Time (JIT) compiler. Instead of repeatedly interpreting bytecode, the JVM executes compiled native code directly from the Code Cache, improving performance. If the Code Cache becomes full, the JVM may stop compiling additional methods, causing performance degradation.",
    keyPoints: [
      "Stores JIT-compiled native code",
      "Improves execution speed by avoiding interpretation",
      "Managed separately from the Java heap",
      "A full Code Cache can reduce application performance",
      "Can be monitored using JFR and jcmd",
    ],
    difficulty: "Intermediate",
    category: "JIT",
    followUps: [
      "How do you monitor Code Cache usage?",
      "What happens when the Code Cache becomes full?",
    ],
  },
  {
    id: "q54",
    question: "What is JVM warm-up?",
    answer:
      "JVM warm-up is the period during which the JVM gathers profiling information and progressively compiles frequently executed methods from interpreted bytecode to optimized native code. During warm-up, application performance gradually improves until it reaches peak throughput.",
    keyPoints: [
      "Starts with interpreted execution",
      "JIT compiles hot methods",
      "Performance improves over time",
      "Tiered compilation accelerates warm-up",
      "Benchmarking should ignore warm-up iterations",
    ],
    difficulty: "Intermediate",
    category: "Performance",
    followUps: [
      "Why are JMH warm-up iterations important?",
      "How does tiered compilation improve warm-up?",
    ],
  },
  {
    id: "q55",
    question: "What causes Stop-The-World (STW) pauses?",
    answer:
      "A Stop-The-World pause occurs when all Java application threads are temporarily suspended so the JVM can perform operations requiring a consistent view of memory. Garbage collection is the most common cause, but safepoint operations such as class redefinition, deoptimization, and thread dump generation may also trigger STW pauses.",
    keyPoints: [
      "Application threads are paused",
      "Most commonly caused by garbage collection",
      "Also used for class redefinition and deoptimization",
      "Long STW pauses affect application latency",
      "Modern collectors minimize pause duration",
    ],
    difficulty: "Intermediate",
    category: "Garbage Collection",
    followUps: [
      "How does ZGC reduce STW pauses?",
      "How do you analyze long GC pauses?",
    ],
  },
  {
    id: "q56",
    question: "What is Java Flight Recorder (JFR)?",
    answer:
      "Java Flight Recorder (JFR) is a low-overhead profiling and diagnostics framework built into the JVM. It continuously records events such as CPU usage, garbage collection, allocations, lock contention, thread activity, and method profiling. JFR is designed for production use because it introduces minimal runtime overhead.",
    keyPoints: [
      "Built into modern JDKs",
      "Low-overhead production profiler",
      "Records JVM and application events",
      "Useful for performance troubleshooting",
      "Works with JDK Mission Control",
    ],
    difficulty: "Intermediate",
    category: "Profiling",
    followUps: [
      "How do you start a JFR recording?",
      "What events are captured by JFR?",
    ],
    codeExample: `jcmd <pid> JFR.start name=Profile duration=2m filename=recording.jfr`,
  },
  {
    id: "q57",
    question: "How do you analyze performance using Java Flight Recorder?",
    answer:
      "Performance analysis with JFR involves collecting a recording during application execution and opening it in JDK Mission Control. Developers inspect CPU hotspots, allocation rates, garbage collection activity, lock contention, thread states, and I/O operations to identify bottlenecks. Since JFR records time-correlated events, it provides a complete picture of JVM behavior.",
    keyPoints: [
      "Open recordings in JDK Mission Control",
      "Analyze CPU hotspots",
      "Check allocation rate and GC activity",
      "Investigate lock contention",
      "Correlate multiple JVM events over time",
    ],
    difficulty: "Advanced",
    category: "Profiling",
    followUps: [
      "How is JFR different from VisualVM?",
      "Can JFR be used in production?",
    ],
  },
  {
    id: "q58",
    question: "What is JDK Mission Control (JMC)?",
    answer:
      "JDK Mission Control is the official graphical analysis tool for Java Flight Recorder recordings. It provides dashboards for CPU usage, memory allocation, garbage collection, thread activity, code cache utilization, and lock contention. Developers use JMC to investigate performance issues with minimal application overhead.",
    keyPoints: [
      "Official GUI for JFR analysis",
      "Visualizes JVM metrics",
      "Shows CPU, GC, memory, and thread activity",
      "Supports production diagnostics",
      "Included with modern JDK distributions",
    ],
    difficulty: "Intermediate",
    category: "Profiling",
    followUps: ["What can JMC analyze?", "How does JMC integrate with JFR?"],
  },
  {
    id: "q59",
    question: "What tools are commonly used for JVM profiling?",
    answer:
      "Popular JVM profiling tools include Java Flight Recorder (JFR), JDK Mission Control (JMC), VisualVM, async-profiler, Eclipse Memory Analyzer (MAT), GCViewer, VisualGC, and JConsole. Each tool specializes in different aspects such as CPU profiling, memory analysis, thread inspection, garbage collection analysis, or heap dump investigation.",
    keyPoints: [
      "JFR for production profiling",
      "JMC for JFR analysis",
      "VisualVM for local monitoring",
      "Eclipse MAT for heap dump analysis",
      "async-profiler for CPU and allocation profiling",
    ],
    difficulty: "Beginner",
    category: "Profiling",
    followUps: [
      "Which profiler is best for production?",
      "What is Eclipse MAT used for?",
    ],
  },
  {
    id: "q60",
    question: "What is async-profiler?",
    answer:
      "async-profiler is a low-overhead sampling profiler for Java applications. It uses operating system performance counters instead of bytecode instrumentation, making it suitable for production environments. It supports CPU profiling, allocation profiling, lock profiling, and flame graph generation.",
    keyPoints: [
      "Very low runtime overhead",
      "Supports CPU and allocation profiling",
      "Generates flame graphs",
      "Uses native sampling instead of instrumentation",
      "Widely used in production environments",
    ],
    difficulty: "Advanced",
    category: "Profiling",
    followUps: [
      "How does async-profiler differ from JFR?",
      "What is a flame graph?",
    ],
  },
  {
    id: "q61",
    question: "What are the different types of OutOfMemoryError?",
    answer:
      "OutOfMemoryError can occur for several reasons including Java heap exhaustion, Metaspace exhaustion, Direct Buffer Memory exhaustion, inability to create native threads, GC overhead limit exceeded, and request for an array larger than the JVM can allocate. Identifying the exact message is critical because each type has different root causes and solutions.",
    keyPoints: [
      "Java heap space",
      "Metaspace",
      "Direct buffer memory",
      "Unable to create native thread",
      "GC overhead limit exceeded",
      "Requested array size exceeds VM limit",
    ],
    difficulty: "Intermediate",
    category: "Memory",
    followUps: ["How do you diagnose heap OOM?", "What causes Metaspace OOM?"],
  },
  {
    id: "q62",
    question: "How do you investigate a Java memory leak?",
    answer:
      "Memory leak investigation begins by collecting heap dumps before and after memory growth. Developers analyze retained heap, dominator trees, GC roots, and object references using Eclipse Memory Analyzer (MAT). GC logs, JFR recordings, and allocation profiling help identify objects that continue growing unexpectedly. The goal is to locate objects that remain strongly reachable when they should have been garbage collected.",
    keyPoints: [
      "Capture heap dumps",
      "Analyze retained heap using MAT",
      "Inspect GC roots",
      "Review GC logs and JFR recordings",
      "Find objects that continuously grow",
    ],
    difficulty: "Advanced",
    category: "Profiling",
    followUps: [
      "What is a dominator tree?",
      "How do GC roots help identify leaks?",
    ],
  },
  {
    id: "q63",
    question: "What is Native Memory Tracking (NMT)?",
    answer:
      "Native Memory Tracking (NMT) is a JVM diagnostic feature that tracks native (off-heap) memory usage. Unlike heap analysis, NMT helps identify memory consumed by Metaspace, thread stacks, code cache, JNI, GC structures, and internal JVM components. It is invaluable when a Java process consumes much more memory than its configured heap size.",
    keyPoints: [
      "Tracks off-heap/native memory",
      "Useful for diagnosing native memory leaks",
      "Reports Metaspace, Code Cache, Threads, GC, JNI usage",
      "Enabled using -XX:NativeMemoryTracking=summary or detail",
      "Analyzed using jcmd VM.native_memory",
    ],
    difficulty: "Advanced",
    category: "Memory",
    followUps: [
      "How do you enable Native Memory Tracking?",
      "What is the overhead of NMT?",
    ],
    codeExample: `jcmd <pid> VM.native_memory summary`,
  },
  {
    id: "q64",
    question: "What is DirectByteBuffer?",
    answer:
      "DirectByteBuffer allocates memory outside the Java heap. It is commonly used for high-performance I/O because native libraries can access it directly without copying data between the JVM heap and native memory. Although faster for I/O operations, excessive direct buffer allocation can lead to OutOfMemoryError: Direct buffer memory.",
    keyPoints: [
      "Allocated outside the Java heap",
      "Improves NIO performance",
      "Reduces memory copies",
      "Managed by the JVM Cleaner",
      "Limited by -XX:MaxDirectMemorySize",
    ],
    difficulty: "Intermediate",
    category: "Memory",
    followUps: [
      "How is DirectByteBuffer different from HeapByteBuffer?",
      "What causes Direct Buffer Memory OOM?",
    ],
  },
  {
    id: "q65",
    question: "What is JNI (Java Native Interface)?",
    answer:
      "JNI is a programming interface that allows Java code to call native libraries written in languages such as C and C++. It is commonly used for operating system integration, hardware access, legacy libraries, and performance-critical native code. While powerful, JNI increases complexity and bypasses many JVM safety guarantees.",
    keyPoints: [
      "Connects Java with native code",
      "Supports C and C++ libraries",
      "Used for OS-level functionality",
      "Requires careful memory management",
      "Can introduce crashes outside JVM control",
    ],
    difficulty: "Intermediate",
    category: "JVM Internals",
    followUps: [
      "When should JNI be avoided?",
      "How does JNI affect JVM performance?",
    ],
  },
  {
    id: "q66",
    question: "What is Project Panama?",
    answer:
      "Project Panama is a modern replacement for many JNI use cases. It introduces the Foreign Function & Memory (FFM) API, allowing Java programs to call native libraries and access native memory safely without writing JNI glue code. Panama improves developer productivity while reducing bugs and improving performance.",
    keyPoints: [
      "Modern alternative to JNI",
      "Provides Foreign Function & Memory API",
      "Safer native memory access",
      "Eliminates JNI boilerplate",
      "Available in modern JDK versions",
    ],
    difficulty: "Advanced",
    category: "JVM Internals",
    followUps: [
      "How is Panama different from JNI?",
      "What problems does Panama solve?",
    ],
  },
  {
    id: "q67",
    question: "What are Hidden Classes in the JVM?",
    answer:
      "Hidden Classes are JVM classes that cannot be discovered using normal class loading mechanisms. They are primarily used by frameworks that generate classes dynamically, such as lambda expressions and runtime proxies. Hidden Classes improve performance while reducing class loader pollution.",
    keyPoints: [
      "Introduced for dynamically generated classes",
      "Cannot be loaded using Class.forName()",
      "Used by lambda implementations",
      "Improve framework performance",
      "Reduce permanent class metadata growth",
    ],
    difficulty: "Advanced",
    category: "Class Loading",
    followUps: [
      "Why were Hidden Classes introduced?",
      "Which frameworks benefit from Hidden Classes?",
    ],
  },
  {
    id: "q68",
    question: "What are Dynamic Proxies?",
    answer:
      "Dynamic Proxies allow the JVM to create implementations of interfaces at runtime. Instead of writing concrete classes, developers provide an InvocationHandler that intercepts method calls. Dynamic proxies are widely used in Spring AOP, transaction management, logging, security, and RPC frameworks.",
    keyPoints: [
      "Generated at runtime",
      "Require interfaces",
      "Intercept method calls",
      "Common in Spring AOP",
      "Reduce boilerplate code",
    ],
    difficulty: "Intermediate",
    category: "Class Loading",
    followUps: [
      "How are JDK proxies different from CGLIB?",
      "Why are proxies used in Spring?",
    ],
  },
  {
    id: "q69",
    question: "What is invokedynamic?",
    answer:
      "invokedynamic is a JVM bytecode instruction introduced in Java 7 to support dynamically typed languages and efficient lambda implementation. Unlike invokevirtual, invokedynamic resolves method calls dynamically at runtime using bootstrap methods. It enables flexible method dispatch while maintaining JVM performance.",
    keyPoints: [
      "Introduced in Java 7",
      "Supports dynamic languages",
      "Used heavily for lambda expressions",
      "Resolves calls at runtime",
      "Provides flexible method linkage",
    ],
    difficulty: "Advanced",
    category: "JVM Internals",
    followUps: [
      "How does invokedynamic differ from invokevirtual?",
      "Why do lambda expressions use invokedynamic?",
    ],
  },
  {
    id: "q70",
    question: "What is Class Data Sharing (CDS)?",
    answer:
      "Class Data Sharing (CDS) improves JVM startup by storing preprocessed JDK class metadata in a shared archive. Multiple JVM processes can map this archive into memory, reducing startup time and overall memory usage. CDS is enabled by default in modern JDKs.",
    keyPoints: [
      "Improves JVM startup",
      "Reduces class loading overhead",
      "Shares class metadata between JVMs",
      "Reduces memory consumption",
      "Enabled by default in modern JDKs",
    ],
    difficulty: "Intermediate",
    category: "Performance",
    followUps: [
      "How does CDS improve startup?",
      "What is stored in the CDS archive?",
    ],
  },
  {
    id: "q71",
    question: "What is AppCDS?",
    answer:
      "Application Class Data Sharing (AppCDS) extends CDS by allowing application and third-party library classes to be included in the shared archive. This significantly improves startup performance for large enterprise applications such as Spring Boot services.",
    keyPoints: [
      "Extends CDS to application classes",
      "Improves enterprise application startup",
      "Reduces repeated class loading",
      "Useful for microservices",
      "Works well with Spring Boot",
    ],
    difficulty: "Advanced",
    category: "Performance",
    followUps: [
      "How do you generate an AppCDS archive?",
      "How is AppCDS different from CDS?",
    ],
  },
  {
    id: "q72",
    question: "What is Ahead-of-Time (AOT) Compilation?",
    answer:
      "Ahead-of-Time (AOT) compilation converts Java bytecode into native machine code before the application starts. Unlike JIT compilation, AOT eliminates warm-up time and provides fast startup with predictable latency. GraalVM Native Image is the most popular implementation of AOT compilation for Java.",
    keyPoints: [
      "Compiles code before execution",
      "Reduces startup time",
      "Eliminates JVM warm-up",
      "Provides predictable latency",
      "Commonly implemented using GraalVM Native Image",
    ],
    difficulty: "Advanced",
    category: "JIT",
    followUps: [
      "How is AOT different from JIT?",
      "When should you choose AOT over JIT?",
    ],
  },
  {
    id: "q73",
    question:
      "What is GraalVM Native Image, and how is it different from a traditional JVM application?",
    answer:
      "GraalVM Native Image is an Ahead-of-Time (AOT) compiler that converts Java bytecode into a standalone native executable. Unlike a traditional JVM application, a Native Image does not require a JVM at runtime, resulting in near-instant startup and significantly lower memory usage. However, because it uses a closed-world assumption, reflection, dynamic proxies, and serialization require explicit configuration. Native Image is ideal for serverless functions, CLI tools, and microservices where startup time is critical.",
    keyPoints: [
      "Compiles Java into a native executable",
      "Very fast startup (milliseconds)",
      "Lower memory footprint",
      "Uses closed-world analysis",
      "Reflection and dynamic proxies require configuration",
      "Popular for Spring Boot and Quarkus microservices",
    ],
    difficulty: "Advanced",
    category: "JIT",
    followUps: [
      "What are the limitations of GraalVM Native Image?",
      "When should you choose Native Image over the JVM?",
    ],
  },
  {
    id: "q74",
    question: "How can you optimize JVM startup time?",
    answer:
      "JVM startup can be improved by reducing class loading, enabling Class Data Sharing (CDS/AppCDS), minimizing reflection, using lazy initialization, reducing the classpath size, enabling Spring AOT, and using GraalVM Native Image for startup-critical applications. Startup optimization is especially important for serverless and containerized workloads.",
    keyPoints: [
      "Use CDS/AppCDS",
      "Reduce classpath size",
      "Enable lazy initialization",
      "Avoid unnecessary reflection",
      "Consider GraalVM Native Image",
      "Use Spring AOT for Spring Boot applications",
    ],
    difficulty: "Intermediate",
    category: "Performance",
    followUps: ["How does CDS improve startup?", "What is Spring AOT?"],
  },
  {
    id: "q75",
    question: "What are the most important JVM flags used in production?",
    answer:
      "Production JVMs commonly use flags for heap sizing, garbage collection, logging, diagnostics, and memory analysis. Examples include -Xms, -Xmx, -XX:+UseG1GC, -Xlog:gc*, -XX:+HeapDumpOnOutOfMemoryError, -XX:MaxGCPauseMillis, and -XX:+UseStringDeduplication. The choice of flags depends on application latency and throughput requirements.",
    keyPoints: [
      "-Xms / -Xmx for heap sizing",
      "-XX:+UseG1GC for modern garbage collection",
      "-Xlog:gc* for GC logging",
      "-XX:+HeapDumpOnOutOfMemoryError",
      "-XX:MaxGCPauseMillis",
      "-XX:+UseStringDeduplication",
    ],
    difficulty: "Intermediate",
    category: "Performance",
    followUps: [
      "What JVM flags are useful for troubleshooting?",
      "Which GC flags are commonly used in Java 17?",
    ],
    codeExample: `java -Xms2g -Xmx2g -XX:+UseG1GC -Xlog:gc* -jar app.jar`,
  },
  {
    id: "q76",
    question: "How do you tune G1 Garbage Collector?",
    answer:
      "G1GC tuning begins with selecting an appropriate heap size and pause-time goal. Important parameters include -XX:MaxGCPauseMillis, -XX:InitiatingHeapOccupancyPercent, and -XX:G1ReservePercent. Monitoring GC logs and heap occupancy helps determine whether adjustments are necessary. In most cases, increasing heap size is more effective than excessive flag tuning.",
    keyPoints: [
      "Start with correct heap sizing",
      "Set pause-time goals",
      "Monitor GC logs",
      "Adjust InitiatingHeapOccupancyPercent if needed",
      "Avoid unnecessary JVM flag tuning",
      "Validate changes with production-like workloads",
    ],
    difficulty: "Advanced",
    category: "Garbage Collection",
    followUps: ["How do you reduce Full GCs?", "What is G1ReservePercent?"],
  },
  {
    id: "q77",
    question: "How do you reduce long GC pauses?",
    answer:
      "Reducing GC pauses involves minimizing object allocation, selecting an appropriate collector (G1, ZGC, or Shenandoah), increasing heap size when appropriate, reducing large object creation, enabling String Deduplication, and analyzing GC logs. The first step is always to identify the root cause using GC logs or Java Flight Recorder rather than changing JVM flags blindly.",
    keyPoints: [
      "Reduce allocation rate",
      "Choose an appropriate GC",
      "Increase heap when necessary",
      "Analyze GC logs before tuning",
      "Reduce temporary object creation",
      "Consider ZGC or Shenandoah for low-latency systems",
    ],
    difficulty: "Advanced",
    category: "Garbage Collection",
    followUps: ["How do ZGC and G1 differ?", "How do you analyze GC pauses?"],
  },
  {
    id: "q78",
    question:
      "What steps do you follow when troubleshooting a production JVM issue?",
    answer:
      "A structured troubleshooting process includes checking CPU, memory, GC activity, thread dumps, heap dumps, application logs, and JFR recordings. Identify whether the issue is caused by high CPU, excessive GC, thread contention, memory leaks, or external dependencies before making JVM tuning changes.",
    keyPoints: [
      "Collect GC logs",
      "Capture multiple thread dumps",
      "Analyze heap dumps if memory grows",
      "Use Java Flight Recorder",
      "Monitor CPU and allocation rate",
      "Avoid tuning without evidence",
    ],
    difficulty: "Advanced",
    category: "Profiling",
    followUps: [
      "When should you capture a heap dump?",
      "How do thread dumps help identify deadlocks?",
    ],
  },
  {
    id: "q79",
    question: "What is your JVM performance tuning checklist?",
    answer:
      "A practical JVM tuning checklist includes selecting the correct garbage collector, sizing the heap appropriately, enabling GC logging, monitoring CPU and memory, minimizing unnecessary object allocation, reviewing thread contention, using profiling tools such as JFR and async-profiler, and validating every tuning change with realistic load tests. Performance tuning should always be measurement-driven.",
    keyPoints: [
      "Choose the appropriate GC",
      "Right-size the heap",
      "Enable GC logging",
      "Profile before tuning",
      "Monitor allocation rate",
      "Validate changes with load testing",
    ],
    difficulty: "Advanced",
    category: "Performance",
    followUps: [
      "Which metrics matter most for JVM tuning?",
      "Why is load testing important?",
    ],
  },
  {
    id: "q80",
    question:
      "What JVM topics are most frequently asked in senior Java interviews?",
    answer:
      "Senior JVM interviews focus on practical understanding rather than memorization. Common topics include garbage collectors (G1, ZGC, Shenandoah), Java Memory Model, class loading, JIT compilation, escape analysis, JVM diagnostics, thread dumps, heap dumps, memory leaks, GC tuning, Java Flight Recorder, Project Loom, GraalVM, and production troubleshooting scenarios. Interviewers often expect candidates to explain real-world debugging experiences.",
    keyPoints: [
      "Garbage Collection",
      "JIT and JVM Internals",
      "Java Memory Model",
      "Thread Dumps and Heap Dumps",
      "JFR and Profiling",
      "Production troubleshooting",
      "Project Loom",
      "GraalVM Native Image",
    ],
    difficulty: "Beginner",
    category: "Architecture",
    followUps: [
      "What JVM topic do interviewers ask most often?",
      "How should you prepare for JVM interviews?",
    ],
  },
];
