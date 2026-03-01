import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen, FileText, Brain, TrendingUp, Award, Clock, ArrowRight,
  ChevronRight, PlayCircle, Target
} from 'lucide-react'
import { getSubjects, getUserExams } from '../services/api'
import { useAuth } from '../context/AuthContext' // Keep useAuth as it's used in the original file for user?.name

interface Stats {
  totalQuestions: number
  examsTaken: number
  averageScore: number
}

const DASHBOARD_CACHE_KEY = 'ktu_dashboard_cache_v1'

const Dashboard: React.FC = () => {
  const { user } = useAuth() // Keep user from AuthContext
  const [stats, setStats] = useState<Stats>({
    totalQuestions: 0,
    examsTaken: 0,
    averageScore: 0,
  })
  const [subjects, setSubjects] = useState<any[]>([])
  const [recentExams, setRecentExams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = sessionStorage.getItem(DASHBOARD_CACHE_KEY)
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        if (parsed?.stats) setStats(parsed.stats)
        if (Array.isArray(parsed?.subjects)) setSubjects(parsed.subjects)
        if (Array.isArray(parsed?.recentExams)) setRecentExams(parsed.recentExams)
        setLoading(false)
      } catch {
        // ignore bad cache
      }
    }
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [subjectsRes, examsRes] = await Promise.all([
        getSubjects(),
        getUserExams()
      ])

      const safeSubjects = Array.isArray(subjectsRes.data) ? subjectsRes.data : []
      const safeExams = Array.isArray(examsRes.data) ? examsRes.data : []
      const completedExams = safeExams.filter((exam: any) => exam?.status === 'completed')

      setSubjects(safeSubjects)
      setRecentExams(safeExams.slice(0, 5))

      setStats({
        totalQuestions: safeSubjects.length > 0 ? safeSubjects.reduce((acc: number, s: any) => acc + (s.question_count ?? 0), 0) : 0,
        examsTaken: safeExams.length,
        averageScore: completedExams.length > 0
          ? completedExams.reduce((acc: number, exam: any) => {
              const total = Number(exam?.total_marks ?? 0)
              const obtained = Number(exam?.obtained_marks ?? 0)
              if (!Number.isFinite(total) || total <= 0) return acc
              return acc + ((obtained / total) * 100)
            }, 0) / completedExams.length
          : 0,
      })

      sessionStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify({
        stats: {
          totalQuestions: safeSubjects.length > 0 ? safeSubjects.reduce((acc: number, s: any) => acc + (s.question_count ?? 0), 0) : 0,
          examsTaken: safeExams.length,
          averageScore: completedExams.length > 0
            ? completedExams.reduce((acc: number, exam: any) => {
                const total = Number(exam?.total_marks ?? 0)
                const obtained = Number(exam?.obtained_marks ?? 0)
                if (!Number.isFinite(total) || total <= 0) return acc
                return acc + ((obtained / total) * 100)
              }, 0) / completedExams.length
            : 0,
        },
        subjects: safeSubjects,
        recentExams: safeExams.slice(0, 5),
      }))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Practice PYQs',
      description: 'Start solving previous year questions',
      icon: FileText,
      path: '/pyqs',
    },
    {
      title: 'Take Mock Exam',
      description: 'Simulate a real KTU exam environment',
      icon: BookOpen,
      path: '/exam',
    },
    {
      title: 'Ask AI Tutor',
      description: 'Clear your doubts instantly with AI',
      icon: Brain,
      path: '/ai-helper',
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Welcome back, {user?.name?.split(' ')[0] || 'Student'}</h1>
          <p className="text-slate-500 text-sm mt-1">Track your progress and stay ahead of the curve.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/exam" className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2">
            <PlayCircle className="w-4 h-4" /> Start Exam
          </Link>
        </div>
      </div>

      {/* Weekly Focus Alert */}
      <div className="bg-teal-50 border border-teal-100/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-teal-900">Weekly Study Focus</h3>
            <p className="text-sm text-teal-700">Target one weak subject this week and attempt at least one timed mock test.</p>
          </div>
        </div>
        <Link to="/exam" className="shrink-0 px-4 py-2 bg-white text-teal-700 text-sm font-bold rounded-xl border border-teal-100 hover:bg-white transition-colors shadow-sm w-full sm:w-auto text-center">
          Start Mock
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Questions', value: stats.totalQuestions, icon: FileText },
          { label: 'Exams Taken', value: stats.examsTaken, icon: BookOpen },
          { label: 'Average Score', value: `${stats.averageScore.toFixed(1)}%`, icon: TrendingUp },
          { label: 'Active Subjects', value: subjects.length, icon: Award },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 rounded-xl bg-slate-50 text-slate-700 border border-slate-100/50">
                <stat.icon className="w-5 h-5" />
              </div>
              {i === 2 && <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-2.5 py-1 rounded-full">+2.4%</span>}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">{stat.value}</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions (Full Width Row) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            to={action.path}
            className="flex items-center gap-4 p-5 rounded-2xl border border-slate-100 bg-white hover:border-slate-300 transition-all group shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
          >
            <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-100 transition-colors border border-slate-100/50">
              <action.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-0.5 group-hover:text-black transition-colors">{action.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{action.description}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Split (50/50) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-12">
        {/* Recent Activity */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">Recent Exam Results</h2>
            <Link to="/results" className="text-slate-500 text-sm font-semibold hover:text-black flex items-center gap-1 transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex-1">
            {recentExams.length > 0 ? (
              <div className="space-y-3">
                {recentExams.map((exam) => (
                  <div key={exam.id} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{exam.subject?.name || 'Subject Test'}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">{new Date(exam.started_at).toLocaleDateString()} • {exam.total_marks} Marks</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {exam.status === 'completed' ? (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${(Number(exam.obtained_marks || 0) / Number(exam.total_marks || 1)) >= 0.75 ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/50' :
                          (Number(exam.obtained_marks || 0) / Number(exam.total_marks || 1)) >= 0.4 ? 'bg-amber-50 text-amber-700 border border-amber-100/50' :
                            'bg-red-50 text-red-700 border border-red-100/50'
                          }`}>
                          {((Number(exam.obtained_marks || 0) / Number(exam.total_marks || 1)) * 100).toFixed(0)}%
                        </span>
                      ) : (
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          In Progress
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3 border border-slate-100">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="text-slate-900 font-bold">No exams taken yet</h3>
                <p className="text-slate-500 text-sm mb-4 max-w-xs">Start a mock exam to see your analytics here.</p>
                <Link to="/exam" className="text-black font-bold text-sm hover:underline">Start Mock Exam</Link>
              </div>
            )}
          </div>
        </div>

        {/* Subjects List */}
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 p-6 flex flex-col h-full">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-900">My Subjects</h2>
          </div>

          <div className="flex-1 flex flex-col">
            <div className="space-y-3 flex-1">
              {subjects.slice(0, 5).map((subject) => (
                <Link key={subject.id} to={`/pyqs?subject_id=${subject.id}`} className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-50 border border-slate-100 transition-all group">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900 text-sm">{subject.code}</span>
                    <p className="text-xs text-slate-500 line-clamp-1">{subject.name}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center group-hover:border-slate-300 transition-colors shrink-0">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-black transition-transform group-hover:translate-x-0.5" />
                  </div>
                </Link>
              ))}
              {subjects.length === 0 && (
                <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex-1 flex items-center justify-center hidden">
                  <p className="text-sm font-medium text-slate-500">No subjects enrolled.</p>
                </div>
              )}
            </div>

            {subjects.length > 5 && (
              <Link to="/pyqs" className="w-full mt-4 py-3 text-xs flex justify-center font-bold text-slate-600 hover:text-black hover:bg-slate-50 rounded-xl transition-colors border border-slate-100">
                View All Subjects
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
