// ─── Navigation ───────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  href: string;
  icon?: string;
  description?: string;
}

// ─── JVM Architecture ─────────────────────────────────────────────────────────

export interface JvmComponent {
  id: string;
  name: string;
  shortName: string;
  color: string;
  bgColor: string;
  borderColor: string;
  description: string;
  details: string[];
  keyFacts: string[];
  relatedComponents: string[];
}

// ─── Memory ───────────────────────────────────────────────────────────────────

export interface MemoryObject {
  id: string;
  name: string;
  type: string;
  size: number;
  color: string;
  isGarbage?: boolean;
  references?: string[];
}

export interface StackFrame {
  id: string;
  methodName: string;
  className: string;
  locals: LocalVariable[];
  returnType: string;
  lineNumber: number;
}

export interface LocalVariable {
  name: string;
  type: string;
  value: string;
  isReference?: boolean;
  refTarget?: string;
}

// ─── Class Loading ────────────────────────────────────────────────────────────

export interface ClassLoaderStep {
  id: number;
  phase: 'Loading' | 'Linking' | 'Initialization';
  subPhase?: string;
  title: string;
  description: string;
  detail: string;
  color: string;
  icon: string;
  codeExample?: string;
}

export interface ClassLoaderInfo {
  name: string;
  type: string;
  description: string;
  loads: string[];
  color: string;
}

// ─── Execution Engine ─────────────────────────────────────────────────────────

export interface ExecutionStep {
  id: number;
  title: string;
  description: string;
  detail: string;
  input: string;
  output: string;
  color: string;
}

export interface JitOptimization {
  name: string;
  description: string;
  before: string;
  after: string;
  speedup: string;
  color: string;
}

// ─── Garbage Collection ───────────────────────────────────────────────────────

export interface GcAlgorithm {
  id: string;
  name: string;
  fullName: string;
  introduced: string;
  type: string;
  description: string;
  howItWorks: string[];
  pros: string[];
  cons: string[];
  useCases: string[];
  color: string;
  pauseType: 'Stop-The-World' | 'Concurrent' | 'Mostly Concurrent';
  throughput: number;
  latency: number;
  memoryOverhead: number;
  flag: string;
}

export interface MemoryRegion {
  id: string;
  name: string;
  color: string;
  percentage: number;
  description: string;
}

// ─── Threads ──────────────────────────────────────────────────────────────────

export interface ThreadInfo {
  id: string;
  name: string;
  state: 'NEW' | 'RUNNABLE' | 'BLOCKED' | 'WAITING' | 'TIMED_WAITING' | 'TERMINATED';
  color: string;
  stackFrames: string[];
  priority: number;
  isDaemon: boolean;
  description: string;
}

export type LockState = 'unlocked' | 'locked' | 'contested';

export interface MonitorLock {
  id: string;
  objectName: string;
  holder: string | null;
  waiters: string[];
  state: LockState;
}

// ─── Java Memory Model ────────────────────────────────────────────────────────

export interface JmmConcept {
  id: string;
  title: string;
  description: string;
  detail: string;
  codeExample: string;
  color: string;
  icon: string;
}

export interface HappensBefore {
  from: string;
  to: string;
  rule: string;
}

// ─── Interview Questions ──────────────────────────────────────────────────────

export type QuestionDifficulty = 'Beginner' | 'Intermediate' | 'Advanced';
export type QuestionCategory =
  | 'Architecture'
  | 'Memory'
  | 'Class Loading'
  | 'Garbage Collection'
  | 'Threads'
  | 'Performance'
  | 'JIT'
  | 'Java Memory Model'
  | 'Virtual Threads'
  | 'Profiling'
  | 'JVM Internals';

export interface InterviewQuestion {
  id: string;
  question: string;
  answer: string;
  keyPoints: string[];
  difficulty: QuestionDifficulty;
  category: QuestionCategory;
  followUps?: string[];
  codeExample?: string;
}

// ─── Roadmap ──────────────────────────────────────────────────────────────────

export interface RoadmapItem {
  id: number;
  title: string;
  description: string;
  href: string;
  color: string;
  icon: string;
  topics: string[];
  level: 'Foundational' | 'Intermediate' | 'Advanced';
}
