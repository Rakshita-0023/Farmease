import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Search, Filter, Users, Lock, Globe, Eye, UserPlus } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const CATEGORIES = ['All', 'Crops', 'Livestock', 'Market', 'Weather', 'Equipment', 'General'];

export default function CharchaBrowser() {
  const navigate = useNavigate();
  const [charchas, setCharchas] = useState([]);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharchas();
  }, [category, search]);

  const fetchCharchas = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = {};
      if (category !== 'All') params.category = category;
      if (search) params.search = search;

      const response = await axios.get(`${API_URL}/api/charchas/browse/public`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });
      setCharchas(response.data.charchas || []);
    } catch (error) {
      console.error('Failed to fetch Charchas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (charchaId, e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/charchas/${charchaId}/join`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Join request sent successfully!');
      fetchCharchas();
    } catch (error) {
      console.error('Failed to join Charcha:', error);
      alert(error.response?.data?.error || 'Failed to join');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="max-w-7xl mx-auto">
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
                <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Discover</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Browse Charchas</h1>
              <p className="text-white/50 mt-1">Find and join communities that interest you</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 mt-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input
                type="text"
                placeholder="Search Charchas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/50 focus:bg-white/15 text-white placeholder-white/40 text-sm font-medium transition-all"
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="pl-12 pr-8 py-3 rounded-xl bg-white/10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 text-white font-medium appearance-none cursor-pointer hover:bg-white/15 transition-all"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} className="bg-gray-900">{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Charchas Grid - Glassmorphism */}
        {charchas.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/10">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="text-white/40" size={32} />
            </div>
            <p className="text-white/60 mb-4">No Charchas found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {charchas.map(charcha => (
              <Link
                key={charcha.id}
                to={`/charchas/${charcha.id}`}
                className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 hover:border-emerald-500/50 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition line-clamp-2 flex-1">
                    {charcha.title}
                  </h3>
                  {charcha.visibility === 'private' ? (
                    <Lock className="text-orange-400 flex-shrink-0 ml-2" size={16} />
                  ) : (
                    <Globe className="text-emerald-400 flex-shrink-0 ml-2" size={16} />
                  )}
                </div>
                <p className="text-sm text-white/60 mb-4 line-clamp-3">{charcha.description}</p>
                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-medium border border-emerald-500/30">
                    {charcha.category}
                  </span>
                  <span className="text-white/50 font-medium flex items-center gap-1">
                    <Users size={14} />
                    {charcha.member_count}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition font-semibold border border-white/10"
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={(e) => handleJoin(charcha.id, e)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition font-semibold shadow-lg shadow-emerald-500/30"
                  >
                    <UserPlus size={16} />
                    Join
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
