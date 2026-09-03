import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Users, Plus, Bell, Search, MessageSquare, Crown, Shield, X, Check } from 'lucide-react';
import { API_ROOT } from '../../config';

const API_URL = API_ROOT;

export default function CharchaDashboard() {
  const [myCharchas, setMyCharchas] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [activeRequest, setActiveRequest] = useState(null);

  useEffect(() => {
    // Show popup when new requests arrive
    if (pendingRequests.length > 0 && !showRequestPopup) {
      setActiveRequest(pendingRequests[0]);
      setShowRequestPopup(true);
    }
  }, [pendingRequests, showRequestPopup]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [charchasRes, requestsRes, notifRes] = await Promise.all([
        axios.get(`${API_URL}/api/charchas/my/list`, { headers }),
        axios.get(`${API_URL}/api/join-requests/pending`, { headers }),
        axios.get(`${API_URL}/api/notifications/unread-count/total`, { headers })
      ]);

      setMyCharchas(charchasRes.data.charchas || []);
      setPendingRequests(requestsRes.data.requests || []);
      setUnreadCount(notifRes.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/join-requests/${requestId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowRequestPopup(false);
      setActiveRequest(null);
      // Refresh all data including notification count
      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleReject = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/join-requests/${requestId}/reject`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowRequestPopup(false);
      setActiveRequest(null);
      // Refresh all data including notification count
      await fetchDashboardData();
    } catch (error) {
      console.error('Failed to reject request:', error);
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
      {/* Join Request Popup - Glassmorphism */}
      {showRequestPopup && activeRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Users className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">New Join Request</h3>
                  <p className="text-sm text-white/50">Someone wants to join your Charcha</p>
                </div>
              </div>
              <button
                onClick={() => setShowRequestPopup(false)}
                className="text-white/50 hover:text-white transition p-2 hover:bg-white/10 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mb-4 border border-white/10">
              <p className="text-sm text-white/50 mb-2">User</p>
              <p className="font-semibold text-white text-lg">{activeRequest.user_name}</p>
              <p className="text-sm text-white/50 mt-3 mb-1">Charcha</p>
              <p className="font-medium text-white/90">{activeRequest.charcha_title}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleApprove(activeRequest.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition font-semibold shadow-lg shadow-emerald-500/30"
              >
                <Check size={20} />
                Approve
              </button>
              <button
                onClick={() => handleReject(activeRequest.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition font-semibold border border-white/10"
              >
                <X size={20} />
                Reject
              </button>
            </div>

            {pendingRequests.length > 1 && (
              <p className="text-center text-sm text-white/50 mt-3">
                +{pendingRequests.length - 1} more request{pendingRequests.length > 2 ? 's' : ''} pending
              </p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        {/* Header - Glassmorphism */}
        <div className="mb-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wider">Community Hub</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Kisan Charcha</h1>
                <p className="text-white/50">Connect, share, and learn from fellow farmers</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/charchas/browse"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-xl hover:bg-white/20 transition font-semibold"
                >
                  <Search size={18} />
                  Browse
                </Link>
                <Link
                  to="/charchas/create"
                  className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition font-semibold shadow-lg shadow-emerald-500/30"
                >
                  <Plus size={18} />
                  Create
                </Link>
                <Link
                  to="/notifications"
                  className="relative flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/10 text-white rounded-xl hover:bg-white/20 transition font-semibold"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards - Glassmorphism */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-6 border border-emerald-500/20 hover:bg-white/10 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm font-medium mb-1">My Charchas</p>
                <p className="text-3xl font-bold text-white">{myCharchas.length}</p>
              </div>
              <div className="w-14 h-14 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-emerald-400" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm font-medium mb-1">Pending Requests</p>
                <p className="text-3xl font-bold text-white">{pendingRequests.length}</p>
              </div>
              <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center">
                <Users className="text-orange-400" size={28} />
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/50 text-sm font-medium mb-1">Unread Notifications</p>
                <p className="text-3xl font-bold text-white">{unreadCount}</p>
              </div>
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Bell className="text-blue-400" size={28} />
              </div>
            </div>
          </div>
        </div>

        {/* My Charchas - Glassmorphism */}
        <section className="mb-6">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <MessageSquare size={24} className="text-emerald-400" />
            My Charchas
          </h2>
          {myCharchas.length === 0 ? (
            <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/10">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="text-white/40" size={32} />
              </div>
              <p className="text-white/60 mb-4">You haven't joined any Charchas yet</p>
              <Link
                to="/charchas/browse"
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition font-semibold shadow-lg shadow-emerald-500/30"
              >
                <Search size={18} />
                Browse Charchas
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {myCharchas.map(charcha => (
                <Link
                  key={charcha.id}
                  to={`/charchas/${charcha.id}`}
                  className="group bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-white/10 hover:bg-white/15 hover:border-emerald-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-bold text-lg text-white group-hover:text-emerald-400 transition line-clamp-2 flex-1">
                      {charcha.title}
                    </h3>
                    {charcha.user_role === 'OWNER' && (
                      <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg font-semibold border border-yellow-500/30 ml-2">
                        <Crown size={12} />
                        Owner
                      </span>
                    )}
                    {charcha.user_role === 'MODERATOR' && (
                      <span className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-lg font-semibold border border-blue-500/30 ml-2">
                        <Shield size={12} />
                        Mod
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/60 mb-4 line-clamp-2">{charcha.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg font-medium border border-emerald-500/30">
                      {charcha.category}
                    </span>
                    <span className="text-white/50 font-medium flex items-center gap-1">
                      <Users size={14} />
                      {charcha.member_count}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Pending Requests Section - Glassmorphism */}
        {pendingRequests.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Users size={24} className="text-orange-400" />
              Pending Join Requests
            </h2>
            <div className="space-y-3">
              {pendingRequests.map(request => (
                <div
                  key={request.id}
                  className="bg-white/10 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-white/15 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/30">
                      {request.user_name[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{request.user_name}</p>
                      <p className="text-sm text-white/60">
                        wants to join <span className="font-medium text-emerald-400">"{request.charcha_title}"</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition font-semibold shadow-lg shadow-emerald-500/30"
                    >
                      <Check size={18} />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition font-semibold border border-white/10"
                    >
                      <X size={18} />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
