import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../config'
import { MessageSquare, Heart, Share2, Send, User, Tag, Clock, ThumbsUp, Loader2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const CommunityForum = () => {
    const [newPost, setNewPost] = useState('')
    const [showPostModal, setShowPostModal] = useState(false)
    const [activeTab, setActiveTab] = useState('feed') // 'feed', 'my-posts', 'popular'
    const queryClient = useQueryClient()
    const user = JSON.parse(localStorage.getItem('user')) || {}

    // Fetch posts
    const { data: posts = [], isLoading } = useQuery({
        queryKey: ['forum-posts'],
        queryFn: () => apiClient.get('/forum/posts')
    })

    // Create post mutation
    const createPostMutation = useMutation({
        mutationFn: async (content) => {
            return apiClient.post('/forum/posts', {
                content,
                tags: ['General'], // Default tag for now
                author_name: user.name || 'Farmer'
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['forum-posts'])
            setNewPost('')
            setShowPostModal(false)
        }
    })

    // Like mutation (Optimistic UI)
    const likeMutation = useMutation({
        mutationFn: async (postId) => {
            return apiClient.post(`/forum/posts/${postId}/like`)
        },
        onMutate: async (postId) => {
            await queryClient.cancelQueries(['forum-posts'])
            const previousPosts = queryClient.getQueryData(['forum-posts'])

            queryClient.setQueryData(['forum-posts'], old => {
                return old.map(post =>
                    post.id === postId
                        ? { ...post, likes: (post.likes || 0) + 1, isLiked: true }
                        : post
                )
            })
            return { previousPosts }
        },
        onError: (err, newTodo, context) => {
            queryClient.setQueryData(['forum-posts'], context.previousPosts)
        },
        onSettled: () => {
            queryClient.invalidateQueries(['forum-posts'])
        }
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
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-green-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        👥 Kisan Charcha
                    </h1>
                    <p className="text-gray-500 mt-1">Connect, share, and learn from fellow farmers</p>
                </div>
                <button
                    onClick={() => setShowPostModal(true)}
                    className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-colors flex items-center gap-2 shadow-lg shadow-green-200"
                >
                    <Send size={20} />
                    Start Discussion
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 border-b border-gray-200 overflow-x-auto pb-1">
                {['feed', 'popular', 'my-posts'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 font-medium capitalize whitespace-nowrap transition-colors relative ${activeTab === tab ? 'text-green-600' : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.replace('-', ' ')}
                        {activeTab === tab && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Feed */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-pulse">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 bg-gray-100 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-100 rounded w-1/4" />
                                    <div className="h-4 bg-gray-100 rounded w-1/6" />
                                </div>
                            </div>
                            <div className="h-16 bg-gray-100 rounded mt-4" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredPosts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No discussions yet</h3>
                            <p className="text-gray-500 mt-1">Be the first to start a conversation!</p>
                        </div>
                    ) : (
                        filteredPosts.map(post => (
                            <div key={post.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center text-green-700 font-bold">
                                            {(post.author_name || 'F').charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{post.author_name || 'Farmer'}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded-full">Farmer</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Just now'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-800 mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {(post.tags || ['General']).map((tag, i) => (
                                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-md flex items-center gap-1">
                                            <Tag size={12} /> {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                                    <button
                                        onClick={() => likeMutation.mutate(post.id)}
                                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                                    >
                                        <Heart size={18} fill={post.isLiked ? "currentColor" : "none"} />
                                        {post.likes || 0} Likes
                                    </button>
                                    <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                                        <MessageSquare size={18} />
                                        {post.comments_count || 0} Comments
                                    </button>
                                    <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-green-600 transition-colors ml-auto">
                                        <Share2 size={18} />
                                        Share
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Post Modal */}
            {showPostModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800">Create Post</h3>
                            <button onClick={() => setShowPostModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-6">
                            <textarea
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                placeholder="What's on your mind? Ask a question or share a tip..."
                                className="w-full h-32 p-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none mb-4"
                                autoFocus
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setShowPostModal(false)}
                                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePostSubmit}
                                    disabled={!newPost.trim() || createPostMutation.isPending}
                                    className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {createPostMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                                    Post
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CommunityForum
