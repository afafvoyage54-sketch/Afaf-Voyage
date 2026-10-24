import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle2, AlertCircle, Trash2, CheckCheck, ChevronRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, simulateNotification } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTimestamp = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    return new Date(ts).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-full text-gray-600 hover:text-primary hover:bg-gray-100 transition-all focus:outline-none focus:ring-2 focus:ring-primary/20"
        title="Centre de notifications"
        aria-label="Notifications"
      >
        <Bell size={21} className={unreadCount > 0 ? 'text-[#305AA2] animate-swing' : ''} />
        
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-[#EA6624] text-[10px] font-black text-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-84 sm:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-[#EA6624]/10 text-[#EA6624] text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] text-[#305AA2] hover:underline font-bold flex items-center gap-1"
                  title="Tout marquer comme lu"
                >
                  <CheckCheck size={13} />
                  <span>Tout lu</span>
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearNotifications}
                  className="text-gray-400 hover:text-red-500 p-1 rounded-md transition-colors"
                  title="Effacer tout l'historique"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
            {notifications.length === 0 ? (
              <div className="px-6 py-10 text-center space-y-2">
                <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400">
                  <Bell size={22} className="opacity-40" />
                </div>
                <p className="text-xs font-semibold text-gray-800">Aucune notification</p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  Dès qu'un statut de réservation passe de "En attente" à "Confirmé" ou "Action requise", une alerte s'affiche en temps réel.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const isConfirmed = item.type === 'confirmed';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      markAsRead(item.id);
                      setIsOpen(false);
                      navigate('/track');
                    }}
                    className={`px-5 py-3.5 hover:bg-gray-50/80 cursor-pointer transition-colors flex items-start gap-3.5 relative ${
                      !item.read ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    {!item.read && (
                      <span className="absolute left-2 top-5 w-1.5 h-1.5 rounded-full bg-[#EA6624]" />
                    )}

                    <div 
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isConfirmed 
                          ? 'bg-emerald-50 text-emerald-600' 
                          : 'bg-orange-50 text-[#EA6624]'
                      }`}
                    >
                      {isConfirmed ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <AlertCircle size={18} />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span 
                          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded ${
                            isConfirmed ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-[#EA6624]'
                          }`}
                        >
                          {isConfirmed ? 'Confirmée' : 'Action requise'}
                        </span>
                        <span className="text-[10px] text-gray-400">
                          {formatTimestamp(item.timestamp)}
                        </span>
                      </div>

                      <p className="text-xs font-bold text-gray-900 leading-snug line-clamp-1">
                        {item.title}
                      </p>

                      <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                        {item.message}
                      </p>
                    </div>

                    <ChevronRight size={14} className="text-gray-300 self-center shrink-0" />
                  </div>
                );
              })
            )}
          </div>

          {/* Quick interactive test buttons for the user to try toasts immediately */}
          <div className="px-5 pt-3 pb-2 border-t border-gray-100 bg-gray-50/60 rounded-b-3xl">
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold mb-2">
              <span className="flex items-center gap-1 text-gray-600">
                <Sparkles size={12} className="text-[#EA6624]" />
                Tester la notification temps réel
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => simulateNotification('confirmed')}
                className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-bold py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95"
              >
                <CheckCircle2 size={12} className="text-emerald-600" />
                Toast Confirmé
              </button>
              <button
                type="button"
                onClick={() => simulateNotification('action-needed')}
                className="bg-orange-50 hover:bg-orange-100 border border-orange-200 text-[#EA6624] text-[10px] font-bold py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1 active:scale-95"
              >
                <AlertCircle size={12} className="text-[#EA6624]" />
                Toast Action requise
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
