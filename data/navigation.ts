import type { NavItem } from '@/types';

export const navItems: NavItem[] = [
  { label: 'Architecture', href: '/architecture', description: 'JVM component overview' },
  { label: 'Heap vs Stack', href: '/heap-stack', description: 'Memory regions explained' },
  { label: 'Class Loader', href: '/class-loader', description: 'Class loading lifecycle' },
  { label: 'Execution Engine', href: '/execution-engine', description: 'Bytecode & JIT' },
  { label: 'Garbage Collection', href: '/garbage-collection', description: 'GC algorithms' },
  { label: 'Threads', href: '/threads', description: 'Concurrency model' },
  { label: 'Memory Model', href: '/memory-model', description: 'Java Memory Model' },
  { label: 'Interview Q&A', href: '/interview', description: 'Prep questions' },
  { label: 'JVM Flags Lab', href: '/jvm-flags', description: 'Interactive tuning' },
  { label: 'Virtual Threads', href: '/virtual-threads', description: 'Project Loom' },
  { label: 'Bytecode', href: '/bytecode', description: 'Bytecode playground' },
];
