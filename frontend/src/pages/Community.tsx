import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
    ArrowUp, ArrowDown, MessageSquare, Plus, X, Send,
    ArrowLeft, Trash2, Clock, Filter, ImagePlus, Bot, Loader2, Reply, CornerDownRight
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import 'katex/dist/katex.min.css'
import { getPosts, createPost, getPost, deletePost, addComment, deleteComment, votePost, voteComment, getSubjects, uploadCommunityImage } from '../services/api'
import { useAuth } from '../context/AuthContext'

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface Author {
    id: number
    name: string
}

interface Subject {
    id: number
    name: string
    code: string
}

interface CommentItem {
    id: number
    body: string
    created_at: string
    author: Author
    is_ai?: boolean
    parent_id?: number | null
    upvotes: number
    downvotes: number
    user_vote: number | null
    replies: CommentItem[]
}

interface PostItem {
    id: number
    title: string
    body: string
    image_url?: string | null
    upvotes: number
    downvotes: number
    is_pinned?: boolean
    created_at: string
    author: Author
    subject?: Subject | null
    comment_count: number
    user_vote: number | null
    comments?: CommentItem[]
}

/* ── Helpers ───────────────────────────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
    const utcStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z'
    const diff = (Date.now() - new Date(utcStr).getTime()) / 1000
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
    return new Date(utcStr).toLocaleDateString()
}

const apiHost = typeof window !== 'undefined' ? window.location.hostname : 'localhost'
const API_BASE = `http://${apiHost}:8000`

// Thread-line colors for depth levels
const THREAD_COLORS = [
    'border-slate-200',
    'border-blue-200',
    'border-emerald-200',
    'border-purple-200',
    'border-amber-200',
    'border-pink-200',
]

/* ── Component ─────────────────────────────────────────────────────────────── */

