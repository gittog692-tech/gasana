import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, User, Mail, Lock, Eye, EyeOff, BookOpen, AlertCircle, ArrowLeft, GraduationCap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getDepartments } from '../services/api'
import logo from '../assets/logo.png'

interface Department {
    id: number
    name: string
    code: string
}

const FALLBACK_DEPARTMENTS: Department[] = [
    { id: 1, name: 'Electrical and Electronics Engineering', code: 'EEE' },
    { id: 2, name: 'Mechanical Engineering', code: 'ME' },
    { id: 3, name: 'Electronics and Communication Engineering', code: 'ECE' },
    { id: 4, name: 'Civil Engineering', code: 'CE' },
    { id: 5, name: 'Computer Science and Engineering', code: 'CSE' },
]

export default function Register() {
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        department_id: '',
        semester: '',
    })
    const [showPassword, setShowPassword] = useState(false)
    const [departments, setDepartments] = useState<Department[]>(FALLBACK_DEPARTMENTS)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        getDepartments()
            .then((res) => {
                if (res.data && res.data.length > 0) {
                    setDepartments(res.data)
                }
            })
            .catch(() => { /* keep fallback departments */ })
    }, [])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        if (form.password !== form.confirmPassword) {
            setError('Passwords do not match')
            return
        }
        if (form.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }
        setLoading(true)
        try {
            await register({
                name: form.name,
                email: form.email,
                password: form.password,
                department_id: form.department_id ? Number(form.department_id) : undefined,
                semester: form.semester ? Number(form.semester) : undefined,
            })
            navigate('/dashboard')
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Registration failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-slate-200 selection:text-slate-900 font-sans">
            <div className="w-full max-w-5xl bg-white rounded-[2rem] shadow-2xl shadow-slate-200 overflow-hidden grid grid-cols-1 md:grid-cols-2 min-h-[600px]">

                {/* Left Side - Visual (Swapped for Register) */}
                {/* Left Side - Visual (Swapped for Register) */}
                <div className="hidden md:flex flex-col justify-center bg-obsidian relative overflow-hidden p-12 text-white">
                    {/* Smoke Animation */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 animate-slow-pulse"></div>
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,rgba(255,255,255,0.03)_0%,transparent_50%)] animate-smoke"></div>

                        <div className="relative z-10 max-w-sm">
                        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-12 transition-colors text-sm font-medium">
                            <ArrowLeft className="w-4 h-4" />
                            Back to Home
                        </Link>
                        
                        <div className="mb-10 flex justify-center">
                            <img 
                                src={logo}
                                alt="Gasana logo"
                                className="max-h-40 w-auto object-contain"
                                />
                        </div>
                        <div className="mb-12">
                            <h2 className="text-4xl font-bold mb-6 leading-tight text-white">Join Gasana.</h2>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                Create an account to access personalized study materials, AI-graded mock exams, and predictive question analysis.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 glass-panel rounded-2xl border border-white/10">
                                <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center flex-shrink-0 font-bold border border-white/20">
                                    01
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Select Your Stream</h3>
                                    <p className="text-xs text-slate-400 mt-1">We customize content based on your department and semester.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 glass-panel rounded-2xl border border-white/10">
                                <div className="w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center flex-shrink-0 font-bold border border-white/20">
                                    02
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Start Practicing</h3>
                                    <p className="text-xs text-slate-400 mt-1">Unlimited access to previous questions and AI tools.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="p-8 md:p-12 flex flex-col justify-center overflow-y-auto">
                    <div className="max-w-md mx-auto w-full">
                        <div className="mb-8">
                            <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Create Account</h1>
                            <p className="text-slate-500 text-sm">Fill in your details to get started.</p>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 mb-6 text-sm font-medium">
                                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                                    <input
                                        name="name" type="text" value={form.name} onChange={handleChange} required
                                        placeholder="Jane Doe"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-800 outline-none transition-all text-slate-900 placeholder:text-slate-400 text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                                    <input
                                        name="email" type="email" value={form.email} onChange={handleChange} required
                                        placeholder="student@ktu.edu"
                                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-800 outline-none transition-all text-slate-900 placeholder:text-slate-400 text-sm font-medium"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Department</label>
                                <select
                                    name="department_id" value={form.department_id} onChange={handleChange}
                                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-800 outline-none text-slate-700 text-sm font-medium appearance-none"
                                >
                                    <option value="">Select Department</option>
                                    {departments.map((d) => (
                                        <option key={d.id} value={d.id}>{d.code} — {d.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Semester</label>
                                <select
                                    name="semester" value={form.semester} onChange={handleChange}
                                    className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-800 outline-none text-slate-700 text-sm font-medium appearance-none"
                                >
                                    <option value="">Select Semester</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                                        <option key={s} value={s}>Sem {s}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Password</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                                        <input
                                            name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} required
                                            placeholder="Min 6 chars"
                                            className="w-full pl-10 pr-8 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-800 outline-none transition-all text-slate-900 placeholder:text-slate-400 text-sm font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Confirm</label>
                                    <div className="relative group">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400 group-focus-within:text-slate-800 transition-colors" />
                                        <input
                                            name="confirmPassword" type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={handleChange} required
                                            placeholder="Repeat"
                                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-200 focus:border-slate-800 outline-none transition-all text-slate-900 placeholder:text-slate-400 text-sm font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="text-xs text-slate-800 font-bold hover:underline mb-2 block text-right"
                            >
                                {showPassword ? 'Hide Passwords' : 'Show Passwords'}
                            </button>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-black transition-all hover:shadow-lg hover:shadow-slate-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Account...' : 'Create Account'}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                            <p className="text-slate-500 text-sm font-medium">
                                Already registered?{' '}
                                <Link to="/login" className="text-slate-900 font-bold hover:underline underline-offset-4">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
