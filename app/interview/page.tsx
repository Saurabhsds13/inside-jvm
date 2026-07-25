'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, ChevronDown, Search, Filter, BookOpen, Code2 } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import PageHeader from '@/components/layout/PageHeader';
import AnimatedSection from '@/components/ui/AnimatedSection';
import Badge from '@/components/ui/Badge';
import CodeBlock from '@/components/ui/CodeBlock';
import { interviewQuestions } from '@/data/interview-questions';
import type { QuestionDifficulty, QuestionCategory } from '@/types';

const DIFFICULTY_COLORS: Record<QuestionDifficulty, string> = {
  Beginner: 'green',
  Intermediate: 'orange',
  Advanced: 'red',
};

const CATEGORY_COLORS: Record<QuestionCategory, string> = {
  Architecture: 'blue',
  Memory: 'purple',
  'Class Loading': 'cyan',
  'Garbage Collection': 'orange',
  Threads: 'pink',
  Performance: 'green',
  JIT: 'green',
  'Java Memory Model': 'red',
};

const DIFFICULTIES: QuestionDifficulty[] = ['Beginner', 'Intermediate', 'Advanced'];
const CATEGORIES: QuestionCategory[] = [
  'Architecture', 'Memory', 'Class Loading', 'Garbage Collection',
  'Threads', 'Performance', 'JIT', 'Java Memory Model',
];

export default function InterviewPage() {
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<QuestionDifficulty | 'All'>('All');
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | 'All'>('All');
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return interviewQuestions.filter((q) => {
      const matchSearch =
        !search ||
        q.question.toLowerCase().includes(search.toLowerCase()) ||
        q.answer.toLowerCase().includes(search.toLowerCase()) ||
        q.category.toLowerCase().includes(search.toLowerCase());
      const matchDiff = selectedDifficulty === 'All' || q.difficulty === selectedDifficulty;
      const matchCat = selectedCategory === 'All' || q.category === selectedCategory;
      return matchSearch && matchDiff && matchCat;
    });
  }, [search, selectedDifficulty, selectedCategory]);

  const stats = {
    total: interviewQuestions.length,
    beginner: interviewQuestions.filter((q) => q.difficulty === 'Beginner').length,
    intermediate: interviewQuestions.filter((q) => q.difficulty === 'Intermediate').length,
    advanced: interviewQuestions.filter((q) => q.difficulty === 'Advanced').length,
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        badge="Interview Preparation"
        title="JVM Interview"
        titleHighlight="Questions"
        description="18+ curated Q&As covering all JVM topics from beginner to advanced. Written for engineering interviews at top tech companies."
        icon={MessageSquare}
        iconColor="#8B5CF6"
        gradient="from-violet-400 via-purple-400 to-indigo-400"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-8">

        {/* Stats */}
        <AnimatedSection>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Total', value: stats.total, color: '#8B5CF6' },
              { label: 'Beginner', value: stats.beginner, color: '#10B981' },
              { label: 'Intermediate', value: stats.intermediate, color: '#F59E0B' },
              { label: 'Advanced', value: stats.advanced, color: '#EF4444' },
            ].map((s) => (
              <GlassCard key={s.label} className="p-4 text-center">
                <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </GlassCard>
            ))}
          </div>
        </AnimatedSection>

        {/* Filters */}
        <AnimatedSection delay={0.05}>
          <GlassCard className="p-4 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all"
              />
            </div>

            {/* Difficulty filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Filter className="w-3 h-3" /> Difficulty:
              </span>
              {(['All', ...DIFFICULTIES] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setSelectedDifficulty(d)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                    selectedDifficulty === d
                      ? 'bg-purple-600/20 border-purple-500/40 text-purple-400'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.15]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-slate-500 flex items-center gap-1.5">
                <Filter className="w-3 h-3" /> Category:
              </span>
              {(['All', ...CATEGORIES] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all border ${
                    selectedCategory === c
                      ? 'bg-purple-600/20 border-purple-500/40 text-purple-400'
                      : 'bg-white/[0.02] border-white/[0.06] text-slate-400 hover:border-white/[0.15]'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="text-white font-medium">{filtered.length}</span> of {stats.total} questions
          </p>
          {(selectedDifficulty !== 'All' || selectedCategory !== 'All' || search) && (
            <button
              onClick={() => { setSearch(''); setSelectedDifficulty('All'); setSelectedCategory('All'); }}
              className="text-xs text-slate-500 hover:text-white transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Questions */}
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <GlassCard className="p-12 text-center">
              <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">No questions match your filters.</p>
            </GlassCard>
          ) : (
            filtered.map((q, i) => {
              const isOpen = openId === q.id;
              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.4) }}
                >
                  <GlassCard
                    className={`overflow-hidden transition-all duration-300 ${isOpen ? 'border-purple-500/30' : ''}`}
                  >
                    {/* Question header */}
                    <button
                      onClick={() => setOpenId(isOpen ? null : q.id)}
                      className="w-full text-left p-5 flex items-start gap-4"
                    >
                      <span className="text-xs font-mono text-slate-600 mt-0.5 shrink-0 w-6">{q.id.replace('q', '')}.</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge variant={DIFFICULTY_COLORS[q.difficulty] as any} size="sm">
                            {q.difficulty}
                          </Badge>
                          <Badge variant={CATEGORY_COLORS[q.category] as any} size="sm">
                            {q.category}
                          </Badge>
                          {q.codeExample && (
                            <Badge variant="slate" size="sm">
                              <Code2 className="w-2.5 h-2.5 mr-1" />
                              Code
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm font-medium text-white leading-snug">{q.question}</p>
                      </div>
                      <motion.div
                        animate={{ rotate: isOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="shrink-0 mt-0.5"
                      >
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </motion.div>
                    </button>

                    {/* Answer */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 border-t border-white/[0.06] pt-4 space-y-4">
                            {/* Answer text */}
                            <p className="text-sm text-slate-300 leading-relaxed">{q.answer}</p>

                            {/* Key points */}
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                                <span className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Key Points</span>
                              </div>
                              <ul className="space-y-1.5">
                                {q.keyPoints.map((point, j) => (
                                  <li key={j} className="flex items-start gap-2 text-xs text-slate-400">
                                    <span className="text-purple-500 mt-0.5 shrink-0">•</span>
                                    {point}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Code example */}
                            {q.codeExample && (
                              <CodeBlock
                                code={q.codeExample}
                                language="java"
                                title="Code Example"
                              />
                            )}

                            {/* Follow-up questions */}
                            {q.followUps && q.followUps.length > 0 && (
                              <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                                <p className="text-xs font-semibold text-slate-400 mb-2.5 uppercase tracking-wider">Follow-up Questions</p>
                                <ul className="space-y-1.5">
                                  {q.followUps.map((fu, j) => (
                                    <li key={j} className="text-xs text-slate-500 flex items-start gap-2">
                                      <span className="text-slate-600 shrink-0">→</span>
                                      {fu}
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
            })
          )}
        </div>
      </div>
    </div>
  );
}
