import React, { useState, useEffect, useRef } from 'react'
import {
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Upload,
  Play,
  RotateCcw,
  CheckCircle,
  BookOpen,
  FileText,
  List,
  RefreshCw,
  Clock as ClockIcon
} from 'lucide-react'
import { getSubjects, createSimulatedExam, submitAttempt, submitExam, uploadExamAnswerImage, getExamResults } from '../services/api'

interface ExamConfig {
  subject_id: number
  num_questions: number
  duration_minutes: number
  include_frequent: boolean
  include_predicted: boolean
  generate_mcqs: boolean
  allow_written: boolean
}

const ExamSimulation: React.FC = () => {
  const [subjects, setSubjects] = useState<any[]>([])
  const [examData, setExamData] = useState<any>(null)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<{ [key: number]: string }>({})
  const [mcqAnswers, setMcqAnswers] = useState<{ [key: number]: string }>({})
  const [answerModes, setAnswerModes] = useState<{ [key: number]: 'mcq' | 'written' }>({})
  const [uploadedAnswerImages, setUploadedAnswerImages] = useState<{ [key: number]: { path: string; url: string; name: string } }>({})
  const [uploadingQuestionId, setUploadingQuestionId] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [isExamActive, setIsExamActive] = useState(false)
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
  const [examFinished, setExamFinished] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [resultDetails, setResultDetails] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionProgress, setSubmissionProgress] = useState({ current: 0, total: 0 })
  const [subjectsLoading, setSubjectsLoading] = useState(true)
  const [subjectsError, setSubjectsError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [config, setConfig] = useState<ExamConfig>({
    subject_id: 0,
    num_questions: 5,
    duration_minutes: 60,
    include_frequent: true,
    include_predicted: true,
    generate_mcqs: true,
    allow_written: true
  })
  const [isPreparingExam, setIsPreparingExam] = useState(false)
  const [preparationStep, setPreparationStep] = useState(0)
  const answerImageInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSubjects()
  }, [])

  useEffect(() => {
    const onFocus = () => {
      if (subjects.length === 0 && !subjectsLoading) {
        fetchSubjects()
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [subjects.length, subjectsLoading])

  useEffect(() => {
    let timer: any
    if (isExamActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitExam()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(timer)
  }, [isExamActive, timeLeft])

  const fetchSubjects = async () => {
    setSubjectsLoading(true)
    setSubjectsError('')
    try {
      const res = await getSubjects()
      const subjectList = Array.isArray(res.data) ? res.data : []
      setSubjects(subjectList)
      if (subjectList.length === 0) {
        setSubjectsError('No subjects available right now. Please reload.')
      }
    } catch (error) {
      console.error('Error fetching subjects:', error)
      setSubjectsError('Failed to load subjects. Please retry.')
    } finally {
      setSubjectsLoading(false)
    }
  }

  const startExam = async () => {
    setErrorMessage('')
    if (!config.subject_id) {
      setErrorMessage('Please select a subject before starting the exam.')
      return
    }

    // Show preparation animation
    setIsPreparingExam(true)
    setPreparationStep(0)

    // Animate through preparation steps
    const steps = [
      'Analyzing question patterns...',
      'Selecting optimal questions...',
      'Generating MCQ options...',
      'Preparing exam environment...',
      'Ready to start!'
    ]

    for (let i = 0; i < steps.length - 1; i++) {
      setPreparationStep(i)
      await new Promise(resolve => setTimeout(resolve, 800))
    }

    try {
      const res = await createSimulatedExam({
        subject_id: config.subject_id,
        num_questions: config.num_questions,
        duration_minutes: config.duration_minutes,
        include_frequent: config.include_frequent,
        include_predicted: config.include_predicted,
        is_adaptive: false,
        generate_mcqs: config.generate_mcqs,
        allow_written: config.allow_written
      })

      setPreparationStep(steps.length - 1)
      await new Promise(resolve => setTimeout(resolve, 500))

      setExamData(res.data)
      setTimeLeft(config.duration_minutes * 60)
      setIsExamActive(true)
      setCurrentQuestionIndex(0)
      setAnswers({})
      setMcqAnswers({})
      setAnswerModes({})
      setUploadedAnswerImages({})
    } catch (error) {
      console.error('Error starting exam:', error)
      setErrorMessage('Failed to start exam. Please try again.')
    } finally {
      setIsPreparingExam(false)
    }
  }

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }))
  }

  const handleMcqSelect = (questionId: number, option: string) => {
    setMcqAnswers(prev => ({ ...prev, [questionId]: option }))
  }

  const toggleAnswerMode = (questionId: number) => {
    setAnswerModes(prev => ({
      ...prev,
      [questionId]: prev[questionId] === 'mcq' ? 'written' : 'mcq'
    }))
  }

  const handleSubmitExam = async () => {
    if (!examData) return

    setIsExamActive(false)
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const answerableQuestions = (examData.questions || []).filter((question: any) => {
        const textAnswer = answers[question.id]?.trim() || ''
        const mcqAnswer = mcqAnswers[question.id]
        const image = uploadedAnswerImages[question.id]
        return Boolean(textAnswer || mcqAnswer || image?.path)
      })
      setSubmissionProgress({ current: 0, total: answerableQuestions.length })

      // Submit all answers (MCQ, typed, and/or handwritten)
      for (let i = 0; i < (examData.questions || []).length; i++) {
        const question = examData.questions[i]
        const textAnswer = answers[question.id]?.trim() || ''
        const mcqAnswer = mcqAnswers[question.id]
        const image = uploadedAnswerImages[question.id]

        if (!textAnswer && !mcqAnswer && !image?.path) {
          continue
        }

        await submitAttempt({
          exam_id: examData.exam_id,
          question_id: question.id,
          answer_text: textAnswer || undefined,
          mcq_answer: mcqAnswer || undefined,
          answer_image_path: image?.path
        })
        setSubmissionProgress(prev => ({ ...prev, current: Math.min(prev.current + 1, prev.total) }))
      }

      // Submit exam
      const res = await submitExam(examData.exam_id)
      setResults(res.data)

      // Fetch detailed results for same page breakdown
      try {
        const detailRes = await getExamResults(examData.exam_id)
        setResultDetails(detailRes.data)
      } catch (detailError) {
        console.error('Error fetching exam details:', detailError)
        setResultDetails(null)
      }

      setExamFinished(true)
    } catch (error: any) {
      console.error('Error submitting exam:', error)
      setIsExamActive(true)
      setErrorMessage(error?.response?.data?.detail || 'Failed to submit exam. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUploadHandwrittenAnswer = async (file: File) => {
    if (!examData || !currentQuestion) return

    setErrorMessage('')
    setUploadingQuestionId(currentQuestion.id)
    try {
      const res = await uploadExamAnswerImage(examData.exam_id, currentQuestion.id, file)
      const payload = res.data
      setUploadedAnswerImages(prev => ({
        ...prev,
        [currentQuestion.id]: {
          path: payload.path,
          url: payload.url,
          name: payload.original_name || file.name
        }
      }))
      // Switch to written mode if image uploaded
      setAnswerModes(prev => ({ ...prev, [currentQuestion.id]: 'written' }))
    } catch (error: any) {
      console.error('Error uploading handwritten answer:', error)
      setErrorMessage(error?.response?.data?.detail || 'Failed to upload handwritten answer.')
    } finally {
      setUploadingQuestionId(null)
      if (answerImageInputRef.current) {
        answerImageInputRef.current.value = ''
      }
    }
  }

  const countAnsweredQuestions = () => {
    if (!examData?.questions) return 0
    return examData.questions.filter((q: any) => {
      const textAnswer = (answers[q.id] || '').trim()
      const mcqAnswer = mcqAnswers[q.id]
      return Boolean(textAnswer || mcqAnswer || uploadedAnswerImages[q.id])
    }).length
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours > 0 ? hours + ':' : ''}${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const currentQuestion = examData?.questions?.[currentQuestionIndex]

  const refreshResults = async () => {
    if (!examData?.exam_id) return
    try {
      const detailRes = await getExamResults(examData.exam_id)
      setResultDetails(detailRes.data)
    } catch (err) {
      console.error('Failed to refresh results:', err)
    }
  }

  if (examFinished && results) {
    const allEvaluated = resultDetails?.attempts?.every((a: any) => a.evaluation_status === 'completed')
    const hasPending = resultDetails?.attempts?.some((a: any) => a.evaluation_status === 'pending' || a.evaluation_status === 'evaluating')

    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 text-center">
          <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-teal-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Exam Completed!</h1>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">Great job finishing the exam. Your performance has been recorded.</p>

          {hasPending && (
            <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-full text-sm font-medium border border-amber-100">
              <ClockIcon className="w-4 h-4 animate-pulse" />
              Some answers are still being evaluated. Refresh to see updates.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto mb-10">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Total Marks</p>
              <p className="text-4xl font-black text-slate-900">{results.obtained_marks}</p>
            </div>
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Out Of</p>
              <p className="text-4xl font-black text-slate-900">{results.total_marks}</p>
            </div>
            <div className="bg-teal-50 p-6 rounded-2xl border border-teal-100">
              <p className="text-xs font-bold uppercase tracking-wider text-teal-600 mb-2">Percentage</p>
              <p className="text-4xl font-black text-teal-600">{results.percentage.toFixed(1)}%</p>
            </div>
          </div>

          {resultDetails?.attempts?.length > 0 && (
            <div className="text-left max-w-3xl mx-auto mb-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-900">Question-wise Result</h3>
                {hasPending && (
                  <button
                    onClick={refreshResults}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {resultDetails.attempts.map((attempt: any, index: number) => {
                  const marks = Number(attempt.marks || 0)
                  const obtained = Number(attempt.obtained || 0)
                  const ratio = marks > 0 ? obtained / marks : 0
                  const isPending = attempt.evaluation_status === 'pending' || attempt.evaluation_status === 'evaluating'
                  const isFailed = attempt.evaluation_status === 'failed'

                  return (
                    <div key={`${attempt.question_id}-${index}`} className={`rounded-2xl border p-4 ${isPending ? 'bg-amber-50 border-amber-100' : isFailed ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                        <h4 className="font-semibold text-slate-900">Q{index + 1}. {attempt.question}</h4>
                        <div className="flex items-center gap-2">
                          {isPending ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                              <ClockIcon className="w-3 h-3 animate-pulse" />
                              Evaluating...
                            </span>
                          ) : isFailed ? (
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                              Failed
                            </span>
                          ) : (
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold border ${ratio >= 0.75
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              : ratio >= 0.4
                                ? 'bg-amber-50 text-amber-700 border-amber-100'
                                : 'bg-red-50 text-red-700 border-red-100'
                              }`}>
                              {obtained}/{marks}
                            </span>
                          )}
                        </div>
                      </div>
                      {attempt.feedback && !isPending && (
                        <p className="text-sm text-slate-600">{attempt.feedback}</p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setExamFinished(false)
              setExamData(null)
              setResults(null)
              setResultDetails(null)
            }}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-black text-white font-bold hover:bg-slate-800 transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Take Another Exam
          </button>
        </div>
      </div>
    )
  }

  if (isPreparingExam) {
    const preparationSteps = [
      'Analyzing question patterns...',
      'Selecting optimal questions...',
      'Generating MCQ options...',
      'Preparing exam environment...',
      'Ready to start!'
    ]

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-12 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 text-center">
          <div className="relative w-24 h-24 mx-auto mb-8">
            {/* Animated rings */}
            <div className="absolute inset-0 rounded-full border-4 border-teal-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-teal-200 border-b-transparent animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            <div className="absolute inset-4 rounded-full bg-teal-50 flex items-center justify-center">
              <Clock className="w-8 h-8 text-teal-600 animate-pulse" />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2">AI is Preparing Your Exam</h2>
          <p className="text-slate-500 mb-8">Please wait while we generate optimized questions and MCQ options for you.</p>

          <div className="space-y-3 max-w-md mx-auto">
            {preparationSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
                  index < preparationStep
                    ? 'bg-emerald-50 text-emerald-700'
                    : index === preparationStep
                    ? 'bg-teal-50 text-teal-700 border-2 border-teal-200'
                    : 'bg-slate-50 text-slate-400'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  index < preparationStep
                    ? 'bg-emerald-500 text-white'
                    : index === preparationStep
                    ? 'bg-teal-500 text-white animate-pulse'
                    : 'bg-slate-200 text-slate-400'
                }`}>
                  {index < preparationStep ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span className="text-sm font-medium">{step}</span>
                {index === preparationStep && (
                  <div className="ml-auto">
                    <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8 text-xs text-slate-400">
            This usually takes 5-10 seconds depending on the number of questions
          </div>
        </div>
      </div>
    )
  }

  if (!isExamActive) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Mock Exam</h1>
          <p className="text-slate-500 mt-1">Simulate real exam conditions to prepare effectively.</p>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100 space-y-8">
          {errorMessage && (
            <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {errorMessage}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2 ml-1">
              <label className="block text-sm font-bold text-slate-700">Subject</label>
              <button
                type="button"
                onClick={fetchSubjects}
                disabled={subjectsLoading}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50"
              >
                {subjectsLoading ? 'Loading...' : 'Reload'}
              </button>
            </div>
            <div className="relative">
              <select
                value={config.subject_id}
                onChange={(e) => setConfig({ ...config, subject_id: parseInt(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 appearance-none transition-all font-medium"
              >
                <option value={0} disabled>{subjectsLoading ? 'Loading subjects...' : 'Select Subject'}</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name} ({subject.code})</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                <BookOpen className="w-4 h-4 text-slate-400" />
              </div>
            </div>
            {subjectsError && (
              <p className="text-xs text-red-600 mt-2">{subjectsError}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Questions</label>
              <select
                value={config.num_questions}
                onChange={(e) => setConfig({ ...config, num_questions: parseInt(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 appearance-none transition-all font-medium"
              >
                {[3, 5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>{n} questions</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Duration</label>
              <select
                value={config.duration_minutes}
                onChange={(e) => setConfig({ ...config, duration_minutes: parseInt(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 appearance-none transition-all font-medium"
              >
                {[30, 45, 60, 90, 120, 180].map((m) => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.generate_mcqs ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                {config.generate_mcqs && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={config.generate_mcqs}
                onChange={(e) => setConfig({ ...config, generate_mcqs: e.target.checked })}
                className="hidden"
              />
              <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Generate AI MCQ options</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.allow_written ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                {config.allow_written && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={config.allow_written}
                onChange={(e) => setConfig({ ...config, allow_written: e.target.checked })}
                className="hidden"
              />
              <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Allow written answers</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.include_frequent ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                {config.include_frequent && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={config.include_frequent}
                onChange={(e) => setConfig({ ...config, include_frequent: e.target.checked })}
                className="hidden"
              />
              <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Include frequently asked questions</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${config.include_predicted ? 'bg-teal-500 border-teal-500' : 'border-slate-300 bg-white group-hover:border-slate-400'}`}>
                {config.include_predicted && <CheckCircle className="w-3.5 h-3.5 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={config.include_predicted}
                onChange={(e) => setConfig({ ...config, include_predicted: e.target.checked })}
                className="hidden"
              />
              <span className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">Include AI-predicted questions</span>
            </label>
          </div>

          <button
            onClick={startExam}
            disabled={!config.subject_id || subjects.length === 0}
            className="w-full bg-black text-white font-bold text-lg py-4 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-white" />
            Start Exam
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {errorMessage && (
        <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {errorMessage}
        </div>
      )}

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-bold text-slate-900 text-lg">{examData?.subject}</h2>
          <p className="text-sm text-slate-500 font-medium">Question {currentQuestionIndex + 1} of {examData?.questions?.length}</p>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-lg font-bold transition-colors ${timeLeft < 300
          ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse'
          : 'bg-slate-50 text-slate-700 border border-slate-100'
          }`}>
          <Clock className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200/50">
        <div
          className="bg-teal-500 h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${((currentQuestionIndex + 1) / examData?.questions?.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      {currentQuestion && (
        <div className="bg-white p-8 rounded-3xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {currentQuestion.marks} marks
            </span>
            {currentQuestion.frequency_score >= 2 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-100">
                Frequently Asked
              </span>
            )}
          </div>

          <h3 className="text-xl font-semibold text-slate-900 mb-8 leading-relaxed whitespace-pre-wrap">
            {currentQuestion.content}
          </h3>

          {/* MCQ Options */}
          {currentQuestion.mcq_options && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <List className="w-4 h-4" />
                  Select an answer
                </span>
                {examData?.allow_written && (
                  <button
                    onClick={() => toggleAnswerMode(currentQuestion.id)}
                    className="text-xs font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    {answerModes[currentQuestion.id] === 'written' ? (
                      <><List className="w-3 h-3" /> Switch to MCQ</>
                    ) : (
                      <><FileText className="w-3 h-3" /> Switch to Written</>
                    )}
                  </button>
                )}
              </div>

              {answerModes[currentQuestion.id] !== 'written' ? (
                <div className="space-y-3">
                  {['A', 'B', 'C', 'D'].map((option) => {
                    const optionText = currentQuestion.mcq_options[option]
                    if (!optionText) return null
                    const isSelected = mcqAnswers[currentQuestion.id] === option

                    return (
                      <button
                        key={option}
                        onClick={() => handleMcqSelect(currentQuestion.id, option)}
                        className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSelected
                          ? 'border-teal-500 bg-teal-50 text-slate-900'
                          : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'
                          }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isSelected
                            ? 'bg-teal-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                            }`}>
                            {option}
                          </span>
                          <span className="text-sm leading-relaxed pt-1">{optionText}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                    placeholder="Type your answer here..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 min-h-[200px] resize-y transition-all text-base leading-relaxed"
                  />

                  <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
                    <span>or</span>
                    <button
                      onClick={() => answerImageInputRef.current?.click()}
                      disabled={uploadingQuestionId === currentQuestion.id}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Upload className="w-4 h-4" />
                      {uploadingQuestionId === currentQuestion.id ? 'Uploading...' : 'Upload handwritten answer'}
                    </button>
                    <input
                      ref={answerImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleUploadHandwrittenAnswer(file)
                        }
                      }}
                    />
                    {uploadedAnswerImages[currentQuestion.id] && (
                      <span className="text-teal-600 text-xs font-semibold truncate max-w-[260px]" title={uploadedAnswerImages[currentQuestion.id].name}>
                        Uploaded: {uploadedAnswerImages[currentQuestion.id].name}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Written Answer Only Mode */}
          {!currentQuestion.mcq_options && (
            <div className="space-y-4">
              <textarea
                value={answers[currentQuestion.id] || ''}
                onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                placeholder="Type your answer here..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 min-h-[300px] resize-y transition-all text-base leading-relaxed"
              />

              <div className="flex items-center gap-4 text-sm font-medium text-slate-400">
                <span>or</span>
                <button
                  onClick={() => answerImageInputRef.current?.click()}
                  disabled={uploadingQuestionId === currentQuestion.id}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-4 h-4" />
                  {uploadingQuestionId === currentQuestion.id ? 'Uploading...' : 'Upload handwritten answer'}
                </button>
                <input
                  ref={answerImageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleUploadHandwrittenAnswer(file)
                    }
                  }}
                />
                {uploadedAnswerImages[currentQuestion.id] && (
                  <span className="text-teal-600 text-xs font-semibold truncate max-w-[260px]" title={uploadedAnswerImages[currentQuestion.id].name}>
                    Uploaded: {uploadedAnswerImages[currentQuestion.id].name}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQuestionIndex === 0}
          className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-slate-700 font-bold hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all border border-slate-200 flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </button>

        <div className="flex flex-wrap justify-center gap-2">
          {examData?.questions?.map((_: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-10 h-10 rounded-xl text-sm font-bold transition-all border ${idx === currentQuestionIndex
                ? 'bg-black text-white border-black shadow-md'
                : (answers[examData.questions[idx].id]?.trim() || mcqAnswers[examData.questions[idx].id] || uploadedAnswerImages[examData.questions[idx].id])
                  ? 'bg-teal-50 text-teal-600 border-teal-200 hover:bg-teal-100'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-700'
                }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex < examData?.questions?.length - 1 ? (
          <button
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white text-slate-900 border border-slate-200 font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-500 text-white font-bold hover:bg-teal-600 transition-all shadow-[0_4px_14px_rgba(20,184,166,0.3)] flex items-center justify-center"
          >
            Submit Exam
          </button>
        )}
      </div>

      {/* Submit Confirmation */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-md w-full p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-center">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-amber-500" />
            </div>

            <h3 className="text-2xl font-bold text-slate-900 mb-2">Submit Exam?</h3>
            <p className="text-slate-500 mb-8 font-medium">This action cannot be undone once submitted.</p>

            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-8">
              <p className="text-sm font-medium text-slate-600">
                You have answered <span className="font-bold text-slate-900 text-base">{countAnsweredQuestions()}</span> out of <span className="font-bold text-slate-900 text-base">{examData?.questions?.length}</span> questions.
              </p>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-4 py-3.5 rounded-xl bg-white text-slate-700 font-bold hover:bg-slate-50 border border-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSubmitConfirm(false)
                  handleSubmitExam()
                }}
                className="flex-1 px-4 py-3.5 rounded-xl bg-black text-white font-bold hover:bg-slate-800 transition-all shadow-md"
              >
                Confirm Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submission Progress */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-100 text-center">
            <div className="w-12 h-12 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-teal-600 animate-pulse" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">Submitting Your Exam</h3>
            <p className="text-sm text-slate-500 mb-4">Please wait while we process your answers.</p>
            {submissionProgress.total > 0 ? (
              <p className="text-sm text-slate-700 font-medium">
                Submitted {submissionProgress.current} of {submissionProgress.total} answered questions
              </p>
            ) : (
              <p className="text-sm text-slate-700 font-medium">Finalizing submission...</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamSimulation
