import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logob from '../assets/logob.svg'

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await login(email, password)
            navigate('/dashboard')
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Invalid email or password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-slate-200 selection:text-slate-900 font-sans">
            <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[600px]">

                {/* Left Side - Form */}
                <div className="p-8 md:p-12 flex flex-col justify-center relative">
                    <Link to="/" className="absolute top-8 left-8 inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors text-sm font-medium">
                        <ArrowLeft className="w-4 h-4" />
                        Back
                    </Link>

                    <div className="max-w-sm mx-auto w-full mt-12">
                        <div className="mb-10">
                            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-slate-200">
                                <img
                                    src={logob}
                                    alt="Gasana Logo"
                                    className="h-10 w-auto object-contain drop-shadow-md"
                                />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">Welcome back to Gasana</h1>
                            <p className="text-slate-500">Please enter your details to sign in.</p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm font-medium">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        placeholder="student@ktu.edu"
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-800 outline-none transition-all text-slate-900 placeholder-slate-400 font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-sm font-bold text-slate-700">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="w-full pl-11 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-800 outline-none transition-all text-slate-900 placeholder-slate-400 font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all hover:shadow-lg hover:shadow-slate-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-slate-100">
                            <p className="text-center text-slate-500 text-sm font-medium">
                                Don't have an account?{' '}
                                <Link to="/register" className="text-slate-900 font-bold hover:underline underline-offset-4">
                                    Create free account
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Visual */}
                {/* Right Side - Visual */}
                <div className="hidden md:flex flex-col justify-center items-center bg-obsidian relative overflow-hidden p-12">
                    {/* Smoke Animation */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-slow-pulse"></div>
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_50%)] animate-smoke"></div>

                    <div className="relative z-10 max-w-sm">
                        <div className="glass-panel p-6 rounded-2xl mb-8 rotate-3 hover:rotate-0 transition-transform duration-500 cursor-default border border-white/10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Exam Ready</h3>
                                    <p className="text-xs text-slate-400">AI-powered preparation</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="h-2 bg-white/10 rounded-full w-full" />
                                <div className="h-2 bg-white/10 rounded-full w-4/5" />
                                <div className="h-2 bg-white/10 rounded-full w-2/3" />
                            </div>
                        </div>

                        <h2 className="text-3xl font-bold text-white mb-4 leading-tight">Master your subjects.</h2>
                        <ul className="space-y-4 text-slate-300 font-medium">
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                                Access 5000+ Past Questions
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                                Get Instant AI Grading
                            </li>
                            <li className="flex items-center gap-3">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.5)]" />
                                Simulate Real Exams
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
