import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Bell, MessageSquare, UserPlus, CheckCircle, XCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // Mark all notifications as read when visiting the notification center
    markAllAsRead();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_URL}/api/notifications/mark-all-read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'MENTION': return <MessageSquare className="text-blue-400" size={20} />;
      case 'JOIN_REQUEST': return <UserPlus className="text-orange-400" size={20} />;
      case 'JOIN_APPROVED': return <CheckCircle className="text-emerald-400" size={20} />;
      case 'JOIN_REJECTED': return <XCircle className="text-red-400" size={20} />;
      default: return <Bell className="text-white/50" size={20} />;
    }
  };

  const handleNotificationClick = (notif) => {
    // Mark as read when clicked
    if (!notif.is_read) {
      markAsRead(notif.id);
    }
    
    // Navigate to the charcha if there's a charcha_id
    if (notif.charcha_id) {
      navigate(`/charchas/${notif.charcha_id}`);
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
      <div className="max-w-4xl mx-auto">
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
                <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                <span className="text-blue-400 text-xs font-semibold uppercase tracking-wider">Notification Center</span>
              </div>
              <h1 className="text-3xl font-bold text-white">Notifications</h1>
              <p className="text-white/50 mt-1">Stay updated with your community</p>
            </div>
          </div>
        </div>

        {/* Notifications List - Glassmorphism */}
        {notifications.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-12 text-center border border-white/10">
            <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="text-white/40" size={32} />
            </div>
            <p className="text-white/60 mb-4">No notifications yet</p>
            <Link
              to="/charchas"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:from-emerald-600 hover:to-teal-600 transition font-semibold shadow-lg shadow-emerald-500/30"
            >
              <ArrowLeft size={18} />
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notif => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`
                  bg-white/10 backdrop-blur-xl rounded-2xl p-5 border transition-all cursor-pointer
                  ${notif.is_read 
                    ? 'border-white/10 hover:bg-white/15' 
                    : 'border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    ${notif.is_read ? 'bg-white/10' : 'bg-blue-500/20'}
                  `}>
                    {getNotificationIcon(notif.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium leading-relaxed">{notif.message}</p>
                    <p className="text-xs text-white/40 mt-2">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <span className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0 mt-1 shadow-lg shadow-blue-400/50"></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
