import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Send, Users, Lock, Globe, MessageSquare, Crown, Shield } from 'lucide-react';
import { API_ROOT } from '../../config';

const API_URL = API_ROOT;

export default function CharchaView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [charcha, setCharcha] = useState(null);
  const [messages, setMessages] = useState([]);
  const [members, setMembers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchCharchaData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [charchaRes, messagesRes] = await Promise.all([
        axios.get(`${API_URL}/api/charchas/${id}`, { headers }),
        axios.get(`${API_URL}/api/charchas/${id}/messages`, { headers })
      ]);

      setCharcha(charchaRes.data.charcha);
      setMessages(messagesRes.data.messages || []);
      
      // Fetch members separately to avoid blocking if it fails
      try {
        const membersRes = await axios.get(`${API_URL}/api/charchas/${id}/members`, { headers });
        setMembers(membersRes.data.members || []);
      } catch (memberError) {
        console.error('Failed to fetch members:', memberError);
        setMembers([]);
      }
    } catch (error) {
      console.error('Failed to fetch Charcha data:', error);
      if (error.response?.status === 404) {
        setCharcha(null);
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCharchaData();
    const interval = setInterval(fetchCharchaData, 5000);
    return () => clearInterval(interval);
  }, [fetchCharchaData]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    setNewMessage(value);

    // Check if user is typing a mention
    const textBeforeCursor = value.substring(0, cursorPos);
    const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

    if (mentionMatch) {
      const search = mentionMatch[1].toLowerCase();
      setMentionSearch(search);
      setMentionPosition(mentionMatch.index);
      
      const filtered = members.filter(member => 
        member.user_name.toLowerCase().includes(search)
      );
      setFilteredMembers(filtered);
      setShowMentionDropdown(filtered.length > 0);
      setSelectedMentionIndex(0);
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (member) => {
    const beforeMention = newMessage.substring(0, mentionPosition);
    const afterMention = newMessage.substring(inputRef.current.selectionStart);
    const newText = `${beforeMention}@${member.user_name} ${afterMention}`;
    
    setNewMessage(newText);
    setShowMentionDropdown(false);
    setMentionSearch('');
    
    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = mentionPosition + member.user_name.length + 2;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showMentionDropdown) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredMembers.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => prev > 0 ? prev - 1 : 0);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredMembers[selectedMentionIndex]) {
          handleMentionSelect(filteredMembers[selectedMentionIndex]);
        }
      } else if (e.key === 'Escape') {
        setShowMentionDropdown(false);
      }
    }
  };

  const renderMessageContent = (content) => {
    // Split content by mentions and render them with different color
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} className="text-emerald-400 font-semibold">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/charchas/${id}/messages`, 
        { content: newMessage },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setNewMessage('');
      setShowMentionDropdown(false);
      fetchCharchaData();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert(error.response?.data?.error || 'Failed to send message');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!charcha) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/10">
          <p className="text-white/60 mb-4">Charcha not found</p>
          <button
            onClick={() => navigate('/charchas')}
            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="max-w-5xl mx-auto">
        {/* Header - Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl mb-6">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/charchas')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Discussion</span>
              </div>
              <h1 className="text-3xl font-bold text-white">{charcha.title}</h1>
              <p className="text-white/60 mt-2">{charcha.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg font-medium border border-emerald-500/30 flex items-center gap-1">
              {charcha.category}
            </span>
            <span className="px-3 py-1.5 bg-white/10 text-white/70 rounded-lg font-medium border border-white/10 flex items-center gap-1">
              <Users size={14} />
              {charcha.member_count} members
            </span>
            <span className="px-3 py-1.5 bg-white/10 text-white/70 rounded-lg font-medium border border-white/10 flex items-center gap-1">
              {charcha.visibility === 'private' ? (
                <>
                  <Lock size={14} className="text-orange-400" />
                  Private
                </>
              ) : (
                <>
                  <Globe size={14} className="text-emerald-400" />
                  Public
                </>
              )}
            </span>
          </div>
        </div>

        {/* Messages - Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl mb-6">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <MessageSquare size={20} className="text-emerald-400" />
              Discussion
            </h2>
          </div>
          <div className="h-96 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="text-white/40" size={24} />
                  </div>
                  <p className="text-white/50">No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className="flex gap-3 group">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30 flex-shrink-0">
                    {msg.user_name[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-semibold text-white">{msg.user_name}</span>
                      {msg.user_role === 'OWNER' && (
                        <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded font-semibold border border-yellow-500/30">
                          <Crown size={10} />
                          Owner
                        </span>
                      )}
                      {msg.user_role === 'MODERATOR' && (
                        <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded font-semibold border border-blue-500/30">
                          <Shield size={10} />
                          Mod
                        </span>
                      )}
                      <span className="text-xs text-white/40">
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-white/90 leading-relaxed break-words">
                      {renderMessageContent(msg.content)}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input - Glassmorphism */}
        <div className="relative">
          {/* Mention Dropdown */}
          {showMentionDropdown && filteredMembers.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl overflow-hidden max-h-64">
              <div className="p-2">
                <p className="text-xs text-white/50 px-3 py-2 font-semibold uppercase tracking-wider">
                  Mention Member
                </p>
                <div className="space-y-1 max-h-52 overflow-y-auto custom-scrollbar">
                  {filteredMembers.map((member, index) => (
                    <button
                      key={member.user_id}
                      type="button"
                      onClick={() => handleMentionSelect(member)}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left
                        ${index === selectedMentionIndex 
                          ? 'bg-emerald-500/30 border border-emerald-500/50' 
                          : 'hover:bg-white/10 border border-transparent'
                        }
                      `}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30 flex-shrink-0">
                        {member.user_name[0].toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{member.user_name}</p>
                        {member.role !== 'MEMBER' && (
                          <p className="text-xs text-white/50 flex items-center gap-1">
                            {member.role === 'OWNER' && (
                              <>
                                <Crown size={10} className="text-yellow-400" />
                                Owner
                              </>
                            )}
                            {member.role === 'MODERATOR' && (
                              <>
                                <Shield size={10} className="text-blue-400" />
                                Moderator
                              </>
                            )}
                          </p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSendMessage} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-2xl">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message... (use @ to mention)"
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:bg-white/15 text-white placeholder-white/40 font-medium transition-all"
                maxLength={2000}
                autoComplete="off"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={18} />
                Send
              </button>
            </div>
            <div className="text-xs text-white/40 mt-2 text-right">
              {newMessage.length}/2000
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
