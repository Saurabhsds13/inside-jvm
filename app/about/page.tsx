import { Metadata } from 'next';
import Link from 'next/link';
import { Cpu, Github, ExternalLink, BookOpen, Zap, Users, Code2, ArrowRight } from 'lucide-react';
import GlassCard from '@/components/ui/GlassCard';
import AnimatedSection from '@/components/ui/AnimatedSection';
import { StaggerContainer, StaggerItem } from '@/components/ui/AnimatedSection';

export const metadata: Metadata = {
  title: 'About',
  description: 'About InsideJVM — the interactive JVM learning platform built to make Java internals accessible to every developer.',
};

const techStack = [
  { name: 'Next.js 14', desc: 'App Router, static export', color: '#ffffff' },
  { name: 'TypeScript', desc: 'Type-safe throughout', color: '#3B82F6' },
  { name: 'Tailwind CSS', desc: 'Utility-first styling', color: '#06B6D4' },
  { name: 'Framer Motion', desc: 'Animations & transitions', color: '#EC4899' },
  { name: 'React Flow', desc: 'Interactive diagrams', color: '#10B981' },
  { name: 'Radix UI', desc: 'Accessible primitives', color: '#8B5CF6' },
  { name: 'Lucide React', desc: 'Icon library', color: '#F59E0B' },
  { name: 'GitHub Pages', desc: 'Static hosting', color: '#64748b' },
];

const references = [
  { title: 'The Java Virtual Machine Specification', org: 'Oracle / OpenJDK', href: 'https://docs.oracle.com/javase/specs/jvms/se21/html/index.html' },
  { title: 'The Garbage Collection Handbook', org: 'Jones, Hosking & Moss', href: 'https://gchandbook.org/' },
  { title: 'HotSpot Internals Wiki', org: 'OpenJDK', href: 'https://wiki.openjdk.org/display/HotSpot' },
  { title: 'JEP Index', org: 'OpenJDK', href: 'https://openjdk.org/jeps/0' },
  { title: 'Java Memory Model (JSR-133)', org: 'Oracle', href: 'https://www.cs.umd.edu/~pugh/java/memoryModel/' },
  { title: 'ZGC — A Scalable Low-Latency GC', org: 'Stefan Karlsson', href: 'https://malloc.se/blog/zgc-jdk16' },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative pt-28 pb-16 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[250px] opacity-15 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, #8B5CF6 0%, transparent 70%)' }} />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <div className="flex items-center gap-4 mb-8">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl opacity-90" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -inset-1 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl blur opacity-30" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">About InsideJVM</h1>
                <p className="text-slate-400 mt-1">Interactive JVM Learning Platform</p>
                <p className="text-sm text-slate-500 mt-1">
                  Built by{' '}
                  <a
                    href="https://github.com/Saurabhsds13"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
                  >
                    Saurabh Sonawane
                  </a>
                </p>
              </div>
            </div>

            <div className="space-y-4 text-slate-400 text-base leading-relaxed max-w-2xl">
              <p>
                InsideJVM was built with a simple premise: <strong className="text-slate-200">JVM internals should be learnable through interaction, not memorization</strong>.
                Most resources present JVM concepts as static text and diagrams. We built something different.
              </p>
              <p>
                Every page is a live simulation. Click nodes in the architecture diagram, trigger GC cycles,
                watch stack frames push and pop, step through class loading phases — all in your browser,
                with accurate JVM terminology backed by the official specification.
              </p>
              <p>
                Whether you&apos;re preparing for a senior Java engineering interview or just curious about
                what happens between <code className="text-blue-400">javac</code> and your code running on the CPU,
                InsideJVM gives you the depth to truly understand it.
              </p>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-24 space-y-12">

        {/* Goals */}
        <AnimatedSection>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Design Principles</h2>
            <StaggerContainer className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Zap, title: 'Interactive First', desc: 'No concept is explained with text alone. Every topic has an accompanying simulation, animation, or interactive diagram.', color: '#F59E0B' },
                { icon: BookOpen, title: 'Specification Accurate', desc: 'All terminology and behavior descriptions reference the JVM Specification and OpenJDK source. No simplified misconceptions.', color: '#3B82F6' },
                { icon: Code2, title: 'Production Code Quality', desc: 'TypeScript throughout, clean architecture, SOLID principles, reusable components — built the way a senior engineer would.', color: '#10B981' },
                { icon: Users, title: 'Interview Ready', desc: '18+ Q&As with full answers, key points, follow-up questions, and code examples — exactly what senior Java interviews test.', color: '#8B5CF6' },
              ].map(({ icon: Icon, title, desc, color }) => (
                <StaggerItem key={title}>
                  <div className="flex items-start gap-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${color}20`, border: `1px solid ${color}40` }}
                    >
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
                      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </GlassCard>
        </AnimatedSection>

        {/* Tech stack */}
        <AnimatedSection delay={0.1}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">Technology Stack</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {techStack.map((t) => (
                <div
                  key={t.name}
                  className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5 hover:border-white/[0.12] transition-all"
                >
                  <div className="w-2 h-2 rounded-full mb-2" style={{ backgroundColor: t.color }} />
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{t.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* References */}
        <AnimatedSection delay={0.15}>
          <GlassCard className="p-6">
            <h2 className="text-lg font-bold text-white mb-5">References & Sources</h2>
            <p className="text-sm text-slate-500 mb-5">All content is based on official specifications and authoritative sources. No AI-generated hallucinations — every claim is grounded in the JVM spec or OpenJDK documentation.</p>
            <div className="space-y-2">
              {references.map((r) => (
                <a
                  key={r.href}
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12] hover:bg-white/[0.04] transition-all group"
                >
                  <div>
                    <p className="text-sm font-medium text-white group-hover:text-blue-300 transition-colors">{r.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{r.org}</p>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                </a>
              ))}
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* Open Source */}
        <AnimatedSection delay={0.2}>
          <GlassCard className="p-6">
            <div className="flex items-start gap-4">
              <Github className="w-6 h-6 text-white shrink-0 mt-0.5" />
              <div>
                <h2 className="text-lg font-bold text-white mb-2">Open Source</h2>
                <p className="text-sm text-slate-400 leading-relaxed mb-4">
                  InsideJVM is open source and deployed on GitHub Pages. Found a mistake, want to add a topic,
                  or improve an animation? Contributions are welcome.
                </p>
                <a
                  href="https://github.com/Saurabhsds13/inside-jvm"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm text-white hover:bg-white/[0.1] transition-all"
                >
                  <Github className="w-4 h-4" />
                  View on GitHub
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </div>
            </div>
          </GlassCard>
        </AnimatedSection>

        {/* CTA */}
        <AnimatedSection delay={0.25}>
          <div className="text-center rounded-2xl border border-white/[0.06] bg-gradient-to-br from-blue-900/20 via-purple-900/15 to-background p-10">
            <h3 className="text-2xl font-bold text-white mb-3">Start exploring</h3>
            <p className="text-slate-400 mb-6">Pick any topic and start building your mental model of the JVM.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/architecture" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold hover:from-blue-500 hover:to-purple-500 transition-all">
                JVM Architecture <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/interview" className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-white/[0.1] text-white text-sm font-semibold hover:bg-white/[0.06] transition-all">
                Interview Prep
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </div>
  );
}
