import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Download, 
  ChevronUp, 
  ChevronDown, 
  ArrowUpDown, 
  MessageCircle, 
  FileText, 
  Loader2, 
  Plane, 
  Calendar, 
  Clock, 
  Phone, 
  MessageSquare,
  Building2,
  Video,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileSpreadsheet,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Check
} from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  setDoc,
  getDoc,
  arrayUnion, 
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase';
import { 
  UserProfile, 
  BookingRequest, 
  BookingStatus, 
  Appointment, 
  ContactMessage, 
  AppointmentStatus 
} from '../types';
import { toast } from 'sonner';
import { getOrRequestAccessToken } from '../services/googleAuth';
import { 
  findExistingSpreadsheet, 
  createAfafSpreadsheet, 
  syncBookingsToSheet, 
  syncAppointmentsToSheet, 
  syncMessagesToSheet,
  AFAF_SHEET_TITLE
} from '../services/googleSheets';

interface AdminDashboardProps {
  profile: UserProfile | null;
}

export default function AdminDashboard({ profile }: AdminDashboardProps) {
  const [adminTab, setAdminTab] = useState<'bookings' | 'appointments' | 'messages' | 'sheets'>('bookings');
  
  // Bookings state
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'name' | 'createdAt' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');

  // Appointments state
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [appointmentFilter, setAppointmentFilter] = useState<string>('all');
  const [appointmentSearch, setAppointmentSearch] = useState<string>('');

  // Contact messages state
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messageFilter, setMessageFilter] = useState<string>('all');

  // Google Sheets state
  const [sheetsConfig, setSheetsConfig] = useState<{
    spreadsheetId?: string;
    spreadsheetUrl?: string;
    autoSync?: boolean;
    lastSyncAt?: any;
    syncedCounts?: { bookings: number; appointments: number; messages: number };
  } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [syncScope, setSyncScope] = useState<'all' | 'bookings' | 'appointments' | 'messages'>('all');

  const navigate = useNavigate();

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/');
      return;
    }

    // Bookings listener
    const qBookings = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubBookings = onSnapshot(qBookings, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookingRequest));
      setBookings(data);
      setLoading(false);
    });

    // Appointments listener
    const qAppointments = query(collection(db, 'appointments'), orderBy('createdAt', 'desc'));
    const unsubAppointments = onSnapshot(qAppointments, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Appointment));
      setAppointments(data);
    }, (err) => console.error("Appointments error:", err));

    // Messages listener
    const qMessages = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContactMessage));
      setMessages(data);
    }, (err) => console.error("Messages error:", err));

    // Google Sheets settings listener
    const unsubSettings = onSnapshot(doc(db, 'settings', 'google_sheets'), (docSnap) => {
      if (docSnap.exists()) {
        setSheetsConfig(docSnap.data() as any);
      }
    }, (err) => console.warn("Google Sheets settings error:", err));

    return () => {
      unsubBookings();
      unsubAppointments();
      unsubMessages();
      unsubSettings();
    };
  }, [profile, navigate]);

  const filteredAndSortedBookings = useMemo(() => {
    let result = [...bookings];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b => 
        `${b.firstName} ${b.lastName}`.toLowerCase().includes(term) ||
        b.email.toLowerCase().includes(term) ||
        b.destination.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    if (serviceFilter !== 'all') {
      result = result.filter(b => b.serviceType === serviceFilter);
    }

    return result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') {
        const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
        const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
        comparison = nameA.localeCompare(nameB);
      } else if (sortField === 'createdAt') {
        const dateA = a.createdAt?.toMillis?.() || 0;
        const dateB = b.createdAt?.toMillis?.() || 0;
        comparison = dateA - dateB;
      } else if (sortField === 'updatedAt') {
        const dateA = a.updatedAt?.toMillis?.() || 0;
        const dateB = b.updatedAt?.toMillis?.() || 0;
        comparison = dateA - dateB;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [bookings, sortField, sortOrder, searchTerm, statusFilter, serviceFilter]);

  const filteredAppointments = useMemo(() => {
    let list = [...appointments];
    if (appointmentFilter !== 'all') {
      list = list.filter(a => a.status === appointmentFilter);
    }
    if (appointmentSearch) {
      const term = appointmentSearch.toLowerCase();
      list = list.filter(a => 
        a.fullName.toLowerCase().includes(term) ||
        a.phone.includes(term) ||
        a.serviceInterest.toLowerCase().includes(term)
      );
    }
    return list;
  }, [appointments, appointmentFilter, appointmentSearch]);

  const filteredMessages = useMemo(() => {
    let list = [...messages];
    if (messageFilter !== 'all') {
      list = list.filter(m => m.status === messageFilter);
    }
    return list;
  }, [messages, messageFilter]);

  const toggleSort = (field: 'name' | 'createdAt' | 'updatedAt') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const updateStatus = async (id: string, status: BookingStatus) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { 
        status,
        updatedAt: Timestamp.now()
      });
      toast.success('Statut mis à jour');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
    try {
      await updateDoc(doc(db, 'appointments', id), {
        status,
        updatedAt: Timestamp.now()
      });
      toast.success('Statut du rendez-vous mis à jour');
    } catch (err) {
      toast.error('Erreur mise à jour rendez-vous');
    }
  };

  const updateMessageStatus = async (id: string, status: 'new' | 'read' | 'replied') => {
    try {
      await updateDoc(doc(db, 'contact_messages', id), { status });
      toast.success('Statut du message mis à jour');
    } catch (err) {
      toast.error('Erreur mise à jour message');
    }
  };

  const addNote = async (id: string) => {
    const note = prompt('Entrez une note pour le client :');
    if (note === null || note.trim() === '') return;
    
    try {
      await updateDoc(doc(db, 'bookings', id), { 
        adminNotes: arrayUnion({
          text: note,
          createdAt: Timestamp.now(),
          author: profile?.email || 'Admin'
        }),
        updatedAt: Timestamp.now()
      });
      toast.success('Note ajoutée');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout de la note');
    }
  };

  const exportToCSV = () => {
    if (filteredAndSortedBookings.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    const headers = ['ID', 'Date de création', 'Client', 'Email', 'Service', 'Destination', 'Date Aller', 'Date Retour', 'Statut'];
    const escapeCSV = (str: string) => `"${str.replace(/"/g, '""')}"`;

    const csvRows = filteredAndSortedBookings.map(b => {
      const date = b.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '';
      const client = `${b.firstName} ${b.lastName}`;
      return [
        b.id,
        date,
        escapeCSV(client),
        escapeCSV(b.email),
        b.serviceType,
        escapeCSV(b.destination),
        escapeCSV(b.departureDate || ''),
        escapeCSV(b.returnDate || ''),
        b.status
      ].join(',');
    });

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `reservations_afaf_voyages_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const promptSync = (scope: 'all' | 'bookings' | 'appointments' | 'messages') => {
    setSyncScope(scope);
    setSyncModalOpen(true);
  };

  const executeSync = async () => {
    setIsSyncing(true);
    try {
      toast.loading("Connexion et autorisation Google Sheets...", { id: 'sheets-sync' });
      const accessToken = await getOrRequestAccessToken();

      // Find or create spreadsheet
      let targetId = sheetsConfig?.spreadsheetId;
      let targetUrl = sheetsConfig?.spreadsheetUrl;

      if (!targetId) {
        toast.loading("Recherche ou initialisation de la feuille Afaf Voyages...", { id: 'sheets-sync' });
        const existing = await findExistingSpreadsheet(accessToken);
        if (existing) {
          targetId = existing.id;
          targetUrl = existing.url;
        } else {
          const created = await createAfafSpreadsheet(accessToken);
          targetId = created.id;
          targetUrl = created.url;
        }
      }

      toast.loading("Mise à jour des données dans Google Sheets...", { id: 'sheets-sync' });

      let bCount = sheetsConfig?.syncedCounts?.bookings || 0;
      let aCount = sheetsConfig?.syncedCounts?.appointments || 0;
      let mCount = sheetsConfig?.syncedCounts?.messages || 0;

      if (syncScope === 'all' || syncScope === 'bookings') {
        bCount = await syncBookingsToSheet(accessToken, targetId, bookings);
      }
      if (syncScope === 'all' || syncScope === 'appointments') {
        aCount = await syncAppointmentsToSheet(accessToken, targetId, appointments);
      }
      if (syncScope === 'all' || syncScope === 'messages') {
        mCount = await syncMessagesToSheet(accessToken, targetId, messages);
      }

      const updatedConfig = {
        spreadsheetId: targetId,
        spreadsheetUrl: targetUrl,
        spreadsheetTitle: AFAF_SHEET_TITLE,
        autoSync: sheetsConfig?.autoSync ?? true,
        lastSyncAt: Timestamp.now(),
        syncedCounts: {
          bookings: bCount,
          appointments: aCount,
          messages: mCount,
        },
      };

      await setDoc(doc(db, 'settings', 'google_sheets'), updatedConfig, { merge: true });
      setSheetsConfig(updatedConfig);

      toast.success(
        `Synchronisation réussie ! (${bCount} réservations, ${aCount} RDV, ${mCount} messages)`,
        { 
          id: 'sheets-sync',
          duration: 6000,
          action: targetUrl ? {
            label: 'Ouvrir',
            onClick: () => window.open(targetUrl, '_blank')
          } : undefined
        }
      );
      setSyncModalOpen(false);
    } catch (error: any) {
      console.error("Google Sheets sync error:", error);
      toast.error(`Erreur Google Sheets: ${error.message || 'Échec de synchronisation'}`, { id: 'sheets-sync', duration: 7000 });
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleAutoSync = async () => {
    try {
      const nextVal = !(sheetsConfig?.autoSync ?? true);
      await setDoc(doc(db, 'settings', 'google_sheets'), { autoSync: nextVal }, { merge: true });
      toast.success(nextVal ? "Synchronisation automatique activée" : "Synchronisation automatique désactivée");
    } catch (err) {
      toast.error("Erreur lors de la modification des paramètres");
    }
  };

  if (!profile || profile.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-100 pb-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">
            <span>Administration Afaf Voyages</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">Tableau de Bord</h1>
          <p className="text-gray-500 text-sm">Gestion centralisée des réservations, rendez-vous en agence et messages clients.</p>
        </div>
        
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => promptSync('all')}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer"
          >
            <FileSpreadsheet size={16} />
            <span>Synchroniser Google Sheets</span>
            {sheetsConfig?.spreadsheetId && <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>}
          </button>

          {sheetsConfig?.spreadsheetUrl && (
            <a
              href={sheetsConfig.spreadsheetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all"
              title="Ouvrir dans Google Sheets"
            >
              <ExternalLink size={14} className="text-emerald-600" />
              <span>Ouvrir la feuille</span>
            </a>
          )}

          {adminTab === 'bookings' && (
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
            >
              <Download size={16} />
              Exporter CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setAdminTab('bookings')}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
            adminTab === 'bookings'
              ? 'bg-[#305AA2] text-white shadow-lg shadow-primary/20 scale-102'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
          }`}
        >
          <Plane size={18} />
          <span>Demandes de Voyage</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
            adminTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {bookings.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('appointments')}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
            adminTab === 'appointments'
              ? 'bg-[#305AA2] text-white shadow-lg shadow-primary/20 scale-102'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
          }`}
        >
          <Calendar size={18} />
          <span>Prises de Rendez-vous</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
            adminTab === 'appointments' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {appointments.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('messages')}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
            adminTab === 'messages'
              ? 'bg-[#305AA2] text-white shadow-lg shadow-primary/20 scale-102'
              : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200'
          }`}
        >
          <MessageCircle size={18} />
          <span>Rappels & Messages</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
            adminTab === 'messages' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-700'
          }`}>
            {messages.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('sheets')}
          className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all cursor-pointer ${
            adminTab === 'sheets'
              ? 'bg-emerald-700 text-white shadow-lg shadow-emerald-700/20 scale-102'
              : 'bg-white hover:bg-emerald-50/50 text-gray-700 border border-gray-200'
          }`}
        >
          <FileSpreadsheet size={18} className={adminTab === 'sheets' ? 'text-white' : 'text-emerald-600'} />
          <span>Google Sheets</span>
          {sheetsConfig?.spreadsheetId ? (
            <span className={`px-2 py-0.5 rounded-full text-xs font-black ${
              adminTab === 'sheets' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Connecté
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-xs font-black bg-gray-100 text-gray-600">
              Activer
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: BOOKINGS */}
      {adminTab === 'bookings' && (
        <div className="space-y-6">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Rechercher un client..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in-progress">En cours</option>
              <option value="confirmed">Confirmé</option>
              <option value="action-needed">Action requise</option>
            </select>
            <select 
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm appearance-none"
            >
              <option value="all">Tous les services</option>
              <option value="visa">Visa</option>
              <option value="air">Vol</option>
              <option value="sea">Maritime</option>
              <option value="hotel">Hôtel</option>
              <option value="organized-trip">Voyage Organisé</option>
              <option value="omra">Omra</option>
            </select>
            <button 
              onClick={() => { setSearchTerm(''); setStatusFilter('all'); setServiceFilter('all'); }}
              className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              Réinitialiser
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-primary" size={48} />
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        Client
                        {sortField === 'name' ? (
                          sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : <ArrowUpDown size={14} className="opacity-30" />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Destination</th>
                    <th 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleSort('createdAt')}
                    >
                      <div className="flex items-center gap-2">
                        Soumis le
                        {sortField === 'createdAt' ? (
                          sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : <ArrowUpDown size={14} className="opacity-30" />}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-primary transition-colors"
                      onClick={() => toggleSort('updatedAt')}
                    >
                      <div className="flex items-center gap-2">
                        Mise à jour
                        {sortField === 'updatedAt' ? (
                          sortOrder === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        ) : <ArrowUpDown size={14} className="opacity-30" />}
                      </div>
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Passeport</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAndSortedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{b.lastName} {b.firstName}</div>
                        <div className="text-[10px] text-gray-400">{b.email}</div>
                        <div className="text-[10px] text-gray-400">Né le {b.dob}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-gray-600 capitalize">{b.serviceType}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">{b.destination}</div>
                        {(b.departureDate || b.returnDate) && (
                          <div className="text-[10px] text-gray-400 mt-1">
                            Aller: {b.departureDate || '-'} <br/>
                            Retour: {b.returnDate || '-'}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {b.createdAt?.toDate().toLocaleDateString('fr-FR')}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {b.createdAt?.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600">
                          {b.updatedAt ? b.updatedAt.toDate().toLocaleDateString('fr-FR') : '-'}
                        </div>
                        <div className="text-[10px] text-gray-400">
                          {b.updatedAt ? b.updatedAt.toDate().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {b.passportScanUrl && b.passportScanUrl !== 'pending_upload' && b.passportScanUrl !== 'error' ? (
                          <a 
                            href={b.passportScanUrl} 
                            download={`Passeport_${b.lastName}_${b.firstName}`}
                            target="_blank" 
                            rel="noreferrer"
                            className="text-primary hover:text-primary/80 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-1 bg-primary/10 px-3 py-1.5 rounded-lg w-fit"
                          >
                            <FileText size={14} /> Télécharger
                          </a>
                        ) : b.passportScanUrl === 'pending_upload' ? (
                          <span className="text-orange-500 text-xs italic flex items-center gap-1 text-[10px] uppercase font-black tracking-widest">
                            <Loader2 size={12} className="animate-spin" /> En cours...
                          </span>
                        ) : b.passportScanUrl === 'error' ? (
                          <span className="text-red-500 text-xs italic text-[10px] uppercase font-black tracking-widest">Erreur d'envoi</span>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Aucun</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={b.status}
                          onChange={(e) => updateStatus(b.id, e.target.value as BookingStatus)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border-none outline-none cursor-pointer transition-colors ${
                            b.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            b.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                            b.status === 'action-needed' ? 'bg-orange-100 text-orange-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          <option value="pending">En attente</option>
                          <option value="in-progress">En cours</option>
                          <option value="confirmed">Confirmé</option>
                          <option value="action-needed">Action requise</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => addNote(b.id)}
                            className="p-2 text-gray-400 hover:text-primary transition-colors relative cursor-pointer"
                            title="Ajouter une note"
                          >
                            <MessageCircle size={18} />
                            {b.adminNotes && b.adminNotes.length > 0 && (
                              <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                                {b.adminNotes.length}
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: APPOINTMENTS */}
      {adminTab === 'appointments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Rechercher par nom, téléphone, service..."
                value={appointmentSearch}
                onChange={(e) => setAppointmentSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
              />
            </div>
            <select 
              value={appointmentFilter}
              onChange={(e) => setAppointmentFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm appearance-none"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="confirmed">Confirmé</option>
              <option value="completed">Effectué</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden overflow-x-auto">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                Aucun rendez-vous trouvé.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client & Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type & Motif</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date & Heure</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Notes / Wilaya</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Contacter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredAppointments.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{app.fullName}</div>
                        <div className="text-xs font-mono font-bold text-primary mt-0.5">{app.phone}</div>
                        {app.email && <div className="text-[10px] text-gray-400">{app.email}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 ${
                          app.type === 'agency' ? 'bg-blue-100 text-blue-800' :
                          app.type === 'phone' ? 'bg-purple-100 text-purple-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {app.type === 'agency' ? 'En Agence' : app.type === 'phone' ? 'Téléphone' : 'Visioconférence'}
                        </span>
                        <div className="text-xs font-semibold text-gray-800 capitalize">
                          {app.serviceInterest}
                        </div>
                        <div className="text-[10px] text-gray-400">{app.numberOfPeople || 1} personne(s)</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                          <Calendar size={14} className="text-accent" />
                          {app.date}
                        </div>
                        <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                          <Clock size={14} className="text-accent" />
                          {app.timeSlot}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <p className="text-xs text-gray-600 line-clamp-2">{app.notes || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={app.status}
                          onChange={(e) => updateAppointmentStatus(app.id, e.target.value as AppointmentStatus)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border-none outline-none cursor-pointer ${
                            app.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            app.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                            app.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          <option value="pending">En attente</option>
                          <option value="confirmed">Confirmé</option>
                          <option value="completed">Effectué</option>
                          <option value="cancelled">Annulé</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`https://wa.me/${app.phone.replace(/[^0-9]/g, '')}?text=Bonjour%20${encodeURIComponent(app.fullName)},%20l'agence%20Afaf%20Voyages%20vous%20contacte%20concernant%20votre%20rendez-vous%20du%20${app.date}%20à%20${app.timeSlot}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors cursor-pointer"
                            title="Contacter sur WhatsApp"
                          >
                            <MessageSquare size={18} />
                          </a>
                          <a
                            href={`tel:${app.phone}`}
                            className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                            title="Appeler le client"
                          >
                            <Phone size={18} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CONTACT MESSAGES */}
      {adminTab === 'messages' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <select 
              value={messageFilter}
              onChange={(e) => setMessageFilter(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold"
            >
              <option value="all">Tous les messages</option>
              <option value="new">Nouveaux</option>
              <option value="read">Lus</option>
              <option value="replied">Traités</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden overflow-x-auto">
            {filteredMessages.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">
                Aucun message ou rappel trouvé.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client & Contact</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Objet</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Message</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredMessages.map((m) => (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleDateString('fr-FR') : '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-bold text-gray-900">{m.fullName}</div>
                        <div className="text-xs font-mono font-bold text-primary">{m.phone}</div>
                        {m.email && <div className="text-[10px] text-gray-400">{m.email}</div>}
                      </td>
                      <td className="px-6 py-4">
                        {m.urgent && (
                          <span className="inline-block px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-black uppercase mb-1">
                            Urgent
                          </span>
                        )}
                        <p className="text-xs font-bold text-gray-800">{m.subject}</p>
                      </td>
                      <td className="px-6 py-4 max-w-sm">
                        <p className="text-xs text-gray-600 line-clamp-3">{m.message}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select
                          value={m.status}
                          onChange={(e) => updateMessageStatus(m.id, e.target.value as any)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border-none outline-none cursor-pointer ${
                            m.status === 'replied' ? 'bg-green-100 text-green-800' :
                            m.status === 'read' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          <option value="new">Nouveau</option>
                          <option value="read">Lu</option>
                          <option value="replied">Traité</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <a
                            href={`https://wa.me/${m.phone.replace(/[^0-9]/g, '')}?text=Bonjour%20${encodeURIComponent(m.fullName)},%20l'agence%20Afaf%20Voyages%20vous%20contacte%20suite%20à%20votre%20message`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors cursor-pointer"
                            title="Répondre sur WhatsApp"
                          >
                            <MessageSquare size={18} />
                          </a>
                          <a
                            href={`tel:${m.phone}`}
                            className="p-2 text-primary hover:bg-primary/10 rounded-xl transition-colors cursor-pointer"
                            title="Appeler"
                          >
                            <Phone size={18} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: GOOGLE SHEETS */}
      {adminTab === 'sheets' && (
        <div className="space-y-8">
          {/* Main Status & Integration Banner */}
          <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-3xl p-8 sm:p-10 text-white relative overflow-hidden shadow-2xl border border-emerald-700/50">
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-3 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-emerald-300 text-xs font-black uppercase tracking-wider">
                  <FileSpreadsheet size={14} />
                  <span>Google Sheets API V4</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                  Stockage des Données Clients dans Google Sheets
                </h2>
                <p className="text-emerald-100/90 text-sm leading-relaxed">
                  Toutes les demandes de voyages, réservations de vols, hôtels, visas, rendez-vous en agence et messages clients sont centralisés dans votre classeur Google Sheets dédié.
                </p>
                {sheetsConfig?.lastSyncAt && (
                  <p className="text-xs text-emerald-300 font-medium flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    Dernière synchronisation : {sheetsConfig.lastSyncAt.toDate ? sheetsConfig.lastSyncAt.toDate().toLocaleString('fr-FR') : 'Récemment'}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                <button
                  onClick={() => promptSync('all')}
                  disabled={isSyncing}
                  className="flex items-center justify-center gap-2 bg-white text-emerald-900 hover:bg-emerald-50 px-6 py-4 rounded-2xl font-black text-sm transition-all shadow-lg hover:shadow-xl cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw size={18} className={isSyncing ? 'animate-spin' : ''} />
                  <span>Tout synchroniser</span>
                </button>

                {sheetsConfig?.spreadsheetUrl && (
                  <a
                    href={sheetsConfig.spreadsheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-600 border border-emerald-500/30 text-white px-6 py-4 rounded-2xl font-black text-sm transition-all shadow-md cursor-pointer"
                  >
                    <ExternalLink size={18} />
                    <span>Ouvrir Google Sheets</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Sync Cards per Entity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Bookings */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Plane size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Réservations Clients</h3>
                  <p className="text-xs text-gray-500 mt-1">Feuille : <code>Réservations Clients</code></p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Demandes actuelles :</span>
                    <span className="font-black text-gray-900">{bookings.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Dernier export :</span>
                    <span className="font-bold text-emerald-600">{sheetsConfig?.syncedCounts?.bookings ?? 0} lignes</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">
                  Colonnes : Nom, Prénom, Email, Téléphone, Naissance, Service, Destination, Dates Aller/Retour, Statut, Scan Passeport, Notes.
                </p>
              </div>

              <button
                onClick={() => promptSync('bookings')}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet size={16} className="text-primary" />
                <span>Synchroniser Réservations</span>
              </button>
            </div>

            {/* Card 2: Appointments */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Rendez-vous Clients</h3>
                  <p className="text-xs text-gray-500 mt-1">Feuille : <code>Rendez-vous Clients</code></p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">RDV enregistrés :</span>
                    <span className="font-black text-gray-900">{appointments.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Dernier export :</span>
                    <span className="font-bold text-emerald-600">{sheetsConfig?.syncedCounts?.appointments ?? 0} lignes</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">
                  Colonnes : ID RDV, Date du RDV, Créneau horaire, Nom complet, Téléphone, Email, Mode (Agence/Vidéo), Intérêt, Statut.
                </p>
              </div>

              <button
                onClick={() => promptSync('appointments')}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet size={16} className="text-amber-600" />
                <span>Synchroniser Rendez-vous</span>
              </button>
            </div>

            {/* Card 3: Contact Messages */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EA6624]/10 text-[#EA6624] flex items-center justify-center">
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">Messages & Rappels</h3>
                  <p className="text-xs text-gray-500 mt-1">Feuille : <code>Messages Contacts</code></p>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Messages reçus :</span>
                    <span className="font-black text-gray-900">{messages.length}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Dernier export :</span>
                    <span className="font-bold text-emerald-600">{sheetsConfig?.syncedCounts?.messages ?? 0} lignes</span>
                  </div>
                </div>
                <p className="text-[11px] text-gray-400">
                  Colonnes : ID Message, Date réception, Nom client, Email, Téléphone, Sujet de demande, Message complet, Statut.
                </p>
              </div>

              <button
                onClick={() => promptSync('messages')}
                disabled={isSyncing}
                className="w-full flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
              >
                <FileSpreadsheet size={16} className="text-[#EA6624]" />
                <span>Synchroniser Messages</span>
              </button>
            </div>
          </div>

          {/* Options & Auto-Sync Card */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
              <Sparkles size={20} className="text-amber-500" />
              <span>Options de Synchronisation Automatique</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gray-50 border border-gray-100">
              <div className="space-y-1">
                <p className="text-sm font-bold text-gray-900">Enregistrement automatique en direct</p>
                <p className="text-xs text-gray-500">
                  Transférer automatiquement chaque nouveau client ou nouvelle réservation dans votre feuille Google Sheets dès sa validation.
                </p>
              </div>
              
              <button
                onClick={toggleAutoSync}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  sheetsConfig?.autoSync ?? true
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                <Check size={16} />
                <span>{(sheetsConfig?.autoSync ?? true) ? 'Activé' : 'Désactivé'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-1">
              <p className="font-bold">Astuce d'organisation :</p>
              <p>
                Le classeur Google Sheets est partagé automatiquement avec votre compte Google Workspace. Vous pouvez inviter vos collaborateurs, créer des filtres avancés, générer des graphiques et imprimer des rapports de ventes directement depuis Google Sheets.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MUTATING OPERATION CONFIRMATION MODAL (MANDATORY WORKSPACE INTEGRATION SKILL COMPLIANCE) */}
      {syncModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 shadow-2xl border border-gray-100 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileSpreadsheet size={32} />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">
                Confirmer la synchronisation Google Sheets
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Cette opération va exporter et actualiser les données clients vers la feuille de calcul officielle :
              </p>
              <p className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                {AFAF_SHEET_TITLE}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100 text-xs">
              <p className="font-bold text-gray-700">Détail des données à exporter :</p>
              <ul className="space-y-1.5 text-gray-600">
                {(syncScope === 'all' || syncScope === 'bookings') && (
                  <li className="flex items-center justify-between">
                    <span>• Onglet "Réservations Clients" :</span>
                    <span className="font-bold text-gray-900">{bookings.length} demande(s)</span>
                  </li>
                )}
                {(syncScope === 'all' || syncScope === 'appointments') && (
                  <li className="flex items-center justify-between">
                    <span>• Onglet "Rendez-vous Clients" :</span>
                    <span className="font-bold text-gray-900">{appointments.length} rendez-vous</span>
                  </li>
                )}
                {(syncScope === 'all' || syncScope === 'messages') && (
                  <li className="flex items-center justify-between">
                    <span>• Onglet "Messages Contacts" :</span>
                    <span className="font-bold text-gray-900">{messages.length} message(s)</span>
                  </li>
                )}
              </ul>
              <p className="text-[11px] text-gray-400 pt-1">
                Les colonnes existantes seront actualisées avec les dernières modifications et statuts de dossier.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSyncModalOpen(false)}
                disabled={isSyncing}
                className="px-5 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-all cursor-pointer disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={executeSync}
                disabled={isSyncing}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
              >
                {isSyncing ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Synchronisation en cours...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    <span>Confirmer et synchroniser</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
