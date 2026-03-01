import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Users, FileText, BookOpen, Layers, TrendingUp, Shield, ArrowRight } from 'lucide-react'
import { adminGetStats } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

interface Stats {
    total_users: number
    active_users: number
    total_questions: number
    total_exams: number
    total_subjects: number
    total_departments: number
}

const statCards = (s: Stats) => [
    { label: 'Total Users', value: s.total_users, sub: `${s.active_users} active`, icon: Users, color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'Questions', value: s.total_questions, sub: 'In database', icon: FileText, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-50', text: 'text-purple-600' },
    { label: 'Exams Taken', value: s.total_exams, sub: 'All time', icon: BookOpen, color: 'from-green-500 to-emerald-500', bg: 'bg-green-50', text: 'text-green-600' },
    { label: 'Subjects', value: s.total_subjects, sub: `${s.total_departments} departments`, icon: Layers, color: 'from-orange-500 to-amber-500', bg: 'bg-orange-50', text: 'text-orange-600' },
]

const adminLinks = [
    { to: '/admin/users', label: 'Manage Users', desc: 'View, activate, or deactivate student accounts', icon: Users },
    { to: '/admin/content', label: 'Manage Content', desc: 'Add subjects and questions to the platform', icon: FileText },
]

export default function AdminDashboard() {
    const { user } = useAuth()
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        adminGetStats()
            .then((res) => setStats(res.data))
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-900">Admin Dashboard</h1>
                    <p className="text-gray-500 mt-1">Welcome back, <span className="font-semibold text-indigo-600">{user?.name}</span></p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-700 text-sm font-semibold">
                    <Shield className="w-4 h-4" />
                    Admin
                </div>
            </div>

            {/* Stats */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                            <div className="h-8 bg-gray-200 rounded w-1/3" />
                        </div>
                    ))}
                </div>
            ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards(stats).map((card) => {
                        const Icon = card.icon
                        return (
                            <div key={card.label} className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-200 hover:-translate-y-1">
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-12 h-12 ${card.bg} rounded-xl flex items-center justify-center`}>
                                        <Icon className={`w-6 h-6 ${card.text}`} />
                                    </div>
                                    <TrendingUp className="w-4 h-4 text-green-400" />
                                </div>
                                <p className="text-3xl font-extrabold text-gray-900">{card.value}</p>
                                <p className="text-sm font-semibold text-gray-700 mt-1">{card.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{card.sub}</p>
                            </div>
                        )
                    })}
                </div>
            ) : null}

            {/* Quick Links */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {adminLinks.map((link) => {
                        const Icon = link.icon
                        return (
                            <Link
                                key={link.to} to={link.to}
                                className="group flex items-center gap-5 bg-white rounded-2xl p-6 border border-gray-100 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-200 hover:-translate-y-1"
                            >
                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                    <Icon className="w-7 h-7 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-gray-900 text-lg">{link.label}</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">{link.desc}</p>
                                </div>
                                <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                            </Link>
                        )
                    })}
                </div>
            </div>

            {/* Back to student view */}
            <div className="pt-2">
                <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
                    ← Switch to Student View
                </Link>
            </div>
        </div>
    )
}
