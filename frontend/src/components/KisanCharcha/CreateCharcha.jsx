import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Plus, Lock, Globe, Type, AlignLeft, Tag } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const CATEGORIES = ['Crops', 'Livestock', 'Market', 'Weather', 'Equipment', 'General'];

export default function CreateCharcha() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'General',
    visibility: 'public'
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (formData.title.length > 100) newErrors.title = 'Title must be 100 characters or less';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.length > 500) newErrors.description = 'Description must be 500 characters or less';
    if (!formData.category) newErrors.category = 'Category is required';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/charchas`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate(`/charchas/${response.data.charcha.id}`);
    } catch (error) {
      console.error('Failed to create Charcha:', error);
      setErrors({ submit: error.response?.data?.error || 'Failed to create Charcha' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="max-w-2xl mx-auto">
        {/* Header - Glassmorphism */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/charchas')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Create New</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Create Charcha</h1>
              <p className="text-white/50 mt-1">Start a new community discussion</p>
            </div>
          </div>
        </div>
        
        {/* Form - Glassmorphism */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Charcha Name */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Type size={16} className="text-emerald-400" />
              Charcha Name *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:bg-white/15 text-white placeholder-white/40 font-medium transition-all"
              placeholder="Enter charcha name..."
              maxLength={100}
            />
            <div className="flex justify-between text-xs mt-2">
              <span className="text-red-400">{errors.title || ''}</span>
              <span className="text-white/40">{formData.title.length}/100</span>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <AlignLeft size={16} className="text-emerald-400" />
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:bg-white/15 text-white placeholder-white/40 font-medium transition-all resize-none"
              placeholder="Describe what this Charcha is about..."
              rows={4}
              maxLength={500}
            />
            <div className="flex justify-between text-xs mt-2">
              <span className="text-red-400">{errors.description || ''}</span>
              <span className="text-white/40">{formData.description.length}/500</span>
            </div>
          </div>

          {/* Category */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-3">
              <Tag size={16} className="text-emerald-400" />
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white font-medium appearance-none cursor-pointer hover:bg-white/15 transition-all"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
              ))}
            </select>
          </div>

          {/* Visibility */}
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
            <label className="flex items-center gap-2 text-sm font-semibold text-white mb-4">
              {formData.visibility === 'public' ? <Globe size={16} className="text-emerald-400" /> : <Lock size={16} className="text-orange-400" />}
              Visibility
            </label>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all border border-white/10">
                <input
                  type="radio"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-emerald-400" />
                    <span className="font-semibold text-white">Public</span>
                  </div>
                  <span className="text-sm text-white/50">Anyone can join instantly</span>
                </div>
              </label>
              <label className="flex items-center gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all border border-white/10">
                <input
                  type="radio"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
                  className="w-4 h-4 text-orange-500 focus:ring-orange-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Lock size={16} className="text-orange-400" />
                    <span className="font-semibold text-white">Private</span>
                  </div>
                  <span className="text-sm text-white/50">Requires your approval to join</span>
                </div>
              </label>
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-500/20 backdrop-blur-xl rounded-2xl p-4 border border-red-500/30">
              <p className="text-red-400 font-medium">{errors.submit}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus size={20} />
              {loading ? 'Creating...' : 'Create Charcha'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/charchas')}
              className="px-6 py-4 bg-white/10 text-white rounded-xl hover:bg-white/20 transition font-semibold border border-white/10"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