const Community: React.FC = () => {
    const { user } = useAuth()

    // Feed state
    const [posts, setPosts] = useState<PostItem[]>([])
    const [sort, setSort] = useState<'latest' | 'top'>('latest')
    const [subjectFilter, setSubjectFilter] = useState<number | undefined>(undefined)
    const [subjects, setSubjects] = useState<Subject[]>([])
    const [loading, setLoading] = useState(true)

    // Create post
    const [showCreate, setShowCreate] = useState(false)
    const [newTitle, setNewTitle] = useState('')
    const [newBody, setNewBody] = useState('')
    const [newSubjectId, setNewSubjectId] = useState<number | undefined>(undefined)
    const [newImageUrl, setNewImageUrl] = useState<string | undefined>(undefined)
    const [uploading, setUploading] = useState(false)
    const [creating, setCreating] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Detail view
    const [selectedPost, setSelectedPost] = useState<PostItem | null>(null)
    const [commentText, setCommentText] = useState('')
    const [commenting, setCommenting] = useState(false)
    const [aiThinking, setAiThinking] = useState(false)
    const [replyingTo, setReplyingTo] = useState<CommentItem | null>(null)

    /* ── Data fetching ─────────────────────────────────────────────────────── */

    const fetchPosts = useCallback(async () => {
        setLoading(true)
        try {
            const res = await getPosts({ sort, subject_id: subjectFilter })
            setPosts(res.data)
        } catch (err) {
            console.error('Failed to load posts', err)
        } finally {
            setLoading(false)
        }
    }, [sort, subjectFilter])

    useEffect(() => {
        fetchPosts()
    }, [fetchPosts])

    useEffect(() => {
        getSubjects().then(res => setSubjects(res.data)).catch(() => { })
    }, [])

    /* ── Image Upload ──────────────────────────────────────────────────────── */

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const res = await uploadCommunityImage(file)
            setNewImageUrl(res.data.url)
        } catch (err) {
            console.error('Image upload failed', err)
            alert('Failed to upload image. Max 5 MB, images only.')
        } finally {
            setUploading(false)
        }
    }

    /* ── Actions ───────────────────────────────────────────────────────────── */

    const handleCreate = async () => {
        if (!newTitle.trim() || !newBody.trim()) return
        setCreating(true)
        try {
            await createPost({ title: newTitle.trim(), body: newBody.trim(), subject_id: newSubjectId, image_url: newImageUrl })
            setNewTitle('')
            setNewBody('')
            setNewSubjectId(undefined)
            setNewImageUrl(undefined)
            setShowCreate(false)
            fetchPosts()
        } catch (err) {
            console.error('Failed to create post', err)
        } finally {
            setCreating(false)
        }
    }

    const handleVote = async (postId: number, value: number) => {
        try {
            const res = await votePost(postId, { value })
            setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...res.data } : p))
            if (selectedPost?.id === postId) {
                setSelectedPost(prev => prev ? { ...prev, ...res.data, comments: prev.comments } : prev)
            }
        } catch (err) {
            console.error('Vote failed', err)
        }
    }

    const handleCommentVote = async (commentId: number, value: number) => {
        try {
            const res = await voteComment(commentId, { value })
            if (selectedPost) {
                // Update the comment in the tree
                const updateVotes = (comments: CommentItem[]): CommentItem[] =>
                    comments.map(c => {
                        if (c.id === commentId) {
                            const wasVote = c.user_vote
                            let newUserVote: number | null = value
                            if (wasVote === value) newUserVote = null // toggled off
                            return { ...c, upvotes: res.data.upvotes, downvotes: res.data.downvotes, user_vote: newUserVote }
                        }
                        return { ...c, replies: updateVotes(c.replies) }
                    })
                setSelectedPost(prev => prev ? { ...prev, comments: updateVotes(prev.comments ?? []) } : prev)
            }
        } catch (err) {
            console.error('Comment vote failed', err)
        }
    }

    const openPost = async (postId: number) => {
        try {
            const res = await getPost(postId)
            setSelectedPost(res.data)
        } catch (err) {
            console.error('Failed to load post', err)
        }
    }

    const handleDeletePost = async (postId: number) => {
        if (!confirm('Delete this post?')) return
        try {
            await deletePost(postId)
            setSelectedPost(null)
            fetchPosts()
        } catch (err) {
            console.error('Delete failed', err)
        }
    }

    const handleAddComment = async () => {
        if (!commentText.trim() || !selectedPost) return
        const hasMention = /\@gasana/i.test(commentText)
        setCommenting(true)
        if (hasMention) setAiThinking(true)
        try {
            await addComment(selectedPost.id, {
                body: commentText.trim(),
                parent_id: replyingTo?.id,
            })
            setCommentText('')
            setReplyingTo(null)
            // Re-fetch to get full post with all comments in order
            const postRes = await getPost(selectedPost.id)
            setSelectedPost(postRes.data)
            setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comment_count: postRes.data.comments?.length ?? p.comment_count } : p))
        } catch (err) {
            console.error('Comment failed', err)
        } finally {
            setCommenting(false)
            setAiThinking(false)
        }
    }

    const handleDeleteComment = async (commentId: number) => {
        if (!selectedPost) return
        try {
            await deleteComment(commentId)
            const res = await getPost(selectedPost.id)
            setSelectedPost(res.data)
            setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, comment_count: res.data.comments?.length ?? Math.max(0, p.comment_count - 1) } : p))
        } catch (err) {
            console.error('Delete comment failed', err)
        }
    }

    /* ── Vote Button ───────────────────────────────────────────────────────── */

    const VoteControls = ({ post }: { post: PostItem }) => {
        const score = post.upvotes - post.downvotes
        return (
            <div className="flex items-center gap-1">
                <button
                    onClick={(e) => { e.stopPropagation(); handleVote(post.id, 1) }}
                    className={`p-1.5 rounded-lg transition-colors ${post.user_vote === 1 ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
                <span className={`text-sm font-bold min-w-[20px] text-center ${score > 0 ? 'text-teal-600' : score < 0 ? 'text-red-500' : 'text-slate-500'}`}>
                    {score}
                </span>
                <button
                    onClick={(e) => { e.stopPropagation(); handleVote(post.id, -1) }}
                    className={`p-1.5 rounded-lg transition-colors ${post.user_vote === -1 ? 'bg-red-50 text-red-500' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'}`}
                >
                    <ArrowDown className="w-4 h-4" />
                </button>
            </div>
        )
    }

    /* ── Comment Vote Controls ─────────────────────────────────────────────── */

    const CommentVoteControls = ({ comment }: { comment: CommentItem }) => {
        const score = comment.upvotes - comment.downvotes
        return (
            <div className="flex items-center gap-0.5">
                <button
                    onClick={() => handleCommentVote(comment.id, 1)}
                    className={`p-1 rounded transition-colors ${comment.user_vote === 1 ? 'text-teal-600' : 'text-slate-300 hover:text-slate-500'}`}
                >
                    <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <span className={`text-xs font-bold min-w-[16px] text-center ${score > 0 ? 'text-teal-600' : score < 0 ? 'text-red-500' : 'text-slate-400'}`}>
                    {score}
                </span>
                <button
                    onClick={() => handleCommentVote(comment.id, -1)}
                    className={`p-1 rounded transition-colors ${comment.user_vote === -1 ? 'text-red-500' : 'text-slate-300 hover:text-slate-500'}`}
                >
                    <ArrowDown className="w-3.5 h-3.5" />
                </button>
            </div>
        )
    }

    /* ── Post Image ────────────────────────────────────────────────────────── */

    const PostImage = ({ url }: { url: string }) => (
        <div className="mt-3 rounded-xl overflow-hidden border border-slate-100">
            <img
                src={url.startsWith('http') ? url : `${API_BASE}${url}`}
                alt="Post attachment"
                className="w-full max-h-96 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
        </div>
    )

    /* ── Threaded Comment Component ────────────────────────────────────────── */

    const ThreadedComment = ({ comment, depth = 0 }: { comment: CommentItem; depth?: number }) => {
        const threadColor = THREAD_COLORS[depth % THREAD_COLORS.length]
        const isReplyTarget = replyingTo?.id === comment.id

        return (
            <div className={`${depth > 0 ? `ml-4 pl-4 border-l-2 ${threadColor}` : ''}`}>
                <div className={`py-3 ${depth === 0 ? 'border-b border-slate-50' : ''}`}>
                    <div className={`rounded-xl p-3 ${comment.is_ai ? 'bg-teal-50/60 border border-teal-100' : ''}`}>
                        {/* Comment header */}
                        <div className="flex items-center gap-2 mb-1.5">
                            {comment.is_ai ? (
                                <div className="w-6 h-6 rounded-full bg-teal-600 flex items-center justify-center text-white shrink-0">
                                    <Bot className="w-3.5 h-3.5" />
                                </div>
                            ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px] font-bold shrink-0">
                                    {comment.author.name[0]?.toUpperCase()}
                                </div>
                            )}
                            <span className={`text-xs font-bold ${comment.is_ai ? 'text-teal-700' : 'text-slate-800'}`}>
                                {comment.is_ai ? 'Gasana AI' : comment.author.name}
                            </span>
                            {comment.is_ai && (
                                <span className="text-[9px] uppercase font-bold tracking-wider text-teal-600 bg-teal-100 px-1.5 py-0.5 rounded">AI</span>
                            )}
                            <span className="text-[11px] text-slate-400">{timeAgo(comment.created_at)}</span>
                        </div>

                        {/* Comment body */}
                        {comment.is_ai ? (
                            <div className="text-sm text-slate-700 prose prose-sm prose-slate max-w-none ml-8 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_.katex-display]:my-3 [&_.katex-display]:overflow-x-auto [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_strong]:text-slate-900 [&_h1]:text-base [&_h2]:text-sm [&_h3]:text-sm [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-semibold [&_h1]:mt-3 [&_h2]:mt-2 [&_h3]:mt-2">
                                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                                    {comment.body}
                                </ReactMarkdown>
                            </div>
                        ) : (
                            <p className="text-sm text-slate-700 whitespace-pre-wrap ml-8">{comment.body}</p>
                        )}

                        {/* Comment actions */}
                        <div className="flex items-center gap-3 ml-8 mt-2">
                            <CommentVoteControls comment={comment} />
                            <button
                                onClick={() => {
                                    setReplyingTo(isReplyTarget ? null : comment)
                                    setCommentText(isReplyTarget ? '' : '')
                                }}
                                className={`flex items-center gap-1 text-[11px] font-bold transition-colors px-2 py-1 rounded ${isReplyTarget ? 'text-teal-600 bg-teal-50' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <Reply className="w-3 h-3" /> Reply
                            </button>
                            {!comment.is_ai && (comment.author.id === user?.id || user?.is_admin) && (
                                <button
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-red-500 transition-colors px-2 py-1 rounded"
                                >
                                    <Trash2 className="w-3 h-3" /> Delete
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Nested replies */}
                {comment.replies && comment.replies.length > 0 && (
                    <div>
                        {comment.replies.map(reply => (
                            <ThreadedComment key={reply.id} comment={reply} depth={depth + 1} />
                        ))}
                    </div>
                )}
            </div>
        )
    }

    /* ── Detail View ───────────────────────────────────────────────────────── */

    if (selectedPost) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Back button */}
                <button onClick={() => { setSelectedPost(null); setReplyingTo(null) }} className="flex items-center gap-2 text-slate-500 hover:text-black transition-colors text-sm font-medium">
                    <ArrowLeft className="w-4 h-4" /> Back to feed
                </button>

                {/* Post */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-6">
                    <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center pt-1">
                            <VoteControls post={selectedPost} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                {selectedPost.is_pinned && (
                                    <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-200">📌 Pinned</span>
                                )}
                                <span className="font-bold text-slate-700">{selectedPost.author.name}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{timeAgo(selectedPost.created_at)}</span>
                                {selectedPost.subject && (
                                    <>
                                        <span>•</span>
                                        <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">{selectedPost.subject.code}</span>
                                    </>
                                )}
                            </div>
                            <h1 className="text-xl font-bold text-slate-900 mb-3">{selectedPost.title}</h1>
                            <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedPost.body}</p>

                            {selectedPost.image_url && <PostImage url={selectedPost.image_url} />}

                            {(selectedPost.author.id === user?.id || user?.is_admin) && (
                                <button
                                    onClick={() => handleDeletePost(selectedPost.id)}
                                    className="mt-4 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Delete Post
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Comment input */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-4">
                    {replyingTo && (
                        <div className="flex items-center gap-2 mb-3 p-2 bg-slate-50 rounded-lg">
                            <CornerDownRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs text-slate-500">
                                Replying to <strong className="text-slate-700">{replyingTo.is_ai ? 'Gasana AI' : replyingTo.author.name}</strong>
                            </span>
                            <button onClick={() => setReplyingTo(null)} className="ml-auto p-0.5 text-slate-300 hover:text-slate-500">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    )}
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
                            {user?.name?.[0]?.toUpperCase() ?? 'U'}
                        </div>
                        <div className="flex-1 flex gap-2">
                            <div className="flex-1 relative">
                                <input
                                    value={commentText}
                                    onChange={(e) => setCommentText(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddComment() } }}
                                    placeholder={replyingTo ? `Reply to ${replyingTo.is_ai ? 'Gasana AI' : replyingTo.author.name}...` : 'Write a comment... (type @gasana to ask AI)'}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 transition-all"
                                />
                            </div>
                            <button
                                onClick={handleAddComment}
                                disabled={commenting || !commentText.trim()}
                                className="px-4 py-2.5 bg-black hover:bg-slate-800 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors flex items-center gap-1.5"
                            >
                                <Send className="w-4 h-4" /> {commenting ? '...' : 'Reply'}
                            </button>
                        </div>
                    </div>
                    {/* @gasana hint */}
                    {commentText.toLowerCase().includes('@gasana') && !commenting && (
                        <div className="mt-2 ml-11 flex items-center gap-2 text-xs text-teal-600 bg-teal-50 px-3 py-1.5 rounded-lg">
                            <Bot className="w-3.5 h-3.5" /> Gasana AI will read the post and reply to your question
                        </div>
                    )}
                    {aiThinking && (
                        <div className="mt-2 ml-11 flex items-center gap-2 text-xs text-teal-600 bg-teal-50 px-3 py-2 rounded-lg animate-pulse">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gasana AI is thinking...
                        </div>
                    )}
                </div>

                {/* Threaded comments */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-4">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider px-1 mb-3">
                        {selectedPost.comments?.length ?? 0} Comments
                    </h3>
                    <div>
                        {(selectedPost.comments ?? []).map(c => (
                            <ThreadedComment key={c.id} comment={c} depth={0} />
                        ))}
                    </div>
                    {(selectedPost.comments ?? []).length === 0 && (
                        <div className="text-center py-8 text-slate-400 text-sm">No comments yet. Be the first to reply!</div>
                    )}
                </div>
            </div>
        )
    }

    /* ── Feed View ─────────────────────────────────────────────────────────── */

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Community</h1>
                    <p className="text-slate-500 text-sm mt-1">Discuss, share, and help fellow KTU students.</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="px-5 py-2.5 bg-black hover:bg-slate-800 text-white text-sm font-bold rounded-xl shadow-sm transition-all flex items-center gap-2 self-start"
                >
                    <Plus className="w-4 h-4" /> New Post
                </button>
            </div>

            {/* Filters / Sort */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="flex bg-slate-100 rounded-xl p-1">
                    {(['latest', 'top'] as const).map(s => (
                        <button
                            key={s}
                            onClick={() => setSort(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors capitalize ${sort === s ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <select
                        value={subjectFilter ?? ''}
                        onChange={(e) => setSubjectFilter(e.target.value ? Number(e.target.value) : undefined)}
                        className="text-sm bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 transition-all text-slate-700"
                    >
                        <option value="">All Subjects</option>
                        {subjects.map(s => (
                            <option key={s.id} value={s.id}>{s.code} – {s.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Create Post Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4 border border-slate-100">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">Create a Post</h2>
                            <button onClick={() => { setShowCreate(false); setNewImageUrl(undefined) }} className="p-1 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <input
                            value={newTitle}
                            onChange={e => setNewTitle(e.target.value)}
                            placeholder="Title"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 transition-all font-medium"
                        />
                        <textarea
                            value={newBody}
                            onChange={e => setNewBody(e.target.value)}
                            placeholder="What's on your mind?"
                            rows={5}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 transition-all resize-none"
                        />

                        {/* Image Upload */}
                        <div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/gif,image/webp"
                                className="hidden"
                                onChange={handleImageUpload}
                            />
                            {newImageUrl ? (
                                <div className="relative rounded-xl overflow-hidden border border-slate-200">
                                    <img
                                        src={newImageUrl.startsWith('http') ? newImageUrl : `${API_BASE}${newImageUrl}`}
                                        alt="Upload preview"
                                        className="w-full max-h-48 object-cover"
                                    />
                                    <button
                                        onClick={() => setNewImageUrl(undefined)}
                                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-lg transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={uploading}
                                    className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-slate-200 rounded-xl text-sm text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors"
                                >
                                    {uploading ? (
                                        <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                                    ) : (
                                        <><ImagePlus className="w-4 h-4" /> Add Image (optional)</>
                                    )}
                                </button>
                            )}
                        </div>

                        <select
                            value={newSubjectId ?? ''}
                            onChange={e => setNewSubjectId(e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-50 transition-all text-slate-700"
                        >
                            <option value="">No subject tag (general)</option>
                            {subjects.map(s => (
                                <option key={s.id} value={s.id}>{s.code} – {s.name}</option>
                            ))}
                        </select>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={() => { setShowCreate(false); setNewImageUrl(undefined) }} className="px-4 py-2.5 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">Cancel</button>
                            <button
                                onClick={handleCreate}
                                disabled={creating || !newTitle.trim() || !newBody.trim()}
                                className="px-6 py-2.5 bg-black hover:bg-slate-800 text-white text-sm font-bold rounded-xl disabled:opacity-40 transition-colors"
                            >
                                {creating ? 'Posting...' : 'Post'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Posts list */}
            {loading ? (
                <div className="flex items-center justify-center h-48">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent" />
                </div>
            ) : posts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
                    <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <h3 className="font-bold text-slate-900 mb-1">No posts yet</h3>
                    <p className="text-slate-500 text-sm mb-4">Start the conversation by creating the first post.</p>
                    <button onClick={() => setShowCreate(true)} className="text-sm font-bold text-black hover:underline">Create Post</button>
                </div>
            ) : (
                <div className="space-y-3">
                    {posts.map(post => (
                        <div
                            key={post.id}
                            onClick={() => openPost(post.id)}
                            className={`rounded-2xl border shadow-[0_2px_10px_rgb(0,0,0,0.02)] p-5 cursor-pointer hover:border-slate-200 transition-all group ${post.is_pinned
                                    ? 'bg-amber-50/40 border-amber-200'
                                    : 'bg-white border-slate-100'
                                }`}
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex flex-col items-center pt-0.5">
                                    <VoteControls post={post} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                                        {post.is_pinned && (
                                            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold border border-amber-200">📌 Pinned</span>
                                        )}
                                        <span className="font-bold text-slate-700">{post.author.name}</span>
                                        <span>•</span>
                                        <span>{timeAgo(post.created_at)}</span>
                                        {post.subject && (
                                            <>
                                                <span>•</span>
                                                <span className="px-2 py-0.5 bg-slate-100 rounded-full text-xs font-medium text-slate-600">{post.subject.code}</span>
                                            </>
                                        )}
                                    </div>
                                    <h3 className="font-bold text-slate-900 mb-1 group-hover:text-black transition-colors">{post.title}</h3>
                                    <p className="text-sm text-slate-600 line-clamp-2">{post.body}</p>
                                    {post.image_url && (
                                        <div className="mt-2 rounded-xl overflow-hidden border border-slate-100 max-h-48">
                                            <img
                                                src={post.image_url.startsWith('http') ? post.image_url : `${API_BASE}${post.image_url}`}
                                                alt=""
                                                className="w-full max-h-48 object-cover"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                                            />
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3 mt-3 text-xs text-slate-400">
                                        <span className="flex items-center gap-1">
                                            <MessageSquare className="w-3.5 h-3.5" /> {post.comment_count} comments
                                        </span>
                                        {post.image_url && (
                                            <span className="flex items-center gap-1">
                                                <ImagePlus className="w-3.5 h-3.5" /> image
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Community
