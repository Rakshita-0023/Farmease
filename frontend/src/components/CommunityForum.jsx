import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { apiClient } from '../config'
import { MessageSquare, Heart, Share2, Send, Tag, Clock, Loader2, X, Users } from 'lucide-react'

const CommunityForum = () => {
    const [newPost, setNewPost] = useState('')
    const [showPostModal, setShowPostModal] = useState(false)
    const [activeTab, setActiveTab] = useState('feed')
    const queryClient = useQueryClient()
    const user = JSON.parse(localStorage.getItem('user')) || {}

    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['forum-posts'],
        queryFn: () => apiClient.get('/forum/posts')
    })

    const createPostMutation = useMutation({
        mutationFn: async (content) => {
            return apiClient.post('/forum/posts', {
                content,
                tags: ['General'],
                author_name: user.name || 'Farmer'
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['forum-posts'])
            setNewPost('')
            setShowPostModal(false)
        }
    })

    const likeMutation = useMutation({
        mutationFn: async (postId) => apiClient.post(`/forum/posts/${postId}/like`),
        onMutate: async (postId) => {
            await queryClient.cancelQueries(['forum-posts'])
            const previousPosts = queryClient.getQueryData(['forum-posts'])
            queryClient.setQueryData(['forum-posts'], old =>
                old.map(post => post.id === postId ? { ...post, likes: (post.likes || 0) + 1, isLiked: true } : post)
            )
            return { previousPosts }
        },
        onError: (err, newTodo, context) => queryClient.setQueryData(['forum-posts'], context.previousPosts),
        onSettled: () => queryClient.invalidateQueries(['forum-posts'])
    })

    const handlePostSubmit = (e) => {
        e.preventDefault()
        if (!newPost.trim()) return
        createPostMutation.mutate(newPost)
    }

    const filteredPosts = posts.filter(post => {
        if (activeTab === 'my-posts') return post.user_id === user.id
        if (activeTab === 'popular') return (post.likes || 0) > 5
        return true
    })

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-emerald-600/80 via-teal-600/80 to-emerald-700/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10"
            >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="text-emerald-300" size={20} />
                            <span className="text-emerald-200 text-xs font-semibold uppercase tracking-wider">Community</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-white">Kisan Charcha</h1>
                        <p className="text-white/60 mt-1">Connect, share, and learn from fellow farmers</p>
                    </div>
                    <button
                        onClick={() => setShowPostModal(true)}
                        className="flex items-center gap-2 px-5 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all font-semibold"
                    >
                        <Send size={18} />
                        Start Discussion
                    </button>
                </div>
            </motion.div>

            {/* Tabs */}
            <div className="flex gap-2 bg-white/10 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 w-fit">
                {['feed', 'popular', 'my-posts'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2.5 rounded-lg text-sm font-semibold capitalize transition-all ${
                            activeTab === tab
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                                : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                    >
                        {tab.replace('-', ' ')}
                    </button>
                ))}
            </div>

            {/* Feed */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/10 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-white/10 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-white/10 rounded w-1/4" />
                                    <div className="h-4 bg-white/10 rounded w-1/6" />
                                </div>
                            </div>
                            <div className="h-16 bg-white/10 rounded mt-4" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredPosts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-12 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10"
                        >
                            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="text-white/40" size={32} />
                            </div>
                            <h3 className="text-lg font-semibold text-white">No discussions yet</h3>
                            <p className="text-white/50 mt-1">Be the first to start a conversation!</p>
                        </motion.div>
                    ) : (
                        filteredPosts.map((post, index) => (
                            <motion.div
                                key={post.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="bg-white/10 backdrop-blur-xl p-6 rounded-2xl border border-white/10 hover:bg-white/15 transition-all"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                                            {(post.author_name || 'F').charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-white">{post.author_name || 'Farmer'}</h3>
                                            <div className="flex items-center gap-2 text-xs text-white/40">
                                                <span className="bg-white/10 px-2 py-0.5 rounded-full">Farmer</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-white/80 mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(() => {
                                        try {
                                            const tags = Array.isArray(post.tags) 
                                                ? post.tags 
                                                : (typeof post.tags === 'string' ? JSON.parse(post.tags) : ['General']);
                                            return tags.map((tag, i) => (
                                                <span key={i} className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-lg flex items-center gap-1">
                                                    <Tag size={12} /> {tag}
                                                </span>
                                            ));
                                        } catch {
                                            return (
                                                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-medium rounded-lg flex items-center gap-1">
                                                    <Tag size={12} /> General
                                                </span>
                                            );
                                        }
                                    })()}
                                </div>

                                <div className="flex items-center gap-6 pt-4 border-t border-white/10">
                                    <button
                                        onClick={() => likeMutation.mutate(post.id)}
                                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.isLiked ? 'text-red-400' : 'text-white/50 hover:text-red-400'}`}
                                    >
                                        <Heart size={18} fill={post.isLiked ? "currentColor" : "none"} />
                                        {post.likes || 0}
                                    </button>
                                    <button className="flex items-center gap-2 text-sm font-medium text-white/50 hover:text-blue-400 transition-colors">
                                        <MessageSquare size={18} />
                                        {post.comments_count || 0}
                                    </button>
                                    <button className="flex items-center gap-2 text-sm font-medium text-white/50 hover:text-emerald-400 transition-colors ml-auto">
                                        <Share2 size={18} />
                                        Share
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            )}

            {/* Post Modal */}
            <AnimatePresence>
                {showPostModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                        onClick={() => setShowPostModal(false)}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="bg-slate-900/95 backdrop-blur-xl rounded-2xl w-full max-w-lg border border-white/10 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="p-5 border-b border-white/10 flex justify-between items-center">
                                <h3 className="font-bold text-white text-lg">Create Post</h3>
                                <button onClick={() => setShowPostModal(false)} className="text-white/50 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="p-5">
                                <textarea
                                    value={newPost}
                                    onChange={(e) => setNewPost(e.target.value)}
                                    placeholder="What's on your mind? Ask a question or share a tip..."
                                    className="w-full h-32 p-4 bg-white/10 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-emerald-500/50 resize-none mb-4"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setShowPostModal(false)}
                                        className="px-5 py-2.5 text-white/60 font-medium hover:bg-white/10 rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePostSubmit}
                                        disabled={!newPost.trim() || createPostMutation.isPending}
                                        className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {createPostMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                                        Post
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default CommunityForum
