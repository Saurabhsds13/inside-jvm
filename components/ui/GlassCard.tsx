'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode, forwardRef } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  hover?: boolean;
  glow?: string;
  onClick?: () => void;
  animate?: boolean;
  delay?: number;
  as?: 'div' | 'article' | 'section' | 'li';
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ children, className, style, hover = false, glow, onClick, animate = false, delay = 0 }, ref) => {
    const baseClass = cn(
      'rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm',
      hover && 'cursor-pointer transition-all duration-300 hover:border-white/[0.15] hover:bg-white/[0.05]',
      glow && `hover:shadow-lg`,
      className
    );

    if (animate) {
      return (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5, delay }}
          className={baseClass}
          style={style}
          onClick={onClick}
          whileHover={hover ? { y: -2 } : undefined}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div ref={ref} className={baseClass} style={style} onClick={onClick}>
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
export default GlassCard;
