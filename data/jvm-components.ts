import type { JvmComponent } from '@/types';

export const jvmComponents: JvmComponent[] = [
  {
    id: 'class-loader',
    name: 'Class Loader Subsystem',
    shortName: 'Class Loader',
    color: '#3B82F6',
    bgColor: 'rgba(59,130,246,0.1)',
    borderColor: 'rgba(59,130,246,0.4)',
    description:
      'Responsible for loading, linking, and initializing .class files into the JVM at runtime. It follows a parent-delegation model ensuring security and preventing duplicate class definitions.',
    details: [
      'Bootstrap ClassLoader loads core Java API classes (rt.jar / java.base module)',
      'Extension / Platform ClassLoader loads JDK extension classes',
      'Application ClassLoader loads classes from the application classpath',
      'Custom ClassLoaders can override findClass() to load from non-standard sources',
    ],
    keyFacts: [
      'Parent-delegation model prevents malicious class hijacking',
      'Classes are identified by fully-qualified name + ClassLoader instance',
      'Loading happens lazily — only when first referenced',
      'Linking consists of Verification, Preparation, and Resolution',
    ],
    relatedComponents: ['runtime-data-areas', 'execution-engine'],
  },
  {
    id: 'runtime-data-areas',
    name: 'Runtime Data Areas',
    shortName: 'Memory Areas',
    color: '#8B5CF6',
    bgColor: 'rgba(139,92,246,0.1)',
    borderColor: 'rgba(139,92,246,0.4)',
    description:
      'JVM divides memory into distinct runtime data areas. Some are shared across all threads (Heap, Method Area), while others are created per thread (Stack, PC Register, Native Method Stack).',
    details: [
      'Heap: Stores all object instances and arrays; shared by all threads; GC-managed',
      'Method Area (Metaspace in Java 8+): Stores class metadata, static variables, constant pool',
      'JVM Stack: Per-thread stack of frames; each frame holds locals, operand stack, frame data',
      'PC Register: Per-thread program counter pointing to the currently executing instruction',
      'Native Method Stack: Supports execution of native (non-Java) methods',
    ],
    keyFacts: [
      'Heap is the primary target for Garbage Collection',
      'StackOverflowError when JVM Stack grows beyond limit',
      'OutOfMemoryError when Heap or Metaspace is exhausted',
      'PC Register is undefined for native methods',
    ],
    relatedComponents: ['class-loader', 'execution-engine', 'garbage-collector'],
  },
  {
    id: 'execution-engine',
    name: 'Execution Engine',
    shortName: 'Exec Engine',
    color: '#10B981',
    bgColor: 'rgba(16,185,129,0.1)',
    borderColor: 'rgba(16,185,129,0.4)',
    description:
      'Executes the bytecode loaded by the Class Loader. Contains an Interpreter for initial execution and a JIT Compiler that compiles hot methods to native machine code for peak performance.',
    details: [
      'Interpreter: Reads and executes bytecode instructions one-by-one; fast startup',
      'JIT Compiler: Compiles frequently executed (hot) bytecode to optimized native code',
      'HotSpot C1 Compiler: Client compiler, fast compilation with basic optimizations',
      'HotSpot C2 Compiler: Server compiler, aggressive optimizations for long-running code',
      'Garbage Collector: Manages automated memory reclamation',
    ],
    keyFacts: [
      'Tiered compilation (default since Java 8) combines C1 and C2',
      'JIT inlining, loop unrolling, and escape analysis are key optimizations',
      'Deoptimization can revert JIT code back to interpreter if assumptions break',
      '-XX:+PrintCompilation shows which methods are JIT-compiled',
    ],
    relatedComponents: ['runtime-data-areas', 'garbage-collector'],
  },
  {
    id: 'garbage-collector',
    name: 'Garbage Collector',
    shortName: 'GC',
    color: '#F59E0B',
    bgColor: 'rgba(245,158,11,0.1)',
    borderColor: 'rgba(245,158,11,0.4)',
    description:
      'Automatically reclaims memory occupied by objects that are no longer reachable from any live thread or static reference. Employs generational collection strategies for efficiency.',
    details: [
      'Mark phase: Traverses object graph from GC roots to identify live objects',
      'Sweep phase: Reclaims memory of unreachable objects',
      'Compaction: Defragments heap by moving live objects together (in some collectors)',
      'Young Generation (Eden + Survivor spaces): Where new objects are allocated',
      'Old Generation (Tenured): Holds long-lived objects promoted from Young Gen',
    ],
    keyFacts: [
      'GC roots include: local variables, static fields, JNI references',
      'Minor GC collects Young Generation; Major/Full GC collects Old Generation',
      'G1 GC is default since Java 9; ZGC offers sub-millisecond pause times',
      '-Xmx and -Xms control maximum and initial heap size',
    ],
    relatedComponents: ['runtime-data-areas', 'execution-engine'],
  },
  {
    id: 'jni',
    name: 'Java Native Interface',
    shortName: 'JNI',
    color: '#EC4899',
    bgColor: 'rgba(236,72,153,0.1)',
    borderColor: 'rgba(236,72,153,0.4)',
    description:
      'Provides a bridge allowing Java code running inside the JVM to call and be called by native applications and libraries written in C, C++, or assembly.',
    details: [
      'Declares native methods in Java using the native keyword',
      'JNI header files generated via javah (or javac -h)',
      'Native library loaded with System.loadLibrary()',
      'Enables access to platform-specific hardware or OS features',
    ],
    keyFacts: [
      'JNI is a last resort — it breaks portability and adds complexity',
      'Memory leaks are possible if native code does not release JNI global references',
      'JNI calls typically require crossing JVM boundary, which has overhead',
      'JNA and Panama (Project Panama) offer higher-level alternatives',
    ],
    relatedComponents: ['execution-engine'],
  },
  {
    id: 'native-method-libs',
    name: 'Native Method Libraries',
    shortName: 'Native Libs',
    color: '#06B6D4',
    bgColor: 'rgba(6,182,212,0.1)',
    borderColor: 'rgba(6,182,212,0.4)',
    description:
      'Platform-specific native libraries (C/C++ .dll/.so files) required by the JVM itself and by Java applications using JNI. They provide OS-level functionality unavailable in pure Java.',
    details: [
      'Includes system libraries like libc, libpthread',
      'Java standard library internals are implemented as native methods',
      'Loaded and managed by the operating system dynamic linker',
      'Located via java.library.path system property',
    ],
    keyFacts: [
      'sun.misc.Unsafe is a widely-used native bridge for low-level operations',
      'Some JVM capabilities like I/O and threading rely on native implementations',
      'Foreign Function & Memory API (Java 22+) is the modern replacement for JNI',
    ],
    relatedComponents: ['jni'],
  },
];
