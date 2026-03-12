import { Link } from 'react-router-dom'
import { Brain, BookOpen, FileText, TrendingUp, ChevronRight, Sparkles, MessageCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { motion, useScroll, useTransform } from 'framer-motion'
import LaminarSmoke from '../components/LaminarSmoke'
import SpotlightCard from '../components/SpotlightCard'
import logob from '../assets/logob.svg'
import logod from '../assets/logod.svg'

const appleEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function LandingPage() {
    const { isAuthenticated } = useAuth()
    const { scrollY } = useScroll();
    const heroY = useTransform(scrollY, [0, 600], [0, 150]);
    const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
    const heroScale = useTransform(scrollY, [0, 400], [1, 0.95]);
    const heroBlurRaw = useTransform(scrollY, [0, 400], [0, 10]);
    const heroBlur = useTransform(heroBlurRaw, v => `blur(${v}px)`);

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-teal-500/30 overflow-x-hidden font-sans">

            {/* ── Background Smoke Effects ──────────────────────────────────── */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <LaminarSmoke />
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-white opacity-[0.03] blur-[120px] rounded-full animate-smoke" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[600px] h-[600px] bg-slate-400 opacity-[0.02] blur-[100px] rounded-full animate-smoke [animation-delay:4s]" />
                <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] bg-teal-400 opacity-[0.05] blur-[150px] rounded-full animate-slow-pulse" />
            </div>

            {/* ── Navbar ────────────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-5 px-6">
                <motion.div
                    initial={{ y: -30, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                    transition={{ duration: 1.2, ease: appleEase }}
                    className="liquid-glass landing-liquid-shell rounded-full px-8 py-3.5 flex items-center gap-10 shadow-2xl shadow-black/20"
                >
                    <div className="flex items-center gap-2.5">
                        <img
                            src={logob}
                            alt="Gasana Logo"
                            className="h-10 w-auto object-contain drop-shadow-md"
                        />
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-300">
                        <a href="#features" className="hover:text-white transition-colors hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">Features</a>
                        <a href="#how-it-works" className="hover:text-white transition-colors hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">How It Works</a>
                        <a href="#tools" className="hover:text-white transition-colors hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">AI Tools</a>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAuthenticated ? (
                            <Link to="/dashboard" className="liquid-button landing-cta-button px-6 py-2 rounded-full text-sm font-bold text-white transition-transform active:scale-95">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-medium text-slate-300 hover:text-white transition-colors hidden sm:block hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                                    Login
                                </Link>
                                <Link to="/register" className="liquid-button landing-cta-button px-6 py-2 rounded-full text-sm font-bold text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                                    Get Started
                                </Link>
                            </>
                        )}
                    </div>
                </motion.div>
            </nav>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ── HERO ──────────────────────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <motion.section
                style={{ y: heroY, opacity: heroOpacity, scale: heroScale, filter: heroBlur }}
                className="relative z-10 min-h-screen flex flex-col items-center justify-center pt-20 pb-20 px-6 text-center"
            >
                <motion.div
                    initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 1.2, ease: appleEase, delay: 0.1 }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full liquid-glass text-slate-300 text-xs font-semibold uppercase tracking-widest mb-10 shadow-[0_0_20px_rgba(0,0,0,0.5)]"
                >
                    <Sparkles className="w-3 h-3 text-teal-300 drop-shadow-[0_0_6px_rgba(45,212,191,0.85)]" />
                    AI-Powered KTU Exam Preparation
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 1.2, ease: appleEase, delay: 0.2 }}
                    className="max-w-4xl mx-auto text-5xl md:text-7xl lg:text-8xl font-medium tracking-tight leading-[1.08] mb-10 drop-shadow-2xl"
                >
                    The Smarter Way to{' '}
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400 drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                        Ace KTU Exams
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 1.2, ease: appleEase, delay: 0.3 }}
                    className="max-w-xl mx-auto text-base md:text-lg text-slate-400 mb-10 leading-relaxed font-light"
                >
                    Practice with past papers, get AI-graded answers, simulate real exams, and clear your doubts — all in one place.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 1.2, ease: appleEase, delay: 0.4 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6"
                >
                    <Link
                        to="/register"
                        className="liquid-button landing-cta-button px-8 py-4 rounded-full text-white font-bold text-base flex items-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.1)] group transition-all"
                    >
                        Start for Free
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                    <Link
                        to="/login"
                        className="liquid-glass px-8 py-4 rounded-full text-slate-300 font-medium hover:text-white transition-all hover:bg-white/5"
                    >
                        Sign In
                    </Link>
                </motion.div>
            </motion.section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ── FEATURES GRID ─────────────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="features" className="relative z-10 py-28 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    {/* Section Header */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                        <div className="lg:col-span-5">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Core Features</p>
                            <h2 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight">
                                Everything you need, nothing you don't.
                            </h2>
                        </div>
                        <div className="lg:col-span-5 lg:col-start-8 flex items-end">
                            <p className="text-slate-400 text-sm leading-relaxed">
                                A focused toolkit designed specifically for KTU students. Every feature is built around the core workflow of practice, evaluate, and improve.
                            </p>
                        </div>
                    </div>

                    {/* 2x2 Feature Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Card 1: PYQs */}
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
                            whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 1.2, ease: appleEase }}
                            className="h-full"
                        >
                            <SpotlightCard className="group liquid-glass landing-liquid-card rounded-3xl p-8 md:p-10 transition-all duration-500 h-full">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-500 shadow-inner group-hover:scale-105">
                                        <FileText className="w-6 h-6 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 drop-shadow-md">Previous Year Questions</h3>
                                <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors duration-300">
                                    Browse, search and filter past KTU exam questions by subject, semester, year, and marks. Frequency tagging highlights the most-asked topics.
                                </p>
                            </SpotlightCard>
                        </motion.div>

                        {/* Card 2: AI Grading */}
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
                            whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 1.2, ease: appleEase }}
                            className="h-full"
                        >
                            <SpotlightCard className="group liquid-glass landing-liquid-card rounded-3xl p-8 md:p-10 transition-all duration-500 h-full">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-500 shadow-inner group-hover:scale-105">
                                        <Brain className="w-6 h-6 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 drop-shadow-md">AI-Powered Grading</h3>
                                <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors duration-300">
                                    Write your answer to any question and receive an instant Gemini AI evaluation with marks, feedback on what's missing, and a model answer.
                                </p>
                            </SpotlightCard>
                        </motion.div>

                        {/* Card 3: Mock Exams */}
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
                            whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 1.2, ease: appleEase }}
                            className="h-full"
                        >
                            <SpotlightCard className="group liquid-glass landing-liquid-card rounded-3xl p-8 md:p-10 transition-all duration-500 h-full">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-500 shadow-inner group-hover:scale-105">
                                        <BookOpen className="w-6 h-6 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 drop-shadow-md">Timed Mock Exams</h3>
                                <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors duration-300">
                                    Simulate a real KTU exam with auto-curated question sets, countdown timer, and a comprehensive score summary at the end.
                                </p>
                            </SpotlightCard>
                        </motion.div>

                        {/* Card 4: Predictions */}
                        <motion.div
                            initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
                            whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 1.2, ease: appleEase }}
                            className="h-full"
                        >
                            <SpotlightCard className="group liquid-glass landing-liquid-card rounded-3xl p-8 md:p-10 transition-all duration-500 h-full">
                                <div className="flex items-start justify-between mb-8">
                                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all duration-500 shadow-inner group-hover:scale-105">
                                        <TrendingUp className="w-6 h-6 text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]" />
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                                </div>
                                <h3 className="text-xl font-bold text-white mb-3 drop-shadow-md">Question Predictions</h3>
                                <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors duration-300">
                                    AI analyses historical question patterns and frequency data to predict the topics most likely to appear in your next exam.
                                </p>
                            </SpotlightCard>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ── HOW IT WORKS ──────────────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="how-it-works" className="relative z-10 py-28 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="mb-16">
                        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">Workflow</p>
                        <h2 className="text-3xl md:text-4xl font-medium tracking-tight">How it works</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Create Your Account',
                                desc: 'Sign up in seconds. Choose your department and semester so the platform filters everything for you.',
                            },
                            {
                                step: '02',
                                title: 'Practice & Get Graded',
                                desc: 'Browse past papers, write answers directly in the app, and receive instant AI-powered feedback and scores.',
                            },
                            {
                                step: '03',
                                title: 'Track & Improve',
                                desc: 'Take mock exams, review your weak areas, and use AI predictions to focus your remaining study time.',
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
                                whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                viewport={{ once: true, margin: "-50px" }}
                                transition={{ duration: 1.2, ease: appleEase, delay: index * 0.15 }}
                                className="relative liquid-glass landing-liquid-card rounded-3xl p-8 md:p-10 group transition-all h-full"
                            >
                                <div className="text-6xl font-bold text-white/[0.04] absolute top-6 right-8 leading-none select-none">
                                    {item.step}
                                </div>
                                <div className="relative z-10">
                                    <div className="w-10 h-10 rounded-full liquid-button flex items-center justify-center text-xs font-bold text-white mb-8 shadow-inner">
                                        {item.step}
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-3 drop-shadow-md">{item.title}</h3>
                                    <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ── AI TOOLS SHOWCASE ─────────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section id="tools" className="relative z-10 py-28 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
                        <div className="lg:col-span-5">
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">AI Tools</p>
                            <h2 className="text-3xl md:text-4xl font-medium tracking-tight leading-tight">
                                Powered by Google's Gemini 2.0
                            </h2>
                        </div>
                        <div className="lg:col-span-5 lg:col-start-8 flex items-end">
                            <p className="text-slate-400 text-sm leading-relaxed">
                                Every AI feature runs on Google's latest Gemini model, providing fast, accurate, and context-aware responses tailored to KTU syllabi.
                            </p>
                        </div>
                    </div>

                    {/* Two horizontal cards */}
                    <div className="space-y-6">
                        {/* Doubt Clearing */}
                        <motion.div
                            initial={{ opacity: 0, x: -40, scale: 0.98, filter: 'blur(10px)' }}
                            whileInView={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: appleEase }}
                            className="liquid-glass landing-liquid-card rounded-3xl p-8 md:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center group"
                        >
                            <div className="md:col-span-1">
                                <div className="w-14 h-14 rounded-2xl liquid-button flex items-center justify-center shadow-lg">
                                    <MessageCircle className="w-6 h-6 text-white drop-shadow-md" />
                                </div>
                            </div>
                            <div className="md:col-span-7">
                                <h3 className="text-xl font-bold text-white mb-2 drop-shadow-md">AI Doubt Clearing</h3>
                                <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                                    Ask any question about your syllabus. The AI provides detailed, step-by-step explanations with related topic suggestions and video recommendations.
                                </p>
                            </div>
                            <div className="md:col-span-4 flex md:justify-end">
                                <Link to="/register" className="liquid-button landing-cta-button px-6 py-3 rounded-full text-sm font-bold text-white flex items-center gap-2 group-hover:scale-105 transition-transform">
                                    Try it free
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </motion.div>

                        {/* Stress Support */}
                        <motion.div
                            initial={{ opacity: 0, x: -40, scale: 0.98, filter: 'blur(10px)' }}
                            whileInView={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.2, ease: appleEase }}
                            className="liquid-glass landing-liquid-card rounded-3xl p-8 md:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center group"
                        >
                            <div className="md:col-span-1">
                                <div className="w-14 h-14 rounded-2xl liquid-button flex items-center justify-center shadow-lg">
                                    <Sparkles className="w-6 h-6 text-white drop-shadow-md" />
                                </div>
                            </div>
                            <div className="md:col-span-7">
                                <h3 className="text-xl font-bold text-white mb-2 drop-shadow-md">Exam Stress Support</h3>
                                <p className="text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">
                                    Feeling overwhelmed? Our AI provides empathetic guidance, study strategies, and motivation tailored to your exam schedule and workload.
                                </p>
                            </div>
                            <div className="md:col-span-4 flex md:justify-end">
                                <Link to="/register" className="liquid-button landing-cta-button px-6 py-3 rounded-full text-sm font-bold text-white flex items-center gap-2 group-hover:scale-105 transition-transform">
                                    Try it free
                                    <ArrowRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ═══════════════════════════════════════════════════════════════ */}
            {/* ── CTA ───────────────────────────────────────────────────────── */}
            {/* ═══════════════════════════════════════════════════════════════ */}
            <section className="relative z-10 py-32 px-6 border-t border-white/5">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 30, filter: 'blur(10px)' }}
                    whileInView={{ opacity: 1, scale: 1, y: 0, filter: 'blur(0px)' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: appleEase }}
                    className="max-w-3xl mx-auto text-center"
                >
                    <h2 className="text-4xl md:text-6xl font-medium tracking-tight mb-8 drop-shadow-xl">
                        Start preparing<br />smarter, today.
                    </h2>
                    <p className="text-slate-400 text-base mb-12 max-w-md mx-auto">
                        Free to use. No credit card. Just sign up and start practising with AI-powered tools built for KTU.
                    </p>
                    <Link
                        to="/register"
                        className="liquid-button landing-cta-button inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base text-white transition-all shadow-lg shadow-white/5 hover:shadow-white/20"
                    >
                        Create Free Account
                        <ChevronRight className="w-4 h-4" />
                    </Link>
                </motion.div>
            </section>

            {/* ── Footer ───────────────────────────────────────────────────── */}
            <footer className="relative z-10 py-12 px-6 border-t border-white/5">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6 text-xs text-slate-600 uppercase tracking-widest font-medium">
                    <div className="flex items-center gap-2.5">
                        <img
                            src={logod}
                            alt="Gasana Logo"
                            className="h-10 w-auto object-contain drop-shadow-md"
                        />
                        <span>Gasana</span>
                    </div>
                    <span>© 2026 <strong>AXIOM</strong> · Built for students, by students.</span>
                    <span>ALEN | ARCHA | GITTO | NEERAJA | SREEDURGA</span>
                    <div className="flex gap-6">
                        <Link to="/login" className="hover:text-slate-400 transition-colors">Sign In</Link>
                        <Link to="/register" className="hover:text-slate-400 transition-colors">Register</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
