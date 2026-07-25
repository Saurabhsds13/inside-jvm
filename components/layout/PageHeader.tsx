'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  badge?: string;
  title: string;
  titleHighlight?: string;
  description: string;
  icon?: LucideIcon;
  iconColor?: string;
  gradient?: string;
  children?: React.ReactNode;
}

export default function PageHeader({
  badge,
  title,
  titleHighlight,
  description,
  icon: Icon,
  iconColor = '#3B82F6',
  gradient = 'from-blue-500 via-purple-500 to-cyan-500',
  children,
}: PageHeaderProps) {
  return (
    <section className="relative pt-28 pb-16 overflow-hidden">
      {/* Background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20 blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(ellipse, ${iconColor}40 0%, transparent 70%)` }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl"
        >
          {/* Badge */}
          {badge && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.1] bg-white/[0.04] text-xs font-medium text-slate-400 mb-5"
            >
              {Icon && (
                <span className="flex items-center justify-center w-4 h-4 rounded-sm" style={{ color: iconColor }}>
                  <Icon className="w-3.5 h-3.5" />
                </span>
              )}
              {badge}
            </motion.div>
          )}

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-4 leading-[1.1]"
          >
            {title}{' '}
            {titleHighlight && (
              <span className={cn('bg-gradient-to-r bg-clip-text text-transparent', gradient)}>
                {titleHighlight}
              </span>
            )}
          </motion.h1>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400 leading-relaxed"
          >
            {description}
          </motion.p>

          {children && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mt-6"
            >
              {children}
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  );
}
