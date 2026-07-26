"use client";

import { motion } from "framer-motion";
import {
    Cpu,
    Layers,
    Zap,
    GitBranch,
    Clock,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
} from "lucide-react";

export default function VirtualThreadsPage() {
    return (
        <main className="min-h-screen bg-background">
            {/* Hero */}
            <section className="border-b">
                <div className="container mx-auto max-w-7xl px-6 py-20">
                    <motion.div
                        initial={{ opacity: 0, y: 25 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-flex items-center rounded-full border px-4 py-1 text-sm font-medium">
                            Java 21 • Project Loom
                        </span>

                        <h1 className="mt-6 text-5xl font-bold tracking-tight">
                            Virtual Threads
                        </h1>

                        <p className="mt-6 max-w-3xl text-lg text-muted-foreground leading-8">
                            Virtual Threads are lightweight JVM-managed threads introduced by
                            Project Loom. They allow Java applications to scale to millions of
                            concurrent tasks without creating millions of operating-system
                            threads.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Introduction */}
            <section className="container mx-auto max-w-7xl px-6 py-16">
                <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl font-bold mb-6">
                        Why were Virtual Threads introduced?
                    </h2>

                    <p className="text-muted-foreground leading-8">
                        Traditional Java applications map every Java thread to one operating
                        system thread. While this model is simple, OS threads are expensive
                        because each requires native memory, scheduling, and context
                        switching.
                    </p>

                    <p className="mt-6 text-muted-foreground leading-8">
                        Virtual Threads separate Java concurrency from operating-system
                        threads. Thousands or even millions of Virtual Threads can share a
                        much smaller pool of carrier threads managed by the JVM scheduler.
                    </p>
                </motion.div>
            </section>

            {/* Platform vs Virtual */}
            <section className="container mx-auto max-w-7xl px-6 pb-20">
                <h2 className="text-3xl font-bold mb-10">
                    Platform Threads vs Virtual Threads
                </h2>

                <div className="grid gap-8 lg:grid-cols-2">
                    <div className="rounded-2xl border p-8 shadow-sm">
                        <Cpu className="h-10 w-10 mb-4 text-red-500" />

                        <h3 className="text-2xl font-semibold mb-6">Platform Thread</h3>

                        <ul className="space-y-4">
                            <li>• One Java Thread = One OS Thread</li>
                            <li>• ~1 MB native stack</li>
                            <li>• Expensive context switching</li>
                            <li>• Limited scalability</li>
                            <li>• Best for CPU-intensive workloads</li>
                        </ul>
                    </div>

                    <div className="rounded-2xl border p-8 shadow-sm">
                        <Zap className="h-10 w-10 mb-4 text-green-500" />

                        <h3 className="text-2xl font-semibold mb-6">Virtual Thread</h3>

                        <ul className="space-y-4">
                            <li>• Managed entirely by the JVM</li>
                            <li>• Very small memory footprint</li>
                            <li>• Millions can exist simultaneously</li>
                            <li>• Blocking operations are inexpensive</li>
                            <li>• Ideal for I/O-heavy applications</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* Architecture */}
            <section className="container mx-auto max-w-7xl px-6 pb-24">
                <h2 className="text-3xl font-bold mb-10">
                    Virtual Thread Architecture
                </h2>

                <div className="rounded-2xl border p-10 overflow-x-auto">
                    <div className="flex items-center justify-center gap-6 text-center min-w-[900px]">
                        <div className="rounded-xl border p-5">Request 1</div>

                        <ArrowRight />

                        <div className="rounded-xl border bg-green-500/10 p-5">
                            Virtual Thread
                        </div>

                        <ArrowRight />

                        <div className="rounded-xl border bg-blue-500/10 p-5">
                            JVM Scheduler
                        </div>

                        <ArrowRight />

                        <div className="rounded-xl border bg-yellow-500/10 p-5">
                            Carrier Thread
                        </div>

                        <ArrowRight />

                        <div className="rounded-xl border p-5">CPU Core</div>
                    </div>
                </div>
            </section>

            {/* Carrier Threads */}
            <section className="container mx-auto max-w-7xl px-6 pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 25 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-3xl font-bold mb-8">Carrier Threads</h2>

                    <p className="text-muted-foreground leading-8 mb-8">
                        A Virtual Thread is <strong>not</strong> an operating system thread.
                        It executes on top of a small pool of Platform Threads known as
                        <strong> Carrier Threads</strong>. The JVM mounts a Virtual Thread
                        onto a Carrier Thread only while it is actively executing.
                    </p>

                    <div className="rounded-2xl border p-8 overflow-x-auto">
                        <div className="min-w-[900px] flex items-center justify-between">
                            <div className="space-y-4">
                                <div className="rounded-lg border bg-green-500/10 px-6 py-3">
                                    Virtual Thread #1
                                </div>

                                <div className="rounded-lg border bg-green-500/10 px-6 py-3">
                                    Virtual Thread #2
                                </div>

                                <div className="rounded-lg border bg-green-500/10 px-6 py-3">
                                    Virtual Thread #3
                                </div>

                                <div className="rounded-lg border bg-green-500/10 px-6 py-3">
                                    Virtual Thread #4
                                </div>
                            </div>

                            <ArrowRight className="h-10 w-10" />

                            <div className="rounded-xl border bg-blue-500/10 p-8 text-center">
                                <Layers className="mx-auto h-12 w-12 mb-4 text-blue-500" />
                                <h3 className="font-semibold text-xl">JVM Scheduler</h3>
                            </div>

                            <ArrowRight className="h-10 w-10" />

                            <div className="space-y-4">
                                <div className="rounded-lg border bg-yellow-500/10 px-6 py-3">
                                    Carrier Thread 1
                                </div>

                                <div className="rounded-lg border bg-yellow-500/10 px-6 py-3">
                                    Carrier Thread 2
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Scheduler */}
            <section className="container mx-auto max-w-7xl px-6 pb-24">
                <h2 className="text-3xl font-bold mb-8">JVM Scheduler</h2>

                <div className="grid lg:grid-cols-2 gap-8">
                    <div className="rounded-2xl border p-8">
                        <Clock className="h-10 w-10 mb-4 text-indigo-500" />

                        <h3 className="text-xl font-semibold mb-4">Mount</h3>

                        <p className="text-muted-foreground leading-7">
                            When a Virtual Thread starts executing, the JVM mounts it onto an
                            available Carrier Thread. It behaves exactly like a normal Java
                            thread while running.
                        </p>
                    </div>

                    <div className="rounded-2xl border p-8">
                        <GitBranch className="h-10 w-10 mb-4 text-purple-500" />

                        <h3 className="text-xl font-semibold mb-4">Unmount</h3>

                        <p className="text-muted-foreground leading-7">
                            When the Virtual Thread performs a blocking I/O operation, the JVM
                            unmounts it from the Carrier Thread. The Carrier Thread
                            immediately becomes available to execute another Virtual Thread.
                        </p>
                    </div>
                </div>
            </section>

            {/* Pinning */}
            <section className="container mx-auto max-w-7xl px-6 pb-24">
                <h2 className="text-3xl font-bold mb-8">Thread Pinning</h2>

                <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="text-yellow-500 h-6 w-6" />
                        <h3 className="text-xl font-semibold">What is Pinning?</h3>
                    </div>

                    <p className="text-muted-foreground leading-8 mb-6">
                        Normally, a Virtual Thread releases its Carrier Thread while waiting
                        for I/O. However, if it enters a synchronized block or invokes
                        native code, the JVM cannot safely unmount it. The Carrier Thread
                        becomes <strong>pinned</strong> until execution completes.
                    </p>

                    <pre className="rounded-xl bg-black text-green-400 overflow-x-auto p-6 text-sm">
                        {`synchronized(lock) {
    Thread.sleep(5000);
}`}
                    </pre>

                    <p className="mt-6 text-muted-foreground">
                        During <code>Thread.sleep()</code>, the Carrier Thread remains
                        occupied because the synchronized block prevents unmounting.
                    </p>
                </div>
            </section>

            {/* Avoid Pinning */}
            <section className="container mx-auto max-w-7xl px-6 pb-24">
                <div className="rounded-2xl border border-green-500/30 bg-green-500/5 p-8">
                    <div className="flex items-center gap-3 mb-4">
                        <CheckCircle2 className="text-green-500 h-6 w-6" />
                        <h3 className="text-xl font-semibold">Better Alternative</h3>
                    </div>

                    <pre className="rounded-xl bg-black text-green-400 overflow-x-auto p-6 text-sm">
                        {`ReentrantLock lock = new ReentrantLock();

lock.lock();

try {

    Thread.sleep(5000);

} finally {

    lock.unlock();

}`}
                    </pre>

                    <p className="mt-6 text-muted-foreground">
                        Modern lock implementations cooperate much better with Virtual
                        Threads than long-running synchronized blocks.
                    </p>
                </div>
            </section>
        </main>
    );
}
