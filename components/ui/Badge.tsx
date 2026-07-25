import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'blue' | 'purple' | 'cyan' | 'green' | 'orange' | 'red' | 'pink' | 'slate';
  size?: 'sm' | 'md';
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: 'border-white/10 bg-white/[0.05] text-slate-300',
  blue: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
  purple: 'border-purple-500/30 bg-purple-500/10 text-purple-400',
  cyan: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  green: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  orange: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
  red: 'border-red-500/30 bg-red-500/10 text-red-400',
  pink: 'border-pink-500/30 bg-pink-500/10 text-pink-400',
  slate: 'border-slate-500/30 bg-slate-500/10 text-slate-400',
};

const sizeStyles: Record<string, string> = {
  sm: 'px-2 py-0.5 text-[10px]',
  md: 'px-2.5 py-1 text-xs',
};

export default function Badge({ children, variant = 'default', size = 'md', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
