import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Trophy, 
  Clock, 
  Target, 
  TrendingUp,
  ChevronRight,
  FileText,
  AlertCircle,
  RotateCcw
} from 'lucide-react'
import { getUserExams, getExamResults } from '../services/api'

const Results: React.FC = () => {
  const [exams, setExams] = useState<any[]>([])
  const [selectedExam, setSelectedExam] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      const res = await getUserExams()
      setExams(res.data)
    } catch (error) {
      console.error('Error fetching exams:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewExamDetails = async (examId: number) => {
    try {
      const res = await getExamResults(examId)
      setSelectedExam(res.data)
    } catch (error) {
      console.error('Error fetching exam details:', error)
    }
  }

  const completedExams = exams.filter(e => e.status === 'completed')
  const averageScore = completedExams.length > 0
    ? completedExams.reduce((acc, e) => acc + (e.obtained_marks / e.total_marks * 100), 0) / completedExams.length
    : 0

  const highestScore = completedExams.length > 0
    ? Math.max(...completedExams.map(e => (e.obtained_marks / e.total_marks * 100)))
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Your Results</h1>
        <p className="text-gray-600 mt-1">Track your progress and improvement</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Exams</p>
              <p className="text-2xl font-bold text-gray-900">{completedExams.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Score</p>
              <p className="text-2xl font-bold text-gray-900">{averageScore.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-teal-700" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border card-hover">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Highest Score</p>
              <p className="text-2xl font-bold text-gray-900">{highestScore.toFixed(1)}%</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Trophy className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Exams List */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Exam History</h2>
        </div>
        
        {completedExams.length > 0 ? (
          <div className="divide-y">
            {completedExams.map((exam) => {
              const percentage = (exam.obtained_marks / exam.total_marks) * 100
              return (
                <div 
                  key={exam.id} 
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => viewExamDetails(exam.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        percentage >= 80 ? 'bg-green-100' : 
                        percentage >= 60 ? 'bg-yellow-100' : 'bg-red-100'
                      }`}>
                        <Target className={`w-6 h-6 ${
                          percentage >= 80 ? 'text-green-600' : 
                          percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                        }`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{exam.subject?.name || 'Unknown Subject'}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(exam.started_at).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-900">
                          {percentage.toFixed(1)}%
                        </p>
                        <p className="text-sm text-gray-500">
                          {exam.obtained_marks?.toFixed(1) || 0}/{exam.total_marks} marks
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center">
            <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No exams taken yet</h3>
            <p className="text-gray-600 mb-6">Start practicing with mock exams to see your results</p>
            <Link to="/exam" className="btn btn-primary">
              Take Mock Exam
            </Link>
          </div>
        )}
      </div>

      {/* Exam Details Modal */}
      {selectedExam && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedExam(null)}
        >
          <div 
            className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">{selectedExam.subject}</h2>
                <p className="text-sm text-gray-500">
                  {new Date(selectedExam.started_at).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedExam(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <AlertCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Total Marks</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedExam.obtained_marks}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Out Of</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedExam.total_marks}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-600">Percentage</p>
                  <p className={`text-2xl font-bold ${
                    selectedExam.percentage >= 80 ? 'text-green-600' :
                    selectedExam.percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {selectedExam.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Attempts */}
              <h3 className="font-semibold text-gray-900 mb-4">Question-wise Breakdown</h3>
              <div className="space-y-4">
                {selectedExam.attempts?.map((attempt: any, index: number) => (
                  <div key={attempt.question_id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Q{index + 1}. {attempt.question}</h4>
                      <span className={`badge ${
                        (attempt.obtained / attempt.marks) >= 0.7 ? 'badge-success' :
                        (attempt.obtained / attempt.marks) >= 0.4 ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {attempt.obtained}/{attempt.marks} marks
                      </span>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Your Answer:</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{attempt.your_answer}</p>
                      </div>
                      
                      {attempt.feedback && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">AI Feedback:</p>
                          <p className="text-sm text-gray-600">{attempt.feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Results
