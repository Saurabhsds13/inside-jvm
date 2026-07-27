'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, ChevronDown, Search, Filter, BookOpen, Code2,
  Play, RotateCcw, CheckCircle2, XCircle, Clock, Zap, Target,
  ChevronRight, Trophy, Brain, SkipForward, Eye, EyeOff,
  TrendingUp, AlertCircle, Star,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import Badge from '@/components/ui/Badge';
import CodeBlock from '@/components/ui/CodeBlock';
import { interviewQuestions } from '@/data/interview-questions';
import type { QuestionDifficulty, QuestionCategory, InterviewQuestion } from '@/types';

// ── Types ─────────────────────────────────────────────────────────────────────

type Rating = 'easy' | 'hard' | 'skip';
type Mode = 'study' | 'quiz';

interface QuizResult {
  questionId: string;
  rating: Rating;
  timeSpent: number; // seconds
  revealed: boolean;
}

interface QuizSession {
  results: QuizResult[];
  startedAt: number;
  finishedAt?: number;
}

interface StoredProgress {
  hardIds: string[];    // questions rated hard — resurface first
  easyIds: string[];
  skipIds: string[];
  lastSession?: QuizSession;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const DIFFICULTY_COLORS: Record<QuestionDifficulty, string> = {
  Beginner: 'green', Intermediate: 'orange', Advanced: 'red',
};
const CATEGORY_COLORS: Record<QuestionCategory, string> = {
  Architecture: 'blue', Memory: 'purple', 'Class Loading': 'cyan',
  'Garbage Collection': 'orange', Threads: 'pink',
  Performance: 'green', JIT: 'green', 'Java Memory Model': 'red',
  'Virtual Threads': 'green', Profiling: 'cyan', 'JVM Internals': 'purple',
};
const DIFFICULTIES: QuestionDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
const CATEGORIES: QuestionCategory[] = [
  'Architecture', 'Memory', 'Class Loading', 'Garbage Collection',
  'Threads', 'Performance', 'JIT', 'Java Memory Model',
];
const STORAGE_KEY = 'insidejvm_quiz_progress';
const QUIZ_TIME = 90; // seconds per question

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadProgress(): StoredProgress {
  if (typeof window === 'undefined') return { hardIds: [], easyIds: [], skipIds: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : { hardIds: [], easyIds: [], skipIds: [] };
  } catch { return { hardIds: [], easyIds: [], skipIds: [] }; }
}

function saveProgress(p: StoredProgress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}

function buildQuizQueue(questions: InterviewQuestion[], progress: StoredProgress): InterviewQuestion[] {
  // Hard questions first, then unanswered, then easy
  const hard = questions.filter(q => progress.hardIds.includes(q.id));
  const unanswered = questions.filter(
    q => !progress.hardIds.includes(q.id) && !progress.easyIds.includes(q.id) && !progress.skipIds.includes(q.id)
  );
  const easy = questions.filter(q => progress.easyIds.includes(q.id));
  return [...hard, ...unanswered, ...easy];
}

// ── Timer hook ────────────────────────────────────────────────────────────────

function useTimer(active: boolean, initial: number, onExpire: () => void) {
  const [seconds, setSeconds] = useState(initial);
  const expireRef = useRef(onExpire);
  expireRef.current = onExpire;

  useEffect(() => {
    setSeconds(initial);
  }, [initial]);

  useEffect(() => {
    if (!active) return;
    if (seconds <= 0) { expireRef.current(); return; }
    const id = setInterval(() => setSeconds(s => s - 1), 1000);
    return () => clearInterval(id);
  }, [active, seconds]);

  return seconds;
}

// ── Quiz Card Component ───────────────────────────────────────────────────────

interface QuizCardProps {
  question: InterviewQuestion;
  index: number;
  total: number;
  progress: StoredProgress;
  onRate: (rating: Rating, timeSpent: number, revealed: boolean) => void;
}

function QuizCard({ question, index, total, progress, onRate }: QuizCardProps) {
  const [revealed, setRevealed] = useState(false);
  const [startTime] = useState(Date.now());
  const [timerActive, setTimerActive] = useState(true);

  const handleExpire = useCallback(() => {
    setTimerActive(false);
    setRevealed(true);
  }, []);

  const seconds = useTimer(timerActive, QUIZ_TIME, handleExpire);

  const handleRate = (rating: Rating) => {
    const timeSpent = Math.round((Date.now() - startTime) / 1000);
    onRate(rating, timeSpent, revealed);
  };

  const prevRating = progress.hardIds.includes(question.id)
    ? 'hard' : progress.easyIds.includes(question.id)
    ? 'easy' : progress.skipIds.includes(question.id)
    ? 'skip' : null;

  const timerPct = (seconds / QUIZ_TIME) * 100;
  const timerColor = seconds > 30 ? '#10B981' : seconds > 15 ? '#F59E0B' : '#EF4444';

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.3 }}
    >
      <GlassCard className="overflow-hidden">
        {/* Progress bar + timer */}
        <div className="px-5 pt-4 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 font-mono">
              Question <span className="text-white font-bold">{index + 1}</span> / {total}
            </span>
            <div className="flex items-center gap-2">
              {prevRating && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                  prevRating === 'easy' ? 'border-green-500/40 bg-green-500/10 text-green-400' :
                  prevRating === 'hard' ? 'border-red-500/40 bg-red-500/10 text-red-400' :
                  'border-slate-500/40 bg-slate-500/10 text-slate-400'
                }`}>
                  Previously: {prevRating}
                </span>
              )}
              <div className="flex items-center gap-1.5" style={{ color: timerColor }}>
                <Clock className="w-3.5 h-3.5" />
                <span className="text-sm font-bold font-mono w-6 text-right">{seconds}</span>
              </div>
            </div>
          </div>
          {/* Timer bar */}
          <div className="h-1 bg-white/[0.05] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full transition-colors duration-1000"
              style={{ width: `${timerPct}%`, backgroundColor: timerColor }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>
          {/* Question progress dots */}
          <div className="flex gap-1 mt-2 overflow-hidden">
            {Array.from({ length: Math.min(total, 20) }).map((_, i) => (
              <div key={i} className={`h-0.5 flex-1 rounded-full transition-all ${
                i < index ? 'bg-purple-500' : i === index ? 'bg-white' : 'bg-white/[0.1]'
              }`} />
            ))}
          </div>
        </div>

        {/* Question */}
        <div className="p-5">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant={DIFFICULTY_COLORS[question.difficulty] as any} size="sm">
              {question.difficulty}
            </Badge>
            <Badge variant={CATEGORY_COLORS[question.category] as any} size="sm">
              {question.category}
            </Badge>
            {question.codeExample && (
              <Badge variant="slate" size="sm"><Code2 className="w-2.5 h-2.5 mr-1" />Code</Badge>
            )}
          </div>
          <p className="text-base font-semibold text-white leading-snug mb-5">{question.question}</p>

          {/* Reveal toggle */}
          {!revealed ? (
            <button
              onClick={() => { setRevealed(true); setTimerActive(false); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20 transition-all text-sm font-medium"
            >
              <Eye className="w-4 h-4" /> Reveal Answer
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4">
                  <p className="text-sm text-slate-300 leading-relaxed">{question.answer}</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Key Points</span>
                  </div>
                  <ul className="space-y-1.5">
                    {question.keyPoints.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                        <span className="text-purple-500 mt-0.5 shrink-0">•</span>{pt}
                      </li>
                    ))}
                  </ul>
                </div>

                {question.codeExample && (
                  <CodeBlock code={question.codeExample} language="java" title="Code Example" />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Rating buttons */}
        <div className="px-5 pb-5 pt-2 border-t border-white/[0.06]">
          <p className="text-xs text-slate-500 mb-3 text-center">How well did you know this?</p>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleRate('easy')}
              className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-xs font-semibold">Easy</span>
              <span className="text-[10px] text-green-600">Got it right</span>
            </button>
            <button
              onClick={() => handleRate('hard')}
              className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"
            >
              <XCircle className="w-5 h-5" />
              <span className="text-xs font-semibold">Hard</span>
              <span className="text-[10px] text-red-600">Need practice</span>
            </button>
            <button
              onClick={() => handleRate('skip')}
              className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl border border-slate-500/40 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-all"
            >
              <SkipForward className="w-5 h-5" />
              <span className="text-xs font-semibold">Skip</span>
              <span className="text-[10px] text-slate-600">Review later</span>
            </button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ── Summary Screen ────────────────────────────────────────────────────────────

interface SummaryProps {
  session: QuizSession;
  questions: InterviewQuestion[];
  progress: StoredProgress;
  onRestart: () => void;
  onReviewHard: () => void;
}

function QuizSummary({ session, questions, progress, onRestart, onReviewHard }: SummaryProps) {
  const easy = session.results.filter(r => r.rating === 'easy').length;
  const hard = session.results.filter(r => r.rating === 'hard').length;
  const skipped = session.results.filter(r => r.rating === 'skip').length;
  const total = session.results.length;
  const avgTime = Math.round(session.results.reduce((a, r) => a + r.timeSpent, 0) / total);
  const score = Math.round((easy / total) * 100);
  const duration = session.finishedAt ? Math.round((session.finishedAt - session.startedAt) / 1000) : 0;

  const grade = score >= 80 ? { label: 'MAANG Ready', color: '#10B981', icon: '🏆' }
    : score >= 60 ? { label: 'Getting There', color: '#F59E0B', icon: '📈' }
    : { label: 'Keep Practicing', color: '#EF4444', icon: '💪' };

  const hardQuestions = session.results
    .filter(r => r.rating === 'hard')
    .map(r => questions.find(q => q.id === r.questionId))
    .filter(Boolean) as InterviewQuestion[];

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.35 }}>
      <GlassCard className="overflow-hidden">
        {/* Header */}
        <div className="p-8 text-center border-b border-white/[0.06]">
          <div className="text-5xl mb-3">{grade.icon}</div>
          <h2 className="text-2xl font-bold text-white mb-1">{grade.label}</h2>
          <p className="text-slate-400 text-sm">Quiz complete — {total} questions in {Math.floor(duration / 60)}m {duration % 60}s</p>

          {/* Score ring */}
          <div className="flex justify-center mt-6">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                <motion.circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={grade.color} strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - score / 100) }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-white">{score}%</span>
                <span className="text-[10px] text-slate-500">Score</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-white/[0.06]">
          {[
            { icon: CheckCircle2, label: 'Easy', value: easy, color: '#10B981' },
            { icon: XCircle, label: 'Hard', value: hard, color: '#EF4444' },
            { icon: SkipForward, label: 'Skipped', value: skipped, color: '#64748b' },
            { icon: Clock, label: 'Avg Time', value: `${avgTime}s`, color: '#8B5CF6' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="p-5 text-center">
              <Icon className="w-5 h-5 mx-auto mb-1.5" style={{ color }} />
              <div className="text-xl font-bold text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Hard questions list */}
        {hardQuestions.length > 0 && (
          <div className="p-5 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-semibold text-white">Questions to Review</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 ml-auto">
                {hardQuestions.length} hard
              </span>
            </div>
            <div className="space-y-2">
              {hardQuestions.map(q => (
                <div key={q.id} className="flex items-start gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/05">
                  <XCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-300 leading-relaxed">{q.question}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress persistence note */}
        <div className="px-5 pb-2 flex items-center gap-2 text-xs text-slate-600">
          <Brain className="w-3.5 h-3.5" />
          Your ratings are saved. Hard questions will appear first in your next quiz.
        </div>

        {/* Actions */}
        <div className="p-5 pt-3 flex flex-wrap gap-3 border-t border-white/[0.06]">
          {hardQuestions.length > 0 && (
            <button
              onClick={onReviewHard}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 transition-all text-sm font-medium"
            >
              <XCircle className="w-4 h-4" /> Retry Hard Questions ({hard})
            </button>
          )}
          <button
            onClick={onRestart}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-500 hover:to-blue-500 transition-all text-sm font-semibold"
          >
            <RotateCcw className="w-4 h-4" /> New Quiz
          </button>
        </div>
      </GlassCard>
    </motion.div>
  );
}

// ── Quiz Setup Screen ─────────────────────────────────────────────────────────

interface QuizSetupProps {
  progress: StoredProgress;
  onStart: (questions: InterviewQuestion[]) => void;
}

function QuizSetup({ progress, onStart }: QuizSetupProps) {
  const [difficulty, setDifficulty] = useState<QuestionDifficulty | 'All'>('All');
  const [category, setCategory] = useState<QuestionCategory | 'All'>('All');
  const [count, setCount] = useState(10);

  const pool = useMemo(() => {
    const filtered = interviewQuestions.filter(q => {
      const d = difficulty === 'All' || q.difficulty === difficulty;
      const c = category === 'All' || q.category === category;
      return d && c;
    });
    return buildQuizQueue(filtered, progress);
  }, [difficulty, category, progress]);

  const hardCount = pool.filter(q => progress.hardIds.includes(q.id)).length;

  return (
    <GlassCard className="p-6 max-w-xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center">
          <Target className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Configure Quiz</h2>
          <p className="text-xs text-slate-500">{pool.length} questions match your filters</p>
        </div>
      </div>

      {hardCount > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-red-500/20 bg-red-500/07 mb-5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <p className="text-xs text-slate-300">
            <span className="text-red-400 font-semibold">{hardCount} hard questions</span> from last session will appear first.
          </p>
        </div>
      )}

      {/* Difficulty */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Difficulty</label>
        <div className="flex flex-wrap gap-2">
          {(['All', ...DIFFICULTIES] as const).map(d => (
            <button key={d} onClick={() => setDifficulty(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                difficulty === d ? 'bg-purple-600/20 border-purple-500/40 text-purple-400' : 'border-white/[0.08] text-slate-400 hover:border-white/[0.2]'
              }`}>{d}</button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="mb-5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          {(['All', ...CATEGORIES] as const).map(c => (
            <button key={c} onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                category === c ? 'bg-purple-600/20 border-purple-500/40 text-purple-400' : 'border-white/[0.08] text-slate-400 hover:border-white/[0.2]'
              }`}>{c}</button>
          ))}
        </div>
      </div>

      {/* Count slider */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Questions</label>
          <span className="text-sm font-bold text-white">{Math.min(count, pool.length)}</span>
        </div>
        <input type="range" min={5} max={Math.min(pool.length, 18)} value={count}
          onChange={e => setCount(Number(e.target.value))}
          className="w-full accent-purple-500"
        />
        <div className="flex justify-between text-[10px] text-slate-600 mt-1">
          <span>5</span><span>{Math.min(18, pool.length)}</span>
        </div>
      </div>

      <button
        disabled={pool.length === 0}
        onClick={() => onStart(pool.slice(0, count))}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 transition-all"
      >
        <Play className="w-4 h-4" /> Start Quiz
      </button>
      <p className="text-center text-[10px] text-slate-600 mt-3 flex items-center justify-center gap-1.5">
        <Clock className="w-3 h-3" /> {QUIZ_TIME}s per question · ratings saved locally
      </p>
    </GlassCard>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function InterviewPage() {
  const [mode, setMode] = useState<Mode>('study');

  // Study mode state
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestionDifficulty | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'All'>('All');
  const [openId, setOpenId] = useState<string | null>(null);

  // Quiz state
  type QuizPhase = 'setup' | 'active' | 'summary';
  const [quizPhase, setQuizPhase] = useState<QuizPhase>('setup');
  const [quizQueue, setQuizQueue] = useState<InterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [session, setSession] = useState<QuizSession>({ results: [], startedAt: Date.now() });
  const [progress, setProgress] = useState<StoredProgress>({ hardIds: [], easyIds: [], skipIds: [] });

  useEffect(() => { setProgress(loadProgress()); }, []);

  const updateProgress = (id: string, rating: Rating) => {
    setProgress(prev => {
      const next: StoredProgress = {
        hardIds: prev.hardIds.filter(x => x !== id),
        easyIds: prev.easyIds.filter(x => x !== id),
        skipIds: prev.skipIds.filter(x => x !== id),
        lastSession: prev.lastSession,
      };
      if (rating === 'hard') next.hardIds.push(id);
      else if (rating === 'easy') next.easyIds.push(id);
      else next.skipIds.push(id);
      saveProgress(next);
      return next;
    });
  };

  const handleRate = (rating: Rating, timeSpent: number, revealed: boolean) => {
    const q = quizQueue[currentIdx];
    updateProgress(q.id, rating);
    const result: QuizResult = { questionId: q.id, rating, timeSpent, revealed };
    const newResults = [...session.results, result];

    if (currentIdx < quizQueue.length - 1) {
      setSession(s => ({ ...s, results: newResults }));
      setCurrentIdx(i => i + 1);
    } else {
      const finished = { ...session, results: newResults, finishedAt: Date.now() };
      setSession(finished);
      setProgress(prev => { const n = { ...prev, lastSession: finished }; saveProgress(n); return n; });
      setQuizPhase('summary');
    }
  };

  const startQuiz = (questions: InterviewQuestion[]) => {
    setQuizQueue(questions);
    setCurrentIdx(0);
    setSession({ results: [], startedAt: Date.now() });
    setQuizPhase('active');
  };

  const retryHard = () => {
    const hardQs = buildQuizQueue(
      interviewQuestions.filter(q => progress.hardIds.includes(q.id)),
      progress
    );
    if (hardQs.length > 0) startQuiz(hardQs);
  };

  const resetQuiz = () => { setQuizPhase('setup'); setCurrentIdx(0); };

  const clearProgress = () => {
    const reset: StoredProgress = { hardIds: [], easyIds: [], skipIds: [] };
    saveProgress(reset);
    setProgress(reset);
  };

  const stats = {
    total: interviewQuestions.length,
    beginner: interviewQuestions.filter(q => q.difficulty === 'Beginner').length,
    intermediate: interviewQuestions.filter(q => q.difficulty === 'Intermediate').length,
    advanced: interviewQuestions.filter(q => q.difficulty === 'Advanced').length,
  };

  const filtered = useMemo(() =>
    interviewQuestions.filter(q => {
      const ms = !search || q.question.toLowerCase().includes(search.toLowerCase()) || q.category.toLowerCase().includes(search.toLowerCase());
      const md = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
      const mc = selectedCategory === 'All' || q.category === selectedCategory;
      return ms && md && mc;
    }), [search, selectedDifficulty, selectedCategory]);

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Interview Preparation"
        title="JVM Interview"
        titleHighlight="Questions"
        description="Study mode for reference or Quiz mode for MAANG-level timed practice with spaced repetition."
        icon={MessageSquare}
        iconColor="#8B5CF6"
        gradient="from-violet-400 via-purple-400 to-indigo-400"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-6">

        {/* Mode toggle */}
        <AnimatedSection>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.08] gap-1">
              <button onClick={() => setMode('study')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'study' ? 'bg-white/[0.1] text-white' : 'text-slate-400 hover:text-white'
                }`}>
                <BookOpen className="w-4 h-4" /> Study
              </button>
              <button onClick={() => setMode('quiz')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  mode === 'quiz' ? 'bg-purple-600/30 text-purple-300' : 'text-slate-400 hover:text-white'
                }`}>
                <Zap className="w-4 h-4" /> Quiz Mode
              </button>
            </div>
            {mode === 'quiz' && (progress.hardIds.length > 0 || progress.easyIds.length > 0) && (
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs text-slate-500 flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" />
                  <span className="text-green-400">{progress.easyIds.length} easy</span>
                  {' · '}
                  <span className="text-red-400">{progress.hardIds.length} hard</span>
                  {' saved'}
                </span>
                <button onClick={clearProgress} className="text-[10px] text-slate-600 hover:text-slate-400 underline transition-colors">
                  reset
                </button>
              </div>
            )}
          </div>
        </AnimatedSection>

        {/* Stats */}
        <AnimatedSection>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, color: '#8B5CF6' },
              { label: 'Beginner', value: stats.beginner, color: '#10B981' },
              { label: 'Intermediate', value: stats.intermediate, color: '#F59E0B' },
              { label: 'Advanced', value: stats.advanced, color: '#EF4444' },
            ].map(s => (
              <GlassCard key={s.label} className="p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </GlassCard>
            ))}
          </div>
        </AnimatedSection>

        {/* ── QUIZ MODE ── */}
        <AnimatePresence mode="wait">
          {mode === 'quiz' && (
            <motion.div key="quiz" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              {quizPhase === 'setup' && (
                <QuizSetup progress={progress} onStart={startQuiz} />
              )}
              {quizPhase === 'active' && quizQueue[currentIdx] && (
                <div>
                  <QuizCard
                    key={quizQueue[currentIdx].id + currentIdx}
                    question={quizQueue[currentIdx]}
                    index={currentIdx}
                    total={quizQueue.length}
                    progress={progress}
                    onRate={handleRate}
                  />
                  <button onClick={resetQuiz} className="mt-3 flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition-colors mx-auto">
                    <XCircle className="w-3 h-3" /> Exit quiz
                  </button>
                </div>
              )}
              {quizPhase === 'summary' && session.results.length > 0 && (
                <QuizSummary
                  session={session}
                  questions={quizQueue}
                  progress={progress}
                  onRestart={resetQuiz}
                  onReviewHard={retryHard}
                />
              )}
            </motion.div>
          )}

          {/* ── STUDY MODE ── */}
          {mode === 'study' && (
            <motion.div key="study" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">
              {/* Filters */}
              <GlassCard className="p-4 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" placeholder="Search questions..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all"
                  />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5"><Filter className="w-3 h-3" /> Difficulty:</span>
                  {(['All', ...DIFFICULTIES] as const).map(d => (
                    <button key={d} onClick={() => setSelectedDifficulty(d)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${selectedDifficulty === d ? 'bg-purple-600/20 border-purple-500/40 text-purple-400' : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.15]'}`}>
                      {d}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5"><Filter className="w-3 h-3" /> Category:</span>
                  {(['All', ...CATEGORIES] as const).map(c => (
                    <button key={c} onClick={() => setSelectedCategory(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${selectedCategory === c ? 'bg-purple-600/20 border-purple-500/40 text-purple-400' : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.15]'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </GlassCard>

              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">Showing <span className="text-white font-medium">{filtered.length}</span> of {stats.total} questions</p>
                {(selectedDifficulty !== 'All' || selectedCategory !== 'All' || search) && (
                  <button onClick={() => { setSearch(''); setSelectedDifficulty('All'); setSelectedCategory('All'); }} className="text-xs text-slate-500 hover:text-white transition-colors">Clear filters</button>
                )}
              </div>

              <div className="space-y-3">
                {filtered.length === 0 ? (
                  <GlassCard className="p-12 text-center">
                    <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400">No questions match your filters.</p>
                  </GlassCard>
                ) : filtered.map((q, i) => {
                  const isOpen = openId === q.id;
                  const isHard = progress.hardIds.includes(q.id);
                  const isEasy = progress.easyIds.includes(q.id);
                  return (
                    <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.04, 0.4) }}>
                      <GlassCard className={`overflow-hidden transition-all duration-300 ${isOpen ? 'border-purple-500/30' : ''}`}>
                        <button onClick={() => setOpenId(isOpen ? null : q.id)} className="w-full text-left p-5 flex items-start gap-4">
                          <span className="text-xs font-mono text-slate-600 mt-0.5 shrink-0 w-6">{q.id.replace('q', '')}.</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge variant={DIFFICULTY_COLORS[q.difficulty] as any} size="sm">{q.difficulty}</Badge>
                              <Badge variant={CATEGORY_COLORS[q.category] as any} size="sm">{q.category}</Badge>
                              {q.codeExample && <Badge variant="slate" size="sm"><Code2 className="w-2.5 h-2.5 mr-1" />Code</Badge>}
                              {isHard && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400">Hard</span>}
                              {isEasy && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400">Easy</span>}
                            </div>
                            <p className="text-sm font-medium text-white leading-snug">{q.question}</p>
                          </div>
                          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 mt-0.5">
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          </motion.div>
                        </button>
                        <AnimatePresence>
                          {isOpen && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: 'easeInOut' }} className="overflow-hidden">
                              <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4">
                                <p className="text-sm text-slate-300 leading-relaxed">{q.answer}</p>
                                <div>
                                  <div className="flex items-center gap-2 mb-3">
                                    <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                                    <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Key Points</span>
                                  </div>
                                  <ul className="space-y-1.5">
                                    {q.keyPoints.map((pt, j) => (
                                      <li key={j} className="flex items-start gap-2 text-xs text-slate-400">
                                        <span className="text-purple-500 mt-0.5 shrink-0">•</span>{pt}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                                {q.codeExample && <CodeBlock code={q.codeExample} language="java" title="Code Example" />}
                                {q.followUps && q.followUps.length > 0 && (
                                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                                    <p className="text-xs font-semibold text-slate-400 mb-2.5 uppercase tracking-wider">Follow-up Questions</p>
                                    <ul className="space-y-1.5">
                                      {q.followUps.map((fu, j) => (
                                        <li key={j} className="text-xs text-slate-500 flex items-start gap-2">
                                          <span className="text-slate-600 shrink-0">→</span>{fu}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </GlassCard>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
