import { useState, useEffect } from 'react'
import { apiClient } from '../config'
import { MessageSquare, Heart, Share2, Send, User, Tag, Clock, ThumbsUp } from 'lucide-react'

const CommunityForum = () => {
    const [posts, setPosts] = useState([])
    const [loading, setLoading] = useState(true)
    const [newPost, setNewPost] = useState('')
    const [showPostModal, setShowPostModal] = useState(false)
    const [activeTab, setActiveTab] = useState('feed') // 'feed', 'my-posts', 'popular'

    useEffect(() => {
        fetchPosts()
    }, [])

    const fetchPosts = async () => {
        try {
            // In a real app, fetch from API
            // const response = await apiClient.get('/forum/posts')
            // setPosts(response.data)

            // Simulating API call
            setTimeout(() => {
                const saved = localStorage.getItem('forum_posts')
                if (saved) {
                    setPosts(JSON.parse(saved))
                } else {
                    setPosts(MOCK_POSTS)
                }
                setLoading(false)
            }, 800)
        } catch (error) {
            console.error('Failed to fetch posts', error)
            setLoading(false)
        }
    }

    const handlePostSubmit = async (e) => {
        e.preventDefault()
        if (!newPost.trim()) return

        const post = {
            id: Date.now(),
            author: 'You', // In real app, get from user context
            role: 'Farmer',
            content: newPost,
            likes: 0,
            comments: 0,
            time: 'Just now',
            tags: ['General'],
            isLiked: false
        }

        const updatedPosts = [post, ...posts]
        setPosts(updatedPosts)
        localStorage.setItem('forum_posts', JSON.stringify(updatedPosts))
        setNewPost('')
        setShowPostModal(false)
    }

    const handleLike = (postId) => {
        const updatedPosts = posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    likes: post.isLiked ? post.likes - 1 : post.likes + 1,
                    isLiked: !post.isLiked
                }
            }
            return post
        })
        setPosts(updatedPosts)
        localStorage.setItem('forum_posts', JSON.stringify(updatedPosts))
    }

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
            {loading ? (
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
                    {posts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-300">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">No discussions yet</h3>
                            <p className="text-gray-500 mt-1">Be the first to start a conversation!</p>
                        </div>
                    ) : (
                        posts.map(post => (
                            <div key={post.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center text-green-700 font-bold">
                                            {post.author.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{post.author}</h3>
                                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                                <span className="bg-gray-100 px-2 py-0.5 rounded-full">{post.role}</span>
                                                <span>•</span>
                                                <span className="flex items-center gap-1"><Clock size={12} /> {post.time}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <p className="text-gray-800 mb-4 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                                <div className="flex flex-wrap gap-2 mb-4">
                                    {post.tags.map((tag, i) => (
                                        <span key={i} className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-medium rounded-md flex items-center gap-1">
                                            <Tag size={12} /> {tag}
                                        </span>
                                    ))}
                                </div>

                                <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                                    <button
                                        onClick={() => handleLike(post.id)}
                                        className={`flex items-center gap-2 text-sm font-medium transition-colors ${post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'}`}
                                    >
                                        <Heart size={18} fill={post.isLiked ? "currentColor" : "none"} />
                                        {post.likes} Likes
                                    </button>
                                    <button className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">
                                        <MessageSquare size={18} />
                                        {post.comments} Comments
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
                                    disabled={!newPost.trim()}
                                    className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
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

const MOCK_POSTS = [
    {
        id: 1,
        author: 'Ram Kumar',
        role: 'Wheat Expert',
        content: 'What is the best time to sow HD-2967 wheat variety in Punjab? I usually do it in early November but hearing mixed reviews this year due to temperature changes.',
        likes: 12,
        comments: 4,
        time: '2 hours ago',
        tags: ['Wheat', 'Sowing'],
        isLiked: false
    },
    {
        id: 2,
        author: 'Sita Devi',
        role: 'Organic Farmer',
        content: 'Sharing my success with waste decomposer. Soil health improved significantly in 3 months! The earthworm count has doubled and water retention is much better.',
        likes: 45,
        comments: 12,
        time: '5 hours ago',
        tags: ['Organic', 'Soil Health'],
        isLiked: true
    },
    {
        id: 3,
        author: 'Mohan Singh',
        role: 'Farmer',
        content: 'My potato leaves are turning yellow with small black spots. Is this blight? Please help identify the disease and suggest organic remedies if possible.',
        likes: 8,
        comments: 6,
        time: '1 day ago',
        tags: ['Potato', 'Disease'],
        isLiked: false
    }
]

export default CommunityForum
