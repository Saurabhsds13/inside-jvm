import Link from 'next/link';
import { Cpu, Github, ExternalLink } from 'lucide-react';
import { navItems } from '@/data/navigation';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const resources = [
    { label: 'JVM Specification', href: 'https://docs.oracle.com/javase/specs/jvms/se21/html/index.html' },
    { label: 'HotSpot Internals', href: 'https://wiki.openjdk.org/display/HotSpot' },
    { label: 'GC Handbook', href: 'https://gchandbook.org/' },
    { label: 'JEP Index', href: 'https://openjdk.org/jeps/0' },
  ];

  return (
    <footer className="border-t border-white/[0.06] bg-[#060b14]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <div className="relative w-8 h-8">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg opacity-80" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Cpu className="w-4 h-4 text-white" />
                </div>
              </div>
              <span className="font-bold text-[15px]">
                <span className="text-white">Inside</span>
                <span className="gradient-text">JVM</span>
              </span>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">
              The most interactive JVM learning platform. Understand how Java really works — under the hood.
            </p>
            <a
              href="https://github.com/Saurabh-2003/inside-jvm"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <Github className="w-4 h-4" />
              View on GitHub
            </a>
          </div>

          {/* Topics */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">Topics</h3>
            <ul className="space-y-2">
              {navItems.slice(0, 5).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-500 hover:text-slate-200 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* More Topics */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">More Topics</h3>
            <ul className="space-y-2">
              {navItems.slice(5).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-slate-500 hover:text-slate-200 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/about" className="text-sm text-slate-500 hover:text-slate-200 transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-widest mb-4">Official Docs</h3>
            <ul className="space-y-2">
              {resources.map((r) => (
                <li key={r.href}>
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-200 transition-colors"
                  >
                    {r.label}
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-600">
            © {currentYear} InsideJVM. Built to make JVM internals accessible to every Java developer.
          </p>
          <p className="text-xs text-slate-600">
            Powered by{' '}
            <span className="text-slate-500">Next.js · Framer Motion · React Flow</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
