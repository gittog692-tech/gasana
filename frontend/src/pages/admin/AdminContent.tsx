import React, { useEffect, useState } from 'react'
import { Plus, BookOpen, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import {
    adminGetDepartments, adminGetSubjects,
    adminCreateSubject, adminCreateQuestion
} from '../../services/api'

interface Department { id: number; name: string; code: string }
interface Subject { id: number; name: string; code: string; semester: number; department_id: number }

type Tab = 'subject' | 'question'

export default function AdminContent() {
    const [tab, setTab] = useState<Tab>('subject')
    const [departments, setDepartments] = useState<Department[]>([])
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')

    const [subjectForm, setSubjectForm] = useState({ name: '', code: '', semester: '', department_id: '' })
    const [questionForm, setQuestionForm] = useState({
        content: '', marks: '', year: '', month: 'May', subject_id: '', topics: ''
    })

    useEffect(() => {
        adminGetDepartments().then((r) => setDepartments(r.data)).catch(console.error)
        adminGetSubjects().then((r) => setSubjects(r.data)).catch(console.error)
    }, [])

    const showMsg = (msg: string, isError = false) => {
        if (isError) { setError(msg); setSuccess('') }
        else { setSuccess(msg); setError('') }
        setTimeout(() => { setSuccess(''); setError('') }, 4000)
    }

    const handleSubjectSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await adminCreateSubject({
                name: subjectForm.name,
                code: subjectForm.code,
                semester: Number(subjectForm.semester),
                department_id: Number(subjectForm.department_id),
            })
            showMsg('Subject created successfully!')
            setSubjectForm({ name: '', code: '', semester: '', department_id: '' })
            const res = await adminGetSubjects()
            setSubjects(res.data)
        } catch (err: any) {
            showMsg(err.response?.data?.detail || 'Failed to create subject', true)
        } finally {
            setLoading(false)
        }
    }

    const handleQuestionSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await adminCreateQuestion({
                content: questionForm.content,
                marks: Number(questionForm.marks),
                year: Number(questionForm.year),
                month: questionForm.month,
                subject_id: Number(questionForm.subject_id),
                topics: questionForm.topics ? questionForm.topics.split(',').map((t) => t.trim()) : [],
            })
            showMsg('Question added successfully!')
            setQuestionForm({ content: '', marks: '', year: '', month: 'May', subject_id: '', topics: '' })
        } catch (err: any) {
            showMsg(err.response?.data?.detail || 'Failed to add question', true)
        } finally {
            setLoading(false)
        }
    }

    const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-900 text-sm transition-all"
    const labelCls = "block text-sm font-semibold text-gray-700 mb-1.5"

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-extrabold text-gray-900">Content Management</h1>
                <p className="text-gray-500 mt-1">Add subjects and questions to the platform</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                {(['subject', 'question'] as Tab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${tab === t
                                ? 'bg-white text-indigo-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {t === 'subject' ? <BookOpen className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                        {t === 'subject' ? 'Add Subject' : 'Add Question'}
                    </button>
                ))}
            </div>

            {/* Feedback */}
            {success && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> {success}
                </div>
            )}
            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
                </div>
            )}

            {/* Subject Form */}
            {tab === 'subject' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-lg">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">New Subject</h2>
                    <form onSubmit={handleSubjectSubmit} className="space-y-4">
                        <div>
                            <label className={labelCls}>Subject Name</label>
                            <input className={inputCls} placeholder="e.g. Operating Systems" required
                                value={subjectForm.name} onChange={(e) => setSubjectForm(p => ({ ...p, name: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelCls}>Subject Code</label>
                                <input className={inputCls} placeholder="e.g. CST301" required
                                    value={subjectForm.code} onChange={(e) => setSubjectForm(p => ({ ...p, code: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelCls}>Semester</label>
                                <select className={inputCls} required
                                    value={subjectForm.semester} onChange={(e) => setSubjectForm(p => ({ ...p, semester: e.target.value }))}>
                                    <option value="">Select</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Department</label>
                            <select className={inputCls} required
                                value={subjectForm.department_id} onChange={(e) => setSubjectForm(p => ({ ...p, department_id: e.target.value }))}>
                                <option value="">Select department</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name} ({d.code})</option>)}
                            </select>
                        </div>
                        <button type="submit" disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-60">
                            <Plus className="w-4 h-4" />
                            {loading ? 'Creating…' : 'Create Subject'}
                        </button>
                    </form>
                </div>
            )}

            {/* Question Form */}
            {tab === 'question' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-2xl">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">New Question</h2>
                    <form onSubmit={handleQuestionSubmit} className="space-y-4">
                        <div>
                            <label className={labelCls}>Question Content</label>
                            <textarea className={`${inputCls} resize-none`} rows={4} required
                                placeholder="Enter the full question text…"
                                value={questionForm.content} onChange={(e) => setQuestionForm(p => ({ ...p, content: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className={labelCls}>Marks</label>
                                <input type="number" className={inputCls} placeholder="7" min={1} max={100} required
                                    value={questionForm.marks} onChange={(e) => setQuestionForm(p => ({ ...p, marks: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelCls}>Year</label>
                                <input type="number" className={inputCls} placeholder="2024" min={2000} max={2030} required
                                    value={questionForm.year} onChange={(e) => setQuestionForm(p => ({ ...p, year: e.target.value }))} />
                            </div>
                            <div>
                                <label className={labelCls}>Month</label>
                                <select className={inputCls} value={questionForm.month}
                                    onChange={(e) => setQuestionForm(p => ({ ...p, month: e.target.value }))}>
                                    <option value="May">May</option>
                                    <option value="November">November</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className={labelCls}>Subject</label>
                            <select className={inputCls} required
                                value={questionForm.subject_id} onChange={(e) => setQuestionForm(p => ({ ...p, subject_id: e.target.value }))}>
                                <option value="">Select subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className={labelCls}>Topics <span className="text-gray-400 font-normal">(comma-separated)</span></label>
                            <input className={inputCls} placeholder="e.g. Deadlock, Process, Algorithm"
                                value={questionForm.topics} onChange={(e) => setQuestionForm(p => ({ ...p, topics: e.target.value }))} />
                        </div>
                        <button type="submit" disabled={loading}
                            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-indigo-200 transition-all disabled:opacity-60">
                            <Plus className="w-4 h-4" />
                            {loading ? 'Adding…' : 'Add Question'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}
