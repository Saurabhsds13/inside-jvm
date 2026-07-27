'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  className?: string;
  showLineNumbers?: boolean;
}

export default function CodeBlock({
  code,
  language = 'java',
  title,
  className,
  showLineNumbers = false,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  // Simple Java syntax highlighting
  const highlightJava = (line: string): string => {
    // Tokenize approach: split line into segments, highlight each
    // This avoids regex replacements interfering with each other

    const escaped = line
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Match tokens in priority order, return the highlighted line
    const tokenRegex = /(\/\/.*$)|(["'])(?:(?=(\\?))\3.)*?\2|(@\w+)|\b(public|private|protected|static|final|void|class|interface|extends|implements|new|return|if|else|for|while|do|try|catch|finally|throw|throws|import|package|this|super|null|true|false|instanceof|synchronized|volatile|abstract|native|transient|enum|record|sealed|permits|var)\b|\b(int|long|double|float|boolean|byte|short|char|String|Object|Integer|Long|Double|Boolean|List|Map|Set|Array|Thread|Future|Executors|Subtask|ReentrantLock|Lock)\b|\b(\d+)\b/gm;

    let result = '';
    let lastIndex = 0;

    let match: RegExpExecArray | null;
    while ((match = tokenRegex.exec(escaped)) !== null) {
      // Add text before this match
      result += escaped.slice(lastIndex, match.index);

      if (match[1]) {
        // Comment
        result += `<span class="text-slate-500">${match[0]}</span>`;
      } else if (match[2]) {
        // String (match[2] is the quote char, full match is match[0])
        result += `<span class="text-green-400">${match[0]}</span>`;
      } else if (match[4]) {
        // Annotation
        result += `<span class="text-yellow-400">${match[0]}</span>`;
      } else if (match[5]) {
        // Keyword
        result += `<span class="text-purple-400">${match[0]}</span>`;
      } else if (match[6]) {
        // Type
        result += `<span class="text-cyan-400">${match[0]}</span>`;
      } else if (match[7]) {
        // Number
        result += `<span class="text-orange-400">${match[0]}</span>`;
      } else {
        result += match[0];
      }

      lastIndex = tokenRegex.lastIndex;
    }

    // Add remaining text
    result += escaped.slice(lastIndex);

    return result;
  };

  return (
    <div className={cn('rounded-xl overflow-hidden border border-white/[0.08] bg-[#0a0f1e]', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/60" />
            <span className="w-3 h-3 rounded-full bg-yellow-500/60" />
            <span className="w-3 h-3 rounded-full bg-green-500/60" />
          </div>
          {title && <span className="text-xs text-slate-500 font-mono">{title}</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-500 font-mono uppercase">
            {language}
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-200 transition-colors"
            aria-label="Copy code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-400" />
                <span className="text-green-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code */}
      <div className="overflow-x-auto">
        <pre className="p-4 text-sm font-mono leading-relaxed">
          {lines.map((line, i) => (
            <div key={i} className="flex">
              {showLineNumbers && (
                <span className="select-none text-slate-600 text-right min-w-[2.5rem] pr-4 text-xs leading-relaxed">
                  {i + 1}
                </span>
              )}
              <code
                className="text-slate-300"
                dangerouslySetInnerHTML={{ __html: highlightJava(line) || '&nbsp;' }}
              />
            </div>
          ))}
        </pre>
      </div>
    </div>
  );
}
