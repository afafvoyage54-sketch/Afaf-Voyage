import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { query, collection, where, onSnapshot } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, ChevronRight, X, Sparkles, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { BookingRequest, BookingStatus, InAppNotification } from '../types';
import { playNotificationSound } from '../utils/notificationSound';

interface NotificationContextType {
  notifications: InAppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  simulateNotification: (type: 'confirmed' | 'action-needed') => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ 
  user, 
  children 
}: { 
  user: FirebaseUser | null; 
  children: React.ReactNode; 
}) => {
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const navigate = useNavigate();

  // Track previous statuses to detect legitimate transitions from 'pending'
  const prevStatusesRef = useRef<Record<string, BookingStatus>>({});
  const initialLoadDoneRef = useRef<boolean>(false);

  // Load saved notifications for this user from localStorage
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      prevStatusesRef.current = {};
      initialLoadDoneRef.current = false;
      return;
    }

    try {
      const stored = localStorage.getItem(`afaf_notifications_${user.uid}`);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Error loading stored notifications', e);
    }
  }, [user]);

  // Persist notifications
  const saveNotifications = (newList: InAppNotification[]) => {
    setNotifications(newList);
    if (user) {
      try {
        localStorage.setItem(`afaf_notifications_${user.uid}`, JSON.stringify(newList));
      } catch (e) {
        console.error('Error saving notifications', e);
      }
    }
  };

  // Helper function to display custom interactive toast
  const showStatusToast = (
    type: 'confirmed' | 'action-needed',
    title: string,
    destination: string,
    serviceType: string,
    bookingId?: string
  ) => {
    playNotificationSound(type);

    toast.custom((t) => {
      const isConfirmed = type === 'confirmed';

      return (
        <div 
          className={`w-full max-w-md bg-white rounded-2xl p-4 shadow-2xl border-2 transition-all transform animate-in slide-in-from-top-4 duration-300 ${
            isConfirmed 
              ? 'border-emerald-500/80 shadow-emerald-500/10' 
              : 'border-[#EA6624] shadow-[#EA6624]/10'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div 
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-inner ${
                isConfirmed 
                  ? 'bg-emerald-50 text-emerald-600 ring-2 ring-emerald-500/20' 
                  : 'bg-orange-50 text-[#EA6624] ring-2 ring-[#EA6624]/20'
              }`}
            >
              {isConfirmed ? (
                <CheckCircle2 className="w-6 h-6 animate-bounce" />
              ) : (
                <AlertCircle className="w-6 h-6 animate-pulse" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <div className="flex items-center gap-2 mb-0.5">
                <span 
                  className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isConfirmed 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-orange-100 text-[#EA6624]'
                  }`}
                >
                  {isConfirmed ? 'Réservation Confirmée' : 'Action Requise'}
                </span>
                <span className="text-[11px] text-gray-400">À l'instant</span>
              </div>

              <h4 className="text-sm font-bold text-gray-900 leading-tight">
                {title}
              </h4>
              
              <p className="text-xs text-gray-600 mt-1 leading-snug line-clamp-2">
                {isConfirmed 
                  ? `Excellente nouvelle ! Votre demande pour "${destination || serviceType}" a été validée par Afaf Voyages.`
                  : `Des pièces complémentaires ou une validation sont requises pour votre dossier "${destination || serviceType}".`
                }
              </p>

              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={() => {
                    toast.dismiss(t);
                    navigate('/track');
                  }}
                  className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl text-white transition-all shadow-md active:scale-95 ${
                    isConfirmed 
                      ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20' 
                      : 'bg-[#EA6624] hover:bg-[#d55517] shadow-[#EA6624]/25'
                  }`}
                >
                  <span>Voir ma demande</span>
                  <ChevronRight size={14} />
                </button>

                <button
                  onClick={() => toast.dismiss(t)}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-2.5 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>

            <button
              onClick={() => toast.dismiss(t)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
              title="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      );
    }, {
      duration: 9000,
      position: 'top-right'
    });
  };

  // Real-time Firestore listener for logged-in user bookings
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'bookings'),
      where('uid', '==', user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      // First snapshot execution: populate baseline status map without firing toasts
      if (!initialLoadDoneRef.current) {
        snapshot.docs.forEach((d) => {
          const data = d.data() as BookingRequest;
          prevStatusesRef.current[d.id] = data.status;
        });
        initialLoadDoneRef.current = true;
        return;
      }

      // Subsequent snapshots: inspect document changes for status transitions
      snapshot.docChanges().forEach((change) => {
        const booking = { id: change.doc.id, ...change.doc.data() } as BookingRequest;
        const prevStatus = prevStatusesRef.current[booking.id];
        const currentStatus = booking.status;

        // Specific condition required: transition FROM 'pending' TO 'confirmed' OR 'action-needed'
        if (prevStatus === 'pending' && (currentStatus === 'confirmed' || currentStatus === 'action-needed')) {
          const isConfirmed = currentStatus === 'confirmed';
          const notificationTitle = isConfirmed 
            ? `Votre réservation pour ${booking.destination || booking.serviceType} est confirmée !`
            : `Action requise pour votre dossier ${booking.destination || booking.serviceType}`;

          const notificationMsg = isConfirmed
            ? `Votre dossier (${booking.serviceType.toUpperCase()}) a été validé par notre équipe.`
            : `Veuillez vérifier les informations et documents demandés par l'agence.`;

          // Trigger real-time interactive toast notification
          showStatusToast(
            currentStatus,
            notificationTitle,
            booking.destination,
            booking.serviceType,
            booking.id
          );

          // Append to user notification center history
          const newNotification: InAppNotification = {
            id: `${booking.id}_${Date.now()}`,
            bookingId: booking.id,
            type: currentStatus,
            title: notificationTitle,
            message: notificationMsg,
            serviceType: booking.serviceType,
            destination: booking.destination,
            timestamp: Date.now(),
            read: false
          };

          setNotifications((prev) => {
            const updated = [newNotification, ...prev];
            try {
              localStorage.setItem(`afaf_notifications_${user.uid}`, JSON.stringify(updated));
            } catch (err) {
              console.error(err);
            }
            return updated;
          });
        }

        // Keep current status tracked
        prevStatusesRef.current[booking.id] = currentStatus;
      });
    }, (error) => {
      console.error('Error listening to booking status transitions:', error);
    });

    return () => unsubscribe();
  }, [user, navigate]);

  const markAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, read: true } : n);
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearNotifications = () => {
    saveNotifications([]);
  };

  // Demo / Simulation function allowing instant test of the exact real-time toast
  const simulateNotification = (type: 'confirmed' | 'action-needed') => {
    const isConfirmed = type === 'confirmed';
    const destination = isConfirmed ? 'Istanbul, Turquie' : 'Dubaï, EAU';
    const serviceType = isConfirmed ? 'air' : 'visa';
    const notifTitle = isConfirmed
      ? 'Votre réservation pour Istanbul est confirmée !'
      : 'Action requise sur votre demande de Visa pour Dubaï';
    const notifMsg = isConfirmed
      ? 'Félicitations, vos billets d\'avion ont été émis et validés par l\'agence.'
      : 'Veuillez téléverser une copie lisible de votre passeport valide.';

    showStatusToast(type, notifTitle, destination, serviceType);

    if (user) {
      const mockNotif: InAppNotification = {
        id: `sim_${Date.now()}`,
        bookingId: 'demo-booking',
        type,
        title: notifTitle,
        message: notifMsg,
        serviceType,
        destination,
        timestamp: Date.now(),
        read: false
      };
      setNotifications(prev => {
        const updated = [mockNotif, ...prev];
        try {
          localStorage.setItem(`afaf_notifications_${user.uid}`, JSON.stringify(updated));
        } catch (e) {
          console.error(e);
        }
        return updated;
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearNotifications,
      simulateNotification
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
