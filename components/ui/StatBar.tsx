'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface StatBarProps {
  label: string;
  value: number; // 0-100
  color: string;
  className?: string;
  showValue?: boolean;
}

export default function StatBar({ label, value, color, className, showValue = true }: StatBarProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex justify-between items-center">
        <span className="text-xs text-slate-400">{label}</span>
        {showValue && <span className="text-xs font-medium text-slate-300">{value}%</span>}
      </div>
      <div className="h-1.5 bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </div>
  );
}
