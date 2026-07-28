'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Cpu, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { navItems } from '@/data/navigation';

export default function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  // Close everything on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  const primaryNav = navItems.slice(0, 4);
  const secondaryNav = navItems.slice(4);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-[#080e1a]/90 backdrop-blur-xl border-b border-white/[0.06] shadow-xl shadow-black/20'
          : 'bg-transparent'
      )}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-50 transition-opacity" />
            </div>
            <span className="font-bold text-[15px] tracking-tight">
              <span className="text-white">Inside</span>
              <span className="gradient-text">JVM</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {primaryNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm transition-all duration-200',
                  pathname === item.href
                    ? 'text-white bg-white/[0.08]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                )}
              >
                {item.label}
              </Link>
            ))}

            {/* More dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen((v) => !v)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-all duration-200',
                  secondaryNav.some((i) => i.href === pathname)
                    ? 'text-white bg-white/[0.08]'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                )}
              >
                More
                <ChevronDown
                  className={cn('w-3.5 h-3.5 transition-transform duration-200', dropdownOpen && 'rotate-180')}
                />
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-white/[0.1] bg-[#0c1222]/95 backdrop-blur-xl p-1.5 shadow-2xl shadow-black/60"
                  >
                    {secondaryNav.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          'flex flex-col px-3 py-2 rounded-md text-sm transition-all duration-150',
                          pathname === item.href
                            ? 'text-white bg-white/[0.08]'
                            : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                        )}
                      >
                        <span className="font-medium text-[13px]">{item.label}</span>
                        {item.description && (
                          <span className="text-xs text-slate-500 mt-0.5">{item.description}</span>
                        )}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right CTA */}
          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/about"
              className={cn(
                'text-sm transition-colors duration-200',
                pathname === '/about' ? 'text-white' : 'text-slate-400 hover:text-white'
              )}
            >
              About
            </Link>
            <Link
              href="/interview"
              className="px-4 py-1.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 transition-all duration-200 shadow-lg shadow-blue-500/20"
            >
              Interview Prep
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden p-2 rounded-md text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-[#080e1a]/95 backdrop-blur-xl border-b border-white/[0.06] overflow-hidden"
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex flex-col px-3 py-2.5 rounded-lg text-sm transition-all',
                    pathname === item.href
                      ? 'text-white bg-white/[0.08]'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                  )}
                >
                  <span className="font-medium">{item.label}</span>
                  {item.description && <span className="text-xs text-slate-500 mt-0.5">{item.description}</span>}
                </Link>
              ))}
              <Link
                href="/about"
                className="flex px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
              >
                About
              </Link>
              <div className="pt-2 pb-1">
                <Link
                  href="/interview"
                  className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-medium rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  Interview Prep
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
