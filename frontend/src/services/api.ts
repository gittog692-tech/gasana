import axios from 'axios'

const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const API_BASE_URL = `http://${apiHost}:8000`
const SUBJECTS_CACHE_KEY = 'ktu_subjects_cache_v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ktu_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle 401 globally - clear token and redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('ktu_token')
      localStorage.removeItem('ktu_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth
export const loginUser = (email: string, password: string) =>
  api.post('/auth/login', { email, password })

export const registerUser = (data: {
  name: string; email: string; password: string;
  department_id?: number; semester?: number
}) => api.post('/auth/register', data)

export const getMe = () => api.get('/auth/me')

// Departments
export const getDepartments = () => api.get('/questions/departments')
export const createDepartment = (data: { name: string; code: string }) =>
  api.post('/questions/departments', data)

// Subjects
export const getSubjects = async (params?: { department_id?: number; semester?: number }) => {
  try {
    const res = await api.get('/questions/subjects', { params })
    const isUnfiltered = !params || Object.keys(params).length === 0
    if (isUnfiltered && Array.isArray(res.data) && res.data.length > 0) {
      sessionStorage.setItem(SUBJECTS_CACHE_KEY, JSON.stringify(res.data))
    }
    return res
  } catch (error) {
    const isUnfiltered = !params || Object.keys(params).length === 0
    if (isUnfiltered) {
      const cached = sessionStorage.getItem(SUBJECTS_CACHE_KEY)
      if (cached) {
        return { data: JSON.parse(cached) } as any
      }
    }
    throw error
  }
}
export const createSubject = (data: { name: string; code: string; semester: number; department_id: number }) =>
  api.post('/questions/subjects', data)

// Questions
export const getQuestions = (params?: {
  department_id?: number; semester?: number; subject_id?: number
  year?: number; frequent_only?: boolean; limit?: number
}) => api.get('/questions/', { params })

export const getFrequentQuestions = (subject_id: number) =>
  api.get('/questions/frequent', { params: { subject_id } })

export const uploadPYQ = (formData: FormData) =>
  api.post('/questions/upload-pdf', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })

// Exams
export const startExam = (data: { subject_id: number }) =>
  api.post('/exams/start', data)

export const createSimulatedExam = (config: {
  subject_id: number; num_questions: number; duration_minutes: number
  include_frequent: boolean; include_predicted: boolean
  is_adaptive?: boolean; generate_mcqs?: boolean; allow_written?: boolean
}) => api.post('/exams/simulate', config)

export const submitAttempt = (data: {
  exam_id: number; question_id: number; answer_text?: string; answer_image_path?: string; mcq_answer?: string
}) => api.post('/exams/attempts', data)

export const uploadExamAnswerImage = (exam_id: number, question_id: number, file: File) => {
  const formData = new FormData()
  formData.append('exam_id', String(exam_id))
  formData.append('question_id', String(question_id))
  formData.append('file', file)
  return api.post('/exams/upload-answer-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const submitExam = (exam_id: number) =>
  api.post(`/exams/${exam_id}/submit`)

export const getExamResults = (exam_id: number) =>
  api.get(`/exams/${exam_id}/results`)

export const getUserExams = () => api.get('/exams/')

// AI Services
export const evaluateAnswer = (data: {
  question: string; student_answer: string; max_marks: number; marking_scheme?: string
}) => api.post('/ai/evaluate', data)

export const predictQuestions = (subject_id: number) =>
  api.get(`/ai/predict/${subject_id}`)

export const clearDoubt = (data: { question: string; subject_id?: number }) =>
  api.post('/ai/doubt', data)

export const clearDoubtWithImage = (data: { question: string; file: File; subject_id?: number }) => {
  const formData = new FormData()
  formData.append('question', data.question)
  if (typeof data.subject_id === 'number') {
    formData.append('subject_id', String(data.subject_id))
  }
  formData.append('file', data.file)
  return api.post('/ai/doubt-with-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export const stressSupport = (data: { mood: string; message?: string }) =>
  api.post('/ai/stress-support', data)

export const ocrImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/ai/ocr-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// Admin
export const adminGetStats = () => api.get('/admin/stats')
export const adminGetUsers = () => api.get('/admin/users')
export const adminUpdateUser = (id: number, data: { is_active: boolean }) =>
  api.patch(`/admin/users/${id}`, data)
export const adminCreateSubject = (data: {
  name: string; code: string; semester: number; department_id: number
}) => api.post('/admin/subjects', data)
export const adminCreateQuestion = (data: {
  content: string; marks: number; year: number; month: string
  subject_id: number; topics?: string[]
}) => api.post('/admin/questions', data)
export const adminGetDepartments = () => api.get('/admin/departments')
export const adminGetSubjects = () => api.get('/admin/subjects')

// Community
export const getPosts = (params?: { subject_id?: number; sort?: string; skip?: number; limit?: number }) =>
  api.get('/community/', { params })
export const createPost = (data: { title: string; body: string; subject_id?: number; image_url?: string }) =>
  api.post('/community/', data)
export const getPost = (id: number) => api.get(`/community/${id}`)
export const deletePost = (id: number) => api.delete(`/community/${id}`)
export const addComment = (postId: number, data: { body: string; parent_id?: number }) =>
  api.post(`/community/${postId}/comments`, data)
export const deleteComment = (commentId: number) =>
  api.delete(`/community/comments/${commentId}`)
export const votePost = (postId: number, data: { value: number }) =>
  api.post(`/community/${postId}/vote`, data)
export const voteComment = (commentId: number, data: { value: number }) =>
  api.post(`/community/comments/${commentId}/vote`, data)
export const uploadCommunityImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/community/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

export default api
