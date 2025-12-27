import { useState, useEffect } from 'react'
import EmptyState from './EmptyState'
import './WeatherEnhancements.css'

const CommunityForum = () => {
    const [posts, setPosts] = useState(() => {
        const saved = localStorage.getItem('forum_posts')
        if (saved) return JSON.parse(saved)

        // Default initial data
        return [
            {
                id: 1,
                author: 'Ram Kumar',
                role: 'Wheat Expert',
                content: 'What is the best time to sow HD-2967 wheat variety in Punjab?',
                likes: 12,
                comments: 4,
                time: '2 hours ago',
                tags: ['Wheat', 'Sowing']
            },
            {
                id: 2,
                author: 'Sita Devi',
                role: 'Organic Farmer',
                content: 'Sharing my success with waste decomposer. Soil health improved significantly in 3 months!',
                likes: 45,
                comments: 12,
                time: '5 hours ago',
                tags: ['Organic', 'Soil Health']
            },
            {
                id: 3,
                author: 'Mohan Singh',
                role: 'Farmer',
                content: 'My potato leaves are turning yellow. Is this blight? Please help.',
                likes: 8,
                comments: 6,
                time: '1 day ago',
                tags: ['Potato', 'Disease']
            }
        ]
    })

    useEffect(() => {
        localStorage.setItem('forum_posts', JSON.stringify(posts))
    }, [posts])

    const [newPost, setNewPost] = useState('')
    const [showPostModal, setShowPostModal] = useState(false)

    const handlePostSubmit = (e) => {
        e.preventDefault()
        if (!newPost.trim()) return

        const post = {
            id: Date.now(),
            author: 'You',
            role: 'Farmer',
            content: newPost,
            likes: 0,
            comments: 0,
            time: 'Just now',
            tags: ['General']
        }

        setPosts([post, ...posts])
        setNewPost('')
        setShowPostModal(false)
    }

    return (
        <div className="community-page">
            <div className="page-header">
                <div>
                    <h1>👥 Kisan Charcha</h1>
                    <p>Connect with fellow farmers and experts</p>
                </div>
                <button className="add-farm-btn" onClick={() => setShowPostModal(true)}>
                    ✍️ Ask Question
                </button>
            </div>

            <div className="forum-feed">
                {posts.length === 0 ? (
                    <EmptyState
                        icon="👥"
                        title="No discussions yet"
                        description="Be the first to start a conversation! Ask a question or share your farming experience."
                        actionText="Ask First Question"
                        onAction={() => setShowPostModal(true)}
                    />
                ) : (
                    posts.map(post => (
                        <div key={post.id} className="forum-card">
                            <div className="post-header">
                                <div className="author-avatar">{post.author.charAt(0)}</div>
                                <div className="author-info">
                                    <span className="author-name">{post.author}</span>
                                    <span className="author-role">{post.role}</span>
                                </div>
                                <span className="post-time">{post.time}</span>
                            </div>

                            <div className="post-content">
                                <p>{post.content}</p>
                                <div className="post-tags">
                                    {post.tags.map((tag, i) => (
                                        <button key={i} className="tag clickable-tag" onClick={() => alert(`Filter by #${tag} coming soon!`)}>
                                            #{tag}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="post-actions">
                                <button className="action-btn-text large-action">
                                    <span className="icon">👍</span> {post.likes} Likes
                                </button>
                                <button className="action-btn-text large-action">
                                    <span className="icon">💬</span> {post.comments} Comments
                                </button>
                                <button className="action-btn-text large-action">
                                    <span className="icon">↗️</span> Share
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {showPostModal && (
                <div className="modal-overlay" onClick={() => setShowPostModal(false)}>
                    <div className="add-farm-modal" onClick={e => e.stopPropagation()}>
                        <h3>✍️ Ask a Question</h3>
                        <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="Type your question or share your experience..."
                            className="activity-notes"
                            style={{ minHeight: '120px' }}
                        />
                        <div className="modal-buttons">
                            <button onClick={handlePostSubmit}>Post</button>
                            <button onClick={() => setShowPostModal(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CommunityForum
