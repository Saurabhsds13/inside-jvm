# InsideJVM

> The most interactive JVM learning platform on the web. Visualize how the Java Virtual Machine works using live animations and simulations — not static text.

[![Deploy to GitHub Pages](https://github.com/Saurabhsds13/inside-jvm/actions/workflows/deploy.yml/badge.svg)](https://github.com/Saurabhsds13/inside-jvm/actions/workflows/deploy.yml)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?logo=tailwindcss)](https://tailwindcss.com)

**Designed & built by [Saurabh Sonawane](https://github.com/Saurabhsds13)**

**Live demo:** https://saurabhsds13.github.io/inside-jvm

---

## Preview

<div align="center">

[![InsideJVM](https://github-readme-stats.vercel.app/api/pin/?username=Saurabhsds13&repo=inside-jvm&theme=dark&bg_color=080e1a&border_color=1e293b&title_color=3b82f6&text_color=94a3b8&icon_color=8b5cf6)](https://saurabhsds13.github.io/inside-jvm)

| Page | Live Link |
|------|-----------|
| 🏠 Home | [saurabhsds13.github.io/inside-jvm](https://saurabhsds13.github.io/inside-jvm) |
| ⚙️ JVM Architecture | [/architecture](https://saurabhsds13.github.io/inside-jvm/architecture) |
| 🗂️ Heap vs Stack | [/heap-stack](https://saurabhsds13.github.io/inside-jvm/heap-stack) |
| 📦 Class Loader | [/class-loader](https://saurabhsds13.github.io/inside-jvm/class-loader) |
| ⚡ Execution Engine | [/execution-engine](https://saurabhsds13.github.io/inside-jvm/execution-engine) |
| 🗑️ Garbage Collection | [/garbage-collection](https://saurabhsds13.github.io/inside-jvm/garbage-collection) |
| 🧵 Threads | [/threads](https://saurabhsds13.github.io/inside-jvm/threads) |
| 🛡️ Java Memory Model | [/memory-model](https://saurabhsds13.github.io/inside-jvm/memory-model) |
| 💬 Interview Q&A | [/interview](https://saurabhsds13.github.io/inside-jvm/interview) |
| ℹ️ About | [/about](https://saurabhsds13.github.io/inside-jvm/about) |

> To add real screenshots: take a browser screenshot of each page and save to `docs/screenshots/` then reference them with `![alt](./docs/screenshots/page.png)`.

</div>

---

## Features

| Page | Interactive Elements |
|------|---------------------|
| **Home** | Animated hero, JVM preview diagram, roadmap timeline, feature cards |
| **JVM Architecture** | React Flow diagram — click any node for a detail side panel; animated data-flow edges |
| **Heap vs Stack** | 3 live scenarios — object allocation, method call stack, GC-eligible objects; trigger GC animation |
| **Class Loader** | Parent-delegation model diagram; 6-step walkthrough (Loading → Linking → Init) with code at each step |
| **Execution Engine** | Bytecode → native pipeline; 5-tier compilation selector with stat bars; 4 JIT optimization before/after views |
| **Garbage Collection** | 4 GC algorithms (Serial, Parallel, G1, ZGC) with pros/cons/use-cases; live heap simulation with mark-sweep-compact; comparison table |
| **Threads** | 3 scenarios (normal, lock contention, deadlock); animated thread stacks + shared heap; Thread.State reference |
| **Java Memory Model** | 5 core JMM concepts with toggle between broken/fixed code; CPU cache model diagram; 8 happens-before rules |
| **Interview Q&A** | 18 questions — search + difficulty + category filters; accordion with key points, code examples, follow-ups |
| **About** | Design principles, tech stack, references, open-source links |

---

## Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org) (App Router, static export)
- **Language:** [TypeScript 5](https://www.typescriptlang.org)
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com) with custom design tokens
- **Animations:** [Framer Motion 11](https://www.framer.com/motion)
- **Diagrams:** [React Flow 11](https://reactflow.dev)
- **UI Primitives:** [Radix UI](https://www.radix-ui.com) (accordion, dialog, tabs, tooltip)
- **Icons:** [Lucide React](https://lucide.dev)
- **Hosting:** [GitHub Pages](https://pages.github.com) via GitHub Actions
- **Fonts:** Inter (UI), JetBrains Mono (code)

---

## Project Structure

```
inside-jvm/
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout with Navigation + Footer + SEO
│   ├── page.tsx                  # Home page
│   ├── architecture/page.tsx     # JVM Architecture (React Flow)
│   ├── heap-stack/page.tsx       # Heap vs Stack visualization
│   ├── class-loader/page.tsx     # Class Loader lifecycle
│   ├── execution-engine/page.tsx # JIT compilation
│   ├── garbage-collection/page.tsx # GC algorithms
│   ├── threads/page.tsx          # Concurrency & threading
│   ├── memory-model/page.tsx     # Java Memory Model
│   ├── interview/page.tsx        # Interview Q&A
│   ├── about/page.tsx            # About page
│   └── globals.css               # Global styles + CSS variables
│
├── components/
│   ├── layout/
│   │   ├── Navigation.tsx        # Fixed nav with dropdown + mobile menu
│   │   ├── Footer.tsx            # Site-wide footer
│   │   ├── PageHeader.tsx        # Reusable page hero header
│   │   └── PageTransition.tsx    # Framer Motion page transition wrapper
│   └── ui/
│       ├── GlassCard.tsx         # Glassmorphism card (static + animated)
│       ├── AnimatedSection.tsx   # Scroll-triggered animation + StaggerContainer
│       ├── CodeBlock.tsx         # Java syntax highlighting + copy button
│       ├── Badge.tsx             # Color-variant pill badge
│       ├── StatBar.tsx           # Animated progress stat bar
│       └── SectionLabel.tsx      # Section category label chip
│
├── data/                         # Static JSON-equivalent TypeScript data
│   ├── navigation.ts             # Nav items
│   ├── jvm-components.ts         # JVM component definitions (6 components)
│   ├── gc-algorithms.ts          # GC algorithm data (Serial, Parallel, G1, ZGC)
│   ├── interview-questions.ts    # 18 interview Q&As
│   └── roadmap.ts                # Learning roadmap items
│
├── types/
│   └── index.ts                  # All TypeScript interfaces and types
│
├── lib/
│   └── utils.ts                  # cn(), formatBytes(), sleep(), getBasePath()
│
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions: build + deploy to Pages
│
├── next.config.js                # Static export + GitHub Pages basePath
├── tailwind.config.ts            # Extended theme with JVM color palette
├── tsconfig.json                 # TypeScript config
└── package.json                  # Dependencies
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- npm ≥ 9

### Local Development

```bash
# 1. Clone the repository
git clone https://github.com/Saurabhsds13/inside-jvm.git
cd inside-jvm

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev

# 4. Open in browser
# http://localhost:3000
```

### Production Build

```bash
# Build static export (outputs to ./out)
npm run build

# Preview the static build locally (requires a static file server)
npx serve out
# http://localhost:3000
```

---

## GitHub Pages Deployment

### One-time setup

1. Push this repository to GitHub.
2. Go to **Settings → Pages** in your GitHub repository.
3. Under **Source**, select **GitHub Actions**.
4. That's it — the workflow fires automatically on every push to `main`.

### How it works

```
push to main
     │
     ▼
.github/workflows/deploy.yml
     │
     ├─ npm ci
     ├─ npm run build        (NODE_ENV=production)
     ├─ touch out/.nojekyll  (prevents Jekyll processing)
     └─ upload-pages-artifact → deploy-pages
                                      │
                                      ▼
                     https://<username>.github.io/inside-jvm
```

The `next.config.js` automatically applies the correct `basePath` and `assetPrefix` (`/inside-jvm`) when `NODE_ENV=production`, so all assets resolve correctly on GitHub Pages.

### Custom domain (optional)

Create a `public/CNAME` file with your domain:

```
insidejvm.dev
```

Then update `next.config.js`:

```js
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  basePath: '',       // empty for custom domain
  assetPrefix: '',    // empty for custom domain
};
```

---

## Design System

### Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `jvm-blue` | `#3B82F6` | Class Loader, primary actions |
| `jvm-purple` | `#8B5CF6` | Memory areas, accent |
| `jvm-cyan` | `#06B6D4` | Per-thread components |
| `jvm-green` | `#10B981` | Execution Engine, success |
| `jvm-orange` | `#F59E0B` | GC, warnings |
| `jvm-red` | `#EF4444` | Errors, destructive, JMM issues |
| `jvm-pink` | `#EC4899` | JNI, threads |

### Key CSS Classes

```css
.glass-card          /* Glassmorphism card base */
.glass-card-hover    /* With hover glow + border brightening */
.gradient-text       /* Blue → Purple → Cyan gradient text */
.gradient-text-warm  /* Amber → Red → Pink gradient text */
.glow-blue           /* Blue drop shadow */
.code-block          /* Monospace code container */
```

### Component Patterns

```tsx
// Scroll-triggered animation
<AnimatedSection delay={0.1} direction="up">
  <YourContent />
</AnimatedSection>

// Staggered list animation
<StaggerContainer staggerDelay={0.08}>
  {items.map(item => (
    <StaggerItem key={item.id}>
      <Card>{item.label}</Card>
    </StaggerItem>
  ))}
</StaggerContainer>

// Glassmorphism card with hover
<GlassCard hover animate delay={0.2} className="p-6">
  <Content />
</GlassCard>
```

---

## Adding New Topics

The architecture is designed for easy extension. To add a new topic page:

1. **Create a data file** in `data/your-topic.ts` following the existing patterns.
2. **Add types** to `types/index.ts`.
3. **Create the page** at `app/your-topic/page.tsx` using `PageHeader` + `GlassCard` + `AnimatedSection`.
4. **Add to navigation** in `data/navigation.ts`.
5. **Add to roadmap** in `data/roadmap.ts`.

No other files need changing — the nav and footer auto-update from the data files.

---

## Content Sources

All JVM content is grounded in official specifications and authoritative engineering resources:

- [The Java Virtual Machine Specification (Java SE 21)](https://docs.oracle.com/javase/specs/jvms/se21/html/index.html)
- [The Garbage Collection Handbook — Jones, Hosking & Moss](https://gchandbook.org/)
- [HotSpot Internals — OpenJDK Wiki](https://wiki.openjdk.org/display/HotSpot)
- [JEP Index — OpenJDK](https://openjdk.org/jeps/0)
- [JSR-133: Java Memory Model](https://www.cs.umd.edu/~pugh/java/memoryModel/)
- [ZGC Design — Stefan Karlsson](https://malloc.se/blog/zgc-jdk16)

---

## License

MIT — free to use, modify, and distribute. Attribution appreciated.

---

## Author

**Saurabh Sonawane** — [github.com/Saurabhsds13](https://github.com/Saurabhsds13)

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/shenandoah-gc`
3. Make your changes with accurate JVM terminology
4. Open a pull request — CI will validate the build automatically
