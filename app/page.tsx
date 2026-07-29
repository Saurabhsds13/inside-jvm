'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  ArrowRight, Cpu, Layers, Package, Zap, Trash2, GitBranch, Shield,
  MessageSquare, ChevronRight, Star, Code2, BookOpen, Play, SlidersHorizontal,
  Workflow, Activity, Droplets,
} from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedSection, { StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';
import Badge from '@/components/ui/Badge';
import SectionLabel from '@/components/ui/SectionLabel';
import { roadmapItems } from '@/data/roadmap';

const iconMap: Record<string, React.ElementType> = {
  Cpu, Layers, Package, Zap, Trash2, GitBranch, Shield, MessageSquare, Play, Code2,
  SlidersHorizontal, Workflow, Activity, Droplets,
};

const levelColor: Record<string, string> = {
  Foundational: '#3B82F6',
  Intermediate: '#8B5CF6',
  Advanced: '#EF4444',
};

const features = [
  {
    icon: Play,
    title: 'Live Simulations',
    description: 'Interact with real-time visualizations of object allocation, GC cycles, and thread execution — not static diagrams.',
    color: '#3B82F6',
  },
  {
    icon: Layers,
    title: 'Memory Deep Dives',
    description: 'Watch objects move between Eden, Survivor spaces, and Old Gen. Understand exactly when and why GC fires.',
    color: '#8B5CF6',
  },
  {
    icon: Zap,
    title: 'JIT Compilation',
    description: 'See how the HotSpot JIT compiler transforms interpreted bytecode into optimized native machine code.',
    color: '#10B981',
  },
  {
    icon: Code2,
    title: 'Accurate Terminology',
    description: 'Every label, description, and example uses official JVM Specification and OpenJDK terminology.',
    color: '#F59E0B',
  },
  {
    icon: BookOpen,
    title: 'Interview Ready',
    description: '18+ curated Q&A pairs covering beginner to advanced JVM topics — written for engineering interviews.',
    color: '#EC4899',
  },
  {
    icon: GitBranch,
    title: 'Concurrent Execution',
    description: 'Visualize threads competing for monitor locks, the Java Memory Model, and happens-before guarantees.',
    color: '#06B6D4',
  },
];

// Mini JVM diagram for hero
function HeroJvmDiagram() {
  const blocks = [
    { label: 'Class Loader', color: '#3B82F6', delay: 0.1 },
    { label: 'Heap', color: '#8B5CF6', delay: 0.2 },
    { label: 'JVM Stack', color: '#06B6D4', delay: 0.3 },
    { label: 'Exec Engine', color: '#10B981', delay: 0.4 },
    { label: 'GC', color: '#F59E0B', delay: 0.5 },
    { label: 'Metaspace', color: '#EC4899', delay: 0.6 },
  ];

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Outer JVM box */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.3 }}
        className="relative rounded-2xl border border-white/[0.1] bg-white/[0.02] p-5 shadow-2xl"
      >
        {/* Label */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-xs font-mono text-slate-400">Java Virtual Machine</span>
        </div>

        {/* Blocks grid */}
        <div className="grid grid-cols-3 gap-2">
          {blocks.map((b) => (
            <motion.div
              key={b.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: b.delay }}
              className="rounded-lg border flex items-center justify-center p-3 text-[10px] font-semibold text-center cursor-default select-none"
              style={{
                borderColor: `${b.color}40`,
                backgroundColor: `${b.color}12`,
                color: b.color,
              }}
              whileHover={{ scale: 1.05, backgroundColor: `${b.color}22` }}
            >
              {b.label}
            </motion.div>
          ))}
        </div>

        {/* Animated data flow dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-blue-400/70"
            animate={{
              x: [0, 80, 160, 80, 0],
              y: [20, 0, 20, 40, 20],
              opacity: [0, 1, 1, 1, 0],
            }}
            transition={{
              duration: 3,
              delay: i * 1,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{ left: 20, top: 60 }}
          />
        ))}
      </motion.div>

      {/* Glow */}
      <div className="absolute inset-0 -z-10 rounded-2xl blur-3xl opacity-20"
        style={{ background: 'radial-gradient(ellipse, #3B82F6 0%, #8B5CF6 50%, transparent 80%)' }} />
    </div>
  );
}

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  return (
    <div className="overflow-hidden">
      {/* ── Hero ── */}
      <section ref={heroRef} className="relative min-h-screen flex items-center pt-16">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/2 w-64 h-64 bg-cyan-600/8 rounded-full blur-3xl" />
          {/* Grid */}
          <div
            className="absolute inset-0 opacity-[0.025]"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20"
        >
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-xs font-medium text-blue-400 mb-6"
              >
                <Star className="w-3 h-3" />
                Interactive JVM Learning Platform
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05] mb-6"
              >
                <span className="text-white">Inside the</span>
                <br />
                <span className="gradient-text">Java Virtual</span>
                <br />
                <span className="text-white">Machine</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="text-xl text-slate-400 leading-relaxed mb-8 max-w-lg"
              >
                Stop memorizing. Start understanding. Interactive animations and simulations 
                that show exactly how the JVM runs your Java code.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="flex flex-wrap gap-4"
              >
                <Link
                  href="/architecture"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-blue-500/25 text-sm"
                >
                  Explore Architecture
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/interview"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-white/[0.1] bg-white/[0.04] text-white font-semibold hover:bg-white/[0.08] hover:border-white/[0.15] transition-all duration-200 text-sm"
                >
                  Interview Prep
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </Link>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-6 mt-10 text-sm text-slate-500"
              >
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  10 Interactive Topics
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  18+ Interview Q&As
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  Live Simulations
                </div>
              </motion.div>
            </div>

            {/* Right */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <HeroJvmDiagram />
            </motion.div>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-600"
        >
          <div className="w-5 h-8 rounded-full border border-slate-600 flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1 h-2 bg-slate-500 rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <SectionLabel color="#3B82F6" className="mb-4">Why InsideJVM</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">
              Learn by <span className="gradient-text">seeing it happen</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Every concept is backed by an interactive simulation. No lorem ipsum, no hand-wavy explanations —
              just accurate JVM mechanics made visual.
            </p>
          </AnimatedSection>

          <StaggerContainer className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <StaggerItem key={f.title}>
                  <GlassCard hover className="p-6 h-full">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                      style={{ backgroundColor: `${f.color}20`, border: `1px solid ${f.color}40` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: f.color }} />
                    </div>
                    <h3 className="font-semibold text-white mb-2 text-[15px]">{f.title}</h3>
                    <p className="text-sm text-slate-400 leading-relaxed">{f.description}</p>
                  </GlassCard>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      {/* ── Roadmap / Timeline ── */}
      <section className="py-24 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-purple-600/5 rounded-full blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-16">
            <SectionLabel color="#8B5CF6" className="mb-4">Learning Path</SectionLabel>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-3 mb-4">
              Your JVM <span className="gradient-text">mastery roadmap</span>
            </h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Follow this path from JVM fundamentals to advanced internals. Each stop builds on the last.
            </p>
          </AnimatedSection>

          <div className="relative">
            {/* Center line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/40 via-purple-500/40 to-transparent hidden lg:block" />

            <div className="space-y-8 lg:space-y-0">
              {roadmapItems.map((item, idx) => {
                const Icon = iconMap[item.icon] || Cpu;
                const isLeft = idx % 2 === 0;
                return (
                  <AnimatedSection key={item.id} delay={idx * 0.07} className={`lg:flex ${isLeft ? 'lg:justify-start' : 'lg:justify-end'} relative`}>
                    {/* Connector dot */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 top-6 w-3 h-3 rounded-full border-2 border-background hidden lg:block z-10"
                      style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}60` }}
                    />

                    <div className={`lg:w-[45%] ${isLeft ? 'lg:pr-12' : 'lg:pl-12'}`}>
                      <Link href={item.href}>
                        <GlassCard hover className="p-5">
                          <div className="flex items-start gap-4">
                            <div
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                              style={{ backgroundColor: `${item.color}20`, border: `1px solid ${item.color}40` }}
                            >
                              <Icon className="w-5 h-5" style={{ color: item.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-mono text-slate-500">0{item.id}</span>
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                  style={{
                                    color: levelColor[item.level],
                                    backgroundColor: `${levelColor[item.level]}15`,
                                    border: `1px solid ${levelColor[item.level]}30`,
                                  }}
                                >
                                  {item.level}
                                </span>
                              </div>
                              <h3 className="font-semibold text-white text-[15px] mb-1">{item.title}</h3>
                              <p className="text-sm text-slate-400 mb-3 leading-relaxed">{item.description}</p>
                              <div className="flex flex-wrap gap-1.5">
                                {item.topics.map((t) => (
                                  <span key={t} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06] text-slate-500">
                                    {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-600 shrink-0 mt-1" />
                          </div>
                        </GlassCard>
                      </Link>
                    </div>
                  </AnimatedSection>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-background p-12 text-center">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl" />
              </div>
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25">
                  <Cpu className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Ready to understand the JVM?
                </h2>
                <p className="text-slate-400 max-w-lg mx-auto mb-8 text-lg">
                  Start with the architecture overview, then dive as deep as you want. Every page is interactive.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/architecture"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:from-blue-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-blue-500/25"
                  >
                    Start Learning
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/garbage-collection"
                    className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border border-white/[0.1] bg-white/[0.04] text-white font-semibold hover:bg-white/[0.08] transition-all duration-200"
                  >
                    Explore GC
                  </Link>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
