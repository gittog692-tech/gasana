import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Bot,
  User,
  Sparkles,
  Youtube,
  Smile,
  Frown,
  Meh,
  Heart,
  MessageSquare,
  FileCheck,
  ArrowRight,
  Zap,
  BookOpen,
  PlayCircle,
  CheckCircle2,
  ImagePlus,
  X
} from 'lucide-react'
import { clearDoubt, clearDoubtWithImage, stressSupport, evaluateAnswer, ocrImage } from '../services/api'
import { useAuth } from '../context/AuthContext'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  metadata?: any
}

const AIHelper: React.FC = () => {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'chat' | 'evaluator' | 'stress'>('chat')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [chatImage, setChatImage] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const chatImageInputRef = useRef<HTMLInputElement>(null)

  // Answer Evaluator State
  const [question, setQuestion] = useState('')
  const [studentAnswer, setStudentAnswer] = useState('')
  const [maxMarks, setMaxMarks] = useState(10)
  const [evaluation, setEvaluation] = useState<any>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [answerImage, setAnswerImage] = useState<File | null>(null)
  const [extractingText, setExtractingText] = useState(false)
  const [ocrError, setOcrError] = useState('')

  // Stress Support State
  const [mood, setMood] = useState<'great' | 'okay' | 'stressed' | null>(null)
  const [stressMessage, setStressMessage] = useState('')
  const [stressResponse, setStressResponse] = useState<any>(null)
  const [gettingSupport, setGettingSupport] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() && !chatImage) return

    const displayText = text.trim() || 'Please analyze this image.'

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: chatImage ? `${displayText}\n\n[Image attached: ${chatImage.name}]` : displayText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const res = chatImage
        ? await clearDoubtWithImage({ question: displayText, file: chatImage })
        : await clearDoubt({ question: displayText })

      let aiContent = res.data.answer

      // Add related topics if available
      if (res.data.related_topics?.length > 0) {
        aiContent += '\n\n**Related Topics:** ' + res.data.related_topics.join(', ')
      }

      // Add YouTube links
      if (res.data.suggested_videos?.length > 0) {
        aiContent += '\n\n**Helpful Videos:**'
        res.data.suggested_videos.forEach((video: any) => {
          aiContent += `\n• [${video.title}](${video.url})`
        })
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiContent,
        timestamp: new Date(),
        metadata: res.data
      }

      setMessages(prev => [...prev, aiMessage])
      setChatImage(null)
      if (chatImageInputRef.current) {
        chatImageInputRef.current.value = ''
      }
    } catch (error) {
      console.error('Error:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluate = async () => {
    if (!question.trim() || !studentAnswer.trim()) return

    setEvaluating(true)
    try {
      const res = await evaluateAnswer({
        question,
        student_answer: studentAnswer,
        max_marks: maxMarks
      })
      setEvaluation(res.data)
    } catch (error) {
      console.error('Error evaluating:', error)
      alert('Failed to evaluate answer')
    } finally {
      setEvaluating(false)
    }
  }

  const handleExtractTextFromImage = async () => {
    if (!answerImage) return

    setExtractingText(true)
    setOcrError('')
    try {
      const res = await ocrImage(answerImage)
      const extracted = (res.data?.text || '').trim()
      if (!extracted) {
        setOcrError('No readable text detected in this image.')
        return
      }

      setStudentAnswer(prev => {
        const base = prev.trim()
        return base ? `${base}\n\n${extracted}` : extracted
      })
    } catch (error: any) {
      console.error('OCR failed:', error)
      setOcrError(error?.response?.data?.detail || 'Failed to extract text from image')
    } finally {
      setExtractingText(false)
    }
  }

  const handleStressSupport = async () => {
    if (!mood) return;
    setGettingSupport(true);
    try {
      const res = await stressSupport({
        mood,
        message: stressMessage
      })
      setStressResponse(res.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setGettingSupport(false);
    }
  }

  const suggestionChips = [
    { label: "Explain Quantum Entanglement", icon: Zap },
    { label: "Summarize the last lecture", icon: BookOpen },
    { label: "Help me solve this derivative", icon: Sparkles },
    { label: "Find videos on Data Structures", icon: Youtube },
  ]

  const renderInline = (text: string, keyPrefix: string) => {
    const parts: React.ReactNode[] = []
    const tokenRegex = /(\*\*[^*]+\*\*|\[[^\]]+\]\((https?:\/\/[^\s)]+)\))/g
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = tokenRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index))
      }

      const token = match[0]

      if (token.startsWith('**') && token.endsWith('**')) {
        parts.push(
          <strong key={`${keyPrefix}-b-${match.index}`} className="font-semibold text-slate-800">
            {token.slice(2, -2)}
          </strong>
        )
      } else {
        const linkMatch = token.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)
        if (linkMatch) {
          parts.push(
            <a
              key={`${keyPrefix}-l-${match.index}`}
              href={linkMatch[2]}
              target="_blank"
              rel="noreferrer"
              className="text-teal-700 underline hover:text-teal-900"
            >
              {linkMatch[1]}
            </a>
          )
        } else {
          parts.push(token)
        }
      }

      lastIndex = tokenRegex.lastIndex
    }

    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex))
    }

    return parts
  }

  const renderMessageContent = (content: string) => {
    const lines = content.split('\n')
    return lines.map((line, idx) => (
      <div key={`line-${idx}`} className={idx === 0 ? '' : 'mt-1'}>
        {renderInline(line, `line-${idx}`)}
      </div>
    ))
  }

  const renderChat = () => (
    <div className="flex flex-col h-[calc(100vh-220px)] min-h-[500px] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-6 z-10">
        <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center mr-3">
          <Bot className="w-5 h-5 text-teal-700" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Gasana Tutor</h3>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Online
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto pt-20 pb-4 px-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm">
              <Sparkles className="w-8 h-8 text-teal-700" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Hello, {user?.name?.split(' ')[0] || 'Scholar'}.</h2>
            <p className="text-slate-500 max-w-md mb-8">
              I'm here to help you ace your exams. Ask me to explain concepts, solve problems, or find resources.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
              {suggestionChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(chip.label)}
                  className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-white border border-slate-100 hover:border-teal-200 rounded-xl transition-all shadow-sm hover:shadow-md group text-left"
                >
                  <div className="p-2 bg-white rounded-lg group-hover:bg-teal-50 transition-colors">
                    <chip.icon className="w-5 h-5 text-slate-400 group-hover:text-teal-700" />
                  </div>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-teal-700">{chip.label}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 max-w-3xl mx-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.type === 'user' ? 'flex-row-reverse' : ''} animate-fade-in`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-100 ${msg.type === 'user' ? 'bg-teal-700' : 'bg-white'
                  }`}>
                  {msg.type === 'user' ? (
                    <User className="w-5 h-5 text-white" />
                  ) : (
                    <Bot className="w-5 h-5 text-teal-700" />
                  )}
                </div>
                <div className={`flex flex-col max-w-[85%] ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`p-5 rounded-2xl shadow-sm text-sm leading-relaxed ${msg.type === 'user'
                      ? 'bg-teal-700 text-white rounded-tr-sm'
                      : 'bg-white border border-slate-100 text-slate-700 rounded-tl-sm'
                    }`}>
                    <div className="whitespace-pre-wrap font-medium break-words">
                      {renderMessageContent(msg.content)}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                  <Bot className="w-5 h-5 text-teal-700" />
                </div>
                <div className="bg-white border border-slate-100 p-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto relative">
          <input
            ref={chatImageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null
              setChatImage(file)
            }}
          />
          {chatImage && (
            <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
              <span className="truncate">Attached image: {chatImage.name}</span>
              <button
                type="button"
                onClick={() => {
                  setChatImage(null)
                  if (chatImageInputRef.current) {
                    chatImageInputRef.current.value = ''
                  }
                }}
                className="ml-2 rounded p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask anything... or attach an image"
            className="w-full pl-6 pr-24 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none transition-all text-slate-800 placeholder-slate-400 shadow-inner"
          />
          <button
            type="button"
            onClick={() => chatImageInputRef.current?.click()}
            disabled={loading}
            className="absolute right-14 top-2 bottom-2 aspect-square flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-all disabled:opacity-50"
            title="Attach image"
          >
            <ImagePlus className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleSendMessage()}
            disabled={(!input.trim() && !chatImage) || loading}
            className="absolute right-2 top-2 bottom-2 aspect-square flex items-center justify-center bg-teal-700 hover:bg-teal-800 text-white rounded-xl disabled:opacity-50 disabled:bg-slate-300 transition-all shadow-md shadow-teal-200"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-2">
          Gasana AI can make mistakes. Please verify important information.
        </p>
      </div>
    </div>
  )

  const renderEvaluator = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      <div className="space-y-6">
        {/* Input Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-teal-600" /> Question
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">Max Marks:</span>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(parseInt(e.target.value))}
                  className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-sm text-center font-bold"
                  min={1}
                  max={100}
                />
              </div>
            </div>
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="e.g., Explain the concept of Deadlock in Operating Systems."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none transition-all min-h-[100px] text-sm"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 mb-3 block">Your Answer</label>
            <textarea
              value={studentAnswer}
              onChange={(e) => setStudentAnswer(e.target.value)}
              placeholder="Write your answer here..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none transition-all min-h-[200px] text-sm font-medium text-slate-700"
            />
            <div className="mt-3 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 cursor-pointer transition-colors">
                  <ImagePlus className="w-4 h-4" />
                  Attach answer image
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      setAnswerImage(file)
                      setOcrError('')
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleExtractTextFromImage}
                  disabled={!answerImage || extractingText}
                  className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {extractingText ? 'Extracting...' : 'Extract text from image'}
                </button>
                {answerImage && <span className="text-xs text-slate-500">{answerImage.name}</span>}
              </div>
              {ocrError && <p className="text-xs text-red-600">{ocrError}</p>}
            </div>
          </div>

          <button
            onClick={handleEvaluate}
            disabled={!question.trim() || !studentAnswer.trim() || evaluating}
            className="w-full py-4 bg-teal-700 text-white rounded-xl font-bold hover:bg-teal-800 transition-all shadow-lg shadow-teal-200 disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
          >
            {evaluating ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                Analyzing Response...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Evaluate Answer
              </>
            )}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Results Section */}
        {evaluation ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-fade-in h-full flex flex-col">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-lg text-slate-800">Evaluation Report</h3>
                <p className="text-xs text-slate-500">Generated by AI Evaluator</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-black text-teal-700 tracking-tight">
                  {evaluation.grade}<span className="text-xl text-slate-400">/{evaluation.max_marks}</span>
                </div>
                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Score</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { label: 'Content', score: evaluation.content_score, color: 'text-blue-600', bg: 'bg-blue-50' },
                { label: 'Structure', score: evaluation.structure_score, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Key Points', score: evaluation.key_points_score, color: 'text-cyan-700', bg: 'bg-cyan-50' },
              ].map((metric) => (
                <div key={metric.label} className={`text-center p-4 rounded-2xl ${metric.bg}`}>
                  <div className={`text-xl font-black ${metric.color} mb-1`}>{metric.score}%</div>
                  <div className="text-xs font-bold text-slate-500 uppercase">{metric.label}</div>
                </div>
              ))}
            </div>

            <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              <div className="bg-slate-50 p-5 rounded-2xl">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Feedback
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">{evaluation.feedback}</p>
              </div>

              {evaluation.improvements?.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-800 mb-3">Missed Points</h4>
                  <div className="space-y-2">
                    {evaluation.improvements.map((imp: string, i: number) => (
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
                <div className="p-5 bg-teal-50/50 rounded-2xl text-sm text-slate-700 leading-relaxed border border-teal-50">
                  {evaluation.suggested_answer}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
              <FileCheck className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="font-bold text-slate-400 text-lg mb-2">No Evaluation Yet</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Enter a question and your answer on the left to get instant AI grading and feedback.
            </p>
          </div>
        )}
      </div>
    </div>
  )

  const renderStressSupport = () => (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-white rounded-[2rem] shadow-xl shadow-teal-100 border border-teal-50 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-emerald-400" />

        <div className="p-10 text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-teal-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Need a breather?</h2>
          <p className="text-slate-500 mb-10">Select how you're feeling right now.</p>

          <div className="flex justify-center gap-6 mb-10">
            {[
              { id: 'great', icon: Smile, label: 'Great', color: 'text-green-500', bg: 'bg-green-50 ring-green-500' },
              { id: 'okay', icon: Meh, label: 'Okay', color: 'text-amber-500', bg: 'bg-amber-50 ring-amber-500' },
              { id: 'stressed', icon: Frown, label: 'Stressed', color: 'text-red-500', bg: 'bg-red-50 ring-red-500' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setMood(item.id as any)}
                className={`flex flex-col items-center gap-3 group transition-all duration-300 ${mood === item.id ? 'transform scale-110' : 'opacity-60 hover:opacity-100'
                  }`}
              >
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center transition-all shadow-sm ${mood === item.id ? `${item.bg} ring-2 shadow-md` : 'bg-white border border-slate-100 group-hover:bg-slate-50'
                  }`}>
                  <item.icon className={`w-10 h-10 ${mood === item.id ? item.color : 'text-slate-400 group-hover:text-slate-600'}`} />
                </div>
                <span className={`font-bold text-sm ${mood === item.id ? 'text-slate-800' : 'text-slate-400'}`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className={`transition-all duration-500 overflow-hidden ${mood ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-slate-50 p-6 rounded-2xl mb-6 text-left">
              <label className="text-sm font-bold text-slate-700 mb-2 block">Want to vent? (Optional)</label>
              <textarea
                value={stressMessage}
                onChange={(e) => setStressMessage(e.target.value)}
                placeholder="I'm feeling overwhelmed because..."
                className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-100 focus:border-teal-400 outline-none transition-all min-h-[100px] text-sm"
              />
            </div>

            <button
              onClick={handleStressSupport}
              disabled={gettingSupport}
              className="w-full py-4 bg-teal-500 text-white rounded-xl font-bold hover:bg-teal-600 transition-all shadow-lg shadow-teal-200 disabled:opacity-70 disabled:shadow-none flex items-center justify-center gap-2"
            >
              {gettingSupport ? 'Generating Support...' : 'Get Support'}
            </button>
          </div>

          {stressResponse && (
            <div className="mt-10 animate-fade-in text-left bg-gradient-to-br from-teal-50 to-emerald-50 p-8 rounded-2xl border border-teal-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Heart className="w-32 h-32 text-teal-500" />
              </div>

              <div className="relative z-10 space-y-6">
                <div>
                  <h4 className="font-bold text-teal-800 text-lg mb-2">We hear you.</h4>
                  <p className="text-teal-700 leading-relaxed">{stressResponse.ai_response}</p>
                </div>

                <div className="bg-white/60 p-4 rounded-xl backdrop-blur-sm border border-white/50">
                  <h5 className="font-bold text-teal-800 text-sm mb-1 uppercase tracking-wider">Try this</h5>
                  <p className="text-teal-700">{stressResponse.coping_strategy}</p>
                </div>

                <div className="pt-4 border-t border-teal-200/50 text-center">
                  <p className="font-serif italic text-teal-800 text-lg">"{stressResponse.motivational_quote}"</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-100px)] flex flex-col animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Study Helper</h1>
          <p className="text-slate-500 mt-1 font-medium">Your personalized 24/7 academic assistant.</p>
        </div>

        {/* Modern Segmented Control */}
        <div className="bg-slate-100 p-1.5 rounded-xl flex gap-1">
          {[
            { id: 'chat', label: 'Chat Tutor', icon: MessageSquare },
            { id: 'evaluator', label: 'Answer Evaluator', icon: FileCheck },
            { id: 'stress', label: 'Stress Relief', icon: Heart }
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-bold text-sm transition-all ${activeTab === id
                  ? 'bg-white text-slate-800 shadow-sm ring-1 ring-black/5'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
            >
              <Icon className={`w-4 h-4 ${activeTab === id ? 'text-teal-700' : ''}`} />
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {activeTab === 'chat' && renderChat()}
        {activeTab === 'evaluator' && renderEvaluator()}
        {activeTab === 'stress' && renderStressSupport()}
      </div>
    </div>
  )
}

export default AIHelper
