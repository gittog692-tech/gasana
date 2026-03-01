import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search,
  Filter,
  Upload,
  FileText,
  TrendingUp,
  BookOpen,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { getDepartments, getSubjects, getQuestions, uploadPYQ, evaluateAnswer } from '../services/api'

interface QuickPracticeState {
  question: any | null;
  answer: string;
  evaluating: boolean;
  evaluationResult: any | null;
  error: string;
}

const PYQs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [departments, setDepartments] = useState<any[]>([])
  const [subjects, setSubjects] = useState<any[]>([])
  const [questions, setQuestions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  const [uploadSubjectId, setUploadSubjectId] = useState<number | ''>('')
  const [uploadYear, setUploadYear] = useState<number>(new Date().getFullYear())
  const [uploadMonth, setUploadMonth] = useState<'May' | 'November'>('May')
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  // Quick Practice Modal State
  const [quickPractice, setQuickPractice] = useState<QuickPracticeState>({
    question: null,
    answer: '',
    evaluating: false,
    evaluationResult: null,
    error: '',
  })

  // Filters
  const [selectedDept, setSelectedDept] = useState<number | ''>('')
  const [selectedSemester, setSelectedSemester] = useState<number | ''>('')
  const [selectedSubject, setSelectedSubject] = useState<number | ''>(
    searchParams.get('subject_id') ? parseInt(searchParams.get('subject_id')!) : ''
  )
  const [frequentOnly, setFrequentOnly] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [selectedDept, selectedSemester, selectedSubject, frequentOnly])

  useEffect(() => {
    const subjectFromQuery = searchParams.get('subject_id')
    const qFromQuery = searchParams.get('q')

    setSelectedSubject(subjectFromQuery ? parseInt(subjectFromQuery) : '')
    setSearchQuery(qFromQuery || '')
  }, [searchParams])

  const fetchInitialData = async () => {
    try {
      const [deptsRes, subjectsRes] = await Promise.all([
        getDepartments(),
        getSubjects()
      ])
      setDepartments(deptsRes.data)
      setSubjects(subjectsRes.data)
    } catch (error) {
      console.error('Error fetching initial data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchQuestions = async () => {
    try {
      const params: any = {}
      if (selectedDept) params.department_id = selectedDept
      if (selectedSemester) params.semester = selectedSemester
      if (selectedSubject) params.subject_id = selectedSubject
      if (frequentOnly) params.frequent_only = true

      const res = await getQuestions(params)
      setQuestions(res.data)
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const filteredQuestions = questions.filter(q =>
    q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (q.topics && q.topics.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase())))
  )

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    setUploadError('')
    setUploadSuccess('')

    if (!uploadSubjectId) {
      setUploadError('Please select a subject for this PYQ.')
      return
    }

    if (!uploadFile) {
      setUploadError('Please choose a PDF file to upload.')
      return
    }

    if (!uploadFile.name.toLowerCase().endsWith('.pdf')) {
      setUploadError('Only PDF files are supported.')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('subject_id', String(uploadSubjectId))
      formData.append('year', String(uploadYear))
      formData.append('month', uploadMonth)
      formData.append('file', uploadFile)

      const res = await uploadPYQ(formData)
      setUploadSuccess(res.data?.message || 'PYQ uploaded successfully.')

      await fetchQuestions()
      setShowUploadModal(false)
      setUploadFile(null)
    } catch (error: any) {
      const detail = error?.response?.data?.detail
      setUploadError(typeof detail === 'string' ? detail : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleSearchInput = (value: string) => {
    setSearchQuery(value)
    const next = new URLSearchParams(searchParams)
    if (value.trim()) next.set('q', value)
    else next.delete('q')
    setSearchParams(next, { replace: true })
  }

  const handleQuickPracticeSubmit = async () => {
    if (!quickPractice.question || !quickPractice.answer.trim()) return;

    setQuickPractice(prev => ({ ...prev, evaluating: true, error: '' }));
    try {
      const res = await evaluateAnswer({
        question: quickPractice.question.content,
        student_answer: quickPractice.answer,
        max_marks: quickPractice.question.marks || 10
      });
      setQuickPractice(prev => ({ ...prev, evaluationResult: res.data }));
    } catch (error) {
      console.error('Error submitting quick practice:', error);
      setQuickPractice(prev => ({ ...prev, error: 'Failed to evaluate answer. Try again.' }));
    } finally {
      setQuickPractice(prev => ({ ...prev, evaluating: false }));
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Previous Year Questions</h1>
          <p className="text-gray-600 mt-1">Browse and practice PYQs from all years</p>
        </div>
        <button
          onClick={() => {
            setUploadError('')
            setUploadSuccess('')
            setUploadFile(null)
            setShowUploadModal(true)
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload PYQ
        </button>
      </div>

      {/* Filters */}
      {uploadSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4" /> {uploadSuccess}
        </div>
      )}

      <div className="bg-white p-4 rounded-xl shadow-sm border space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="font-semibold text-gray-900">Filters</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value ? parseInt(e.target.value) : '')}
              className="select"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value ? parseInt(e.target.value) : '')}
              className="select"
            >
              <option value="">All Semesters</option>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                const nextSubject = e.target.value ? parseInt(e.target.value) : ''
                setSelectedSubject(nextSubject)
                const next = new URLSearchParams(searchParams)
                if (nextSubject) next.set('subject_id', String(nextSubject))
                else next.delete('subject_id')
                setSearchParams(next, { replace: true })
              }}
              className="select"
            >
              <option value="">All Subjects</option>
              {subjects
                .filter(s => !selectedDept || s.department_id === selectedDept)
                .filter(s => !selectedSemester || s.semester === selectedSemester)
                .map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
            </select>
          </div>

          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={frequentOnly}
                onChange={(e) => setFrequentOnly(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Frequent questions only</span>
            </label>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search questions or topics..."
            value={searchQuery}
            onChange={(e) => handleSearchInput(e.target.value)}
            className="input pl-10"
          />
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-semibold text-gray-900">{filteredQuestions.length}</span> questions
        </p>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {filteredQuestions.map((question, index) => (
          <div
            key={question.id}
            className="bg-white p-6 rounded-xl shadow-sm border card-hover animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-primary">
                    {question.marks} marks
                  </span>
                  <span className="badge bg-gray-100 text-gray-700">
                    {question.year} {question.month}
                  </span>
                  {question.frequency_score >= 2 && (
                    <span className="badge badge-warning flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Frequent
                    </span>
                  )}
                  {question.subject && (
                    <span className="badge bg-gray-100 text-gray-700">
                      {question.subject.name}
                    </span>
                  )}
                </div>

                <p className="text-gray-900 font-medium mb-3">{question.content}</p>

                {question.topics && question.topics.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {question.topics.map((topic: string, i: number) => (
                      <span
                        key={i}
                        className="text-xs px-2 py-1 bg-primary-50 text-primary-700 rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setQuickPractice(prev => ({ ...prev, question }))}
                className="btn btn-outline text-sm whitespace-nowrap"
              >
                <BookOpen className="w-4 h-4" />
                Practice
              </button>
            </div>
          </div>
        ))}

        {filteredQuestions.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No questions found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or upload new PYQs</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn btn-primary"
            >
              Upload PYQ PDF
            </button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Upload PYQ PDF</h2>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              {uploadError && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4" /> {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                  <CheckCircle2 className="w-4 h-4" /> {uploadSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <select
                  value={uploadSubjectId}
                  onChange={(e) => setUploadSubjectId(e.target.value ? parseInt(e.target.value) : '')}
                  className="select"
                >
                  <option value="">Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    className="select"
                    value={uploadYear}
                    onChange={(e) => setUploadYear(parseInt(e.target.value))}
                  >
                    <option value="">Select Year</option>
                    {[2024, 2023, 2022, 2021, 2020].map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <select
                    className="select"
                    value={uploadMonth}
                    onChange={(e) => setUploadMonth(e.target.value as 'May' | 'November')}
                  >
                    <option value="May">May</option>
                    <option value="November">November</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PDF File</label>
                <label className="block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-teal-500 transition-colors cursor-pointer">
                  <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload</p>
                  <p className="text-xs text-gray-400 mt-1">PDF files only</p>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  />
                </label>
                {uploadFile && (
                  <p className="text-xs text-slate-600 mt-2 truncate">Selected: {uploadFile.name}</p>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 btn btn-secondary"
                  disabled={uploading}
                >
                  Cancel
                </button>
                <button type="submit" className="flex-1 btn btn-primary" disabled={uploading}>
                  {uploading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </span>
                  ) : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Practice Modal */}
      {quickPractice.question && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col animate-fade-in">
            <div className="p-6 border-b flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="badge badge-primary">{quickPractice.question.marks} marks</span>
                  <span className="badge bg-gray-100 text-gray-700">
                    {quickPractice.question.subject?.name || 'Subject'}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900 leading-relaxed">
                  {quickPractice.question.content}
                </h2>
              </div>
              <button
                onClick={() => setQuickPractice({ question: null, answer: '', evaluating: false, evaluationResult: null, error: '' })}
                className="p-2 hover:bg-gray-100 rounded-lg shrink-0 self-end md:self-start"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              {!quickPractice.evaluationResult ? (
                <div className="space-y-4 h-full flex flex-col">
                  {quickPractice.error && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4" /> {quickPractice.error}
                    </div>
                  )}

                  <label className="block text-sm font-medium text-gray-700">Your Answer</label>
                  <textarea
                    value={quickPractice.answer}
                    onChange={(e) => setQuickPractice(prev => ({ ...prev, answer: e.target.value }))}
                    placeholder="Type your answer here for an instant AI evaluation..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 min-h-[250px] resize-y"
                  />

                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={handleQuickPracticeSubmit}
                      disabled={!quickPractice.answer.trim() || quickPractice.evaluating}
                      className="btn btn-primary min-w-[140px]"
                    >
                      {quickPractice.evaluating ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Evaluating...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4" /> Submit Answer
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between pb-6 border-b border-slate-100">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">Evaluation Report</h3>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black text-teal-700 tracking-tight">
                        {quickPractice.evaluationResult.grade}<span className="text-xl text-slate-400">/{quickPractice.evaluationResult.max_marks}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 rounded-2xl bg-blue-50">
                      <div className="text-xl font-black text-blue-600 mb-1">{quickPractice.evaluationResult.content_score}%</div>
                      <div className="text-xs font-bold text-slate-500 uppercase">Content</div>
                    </div>
                    <div className="text-center p-4 rounded-2xl bg-emerald-50">
                      <div className="text-xl font-black text-emerald-600 mb-1">{quickPractice.evaluationResult.structure_score}%</div>
                      <div className="text-xs font-bold text-slate-500 uppercase">Structure</div>
                    </div>
                    <div className="text-center p-4 rounded-2xl bg-cyan-50">
                      <div className="text-xl font-black text-cyan-700 mb-1">{quickPractice.evaluationResult.key_points_score}%</div>
                      <div className="text-xs font-bold text-slate-500 uppercase">Key Points</div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-2xl">
                    <h4 className="font-bold text-slate-800 mb-2">Feedback</h4>
                    <p className="text-sm text-slate-600 leading-relaxed">{quickPractice.evaluationResult.feedback}</p>
                  </div>

                  {quickPractice.evaluationResult.improvements?.length > 0 && (
                    <div>
                      <h4 className="font-bold text-slate-800 mb-3">Missed Points</h4>
                      <div className="space-y-2">
                        {quickPractice.evaluationResult.improvements.map((imp: string, i: number) => (
                          <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                            {imp}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-bold text-slate-800 mb-3">Model Answer</h4>
                    <div className="p-5 bg-teal-50/50 rounded-2xl text-sm text-slate-700 leading-relaxed border border-teal-50 whitespace-pre-wrap">
                      {quickPractice.evaluationResult.suggested_answer}
                    </div>
                  </div>

                  <div className="pt-4 pb-2 text-center">
                    <button
                      onClick={() => setQuickPractice(prev => ({ ...prev, evaluationResult: null, answer: '' }))}
                      className="btn btn-outline text-sm"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PYQs
