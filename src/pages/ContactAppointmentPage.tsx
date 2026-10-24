import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  MessageSquare, 
  Video, 
  Building2, 
  PhoneCall, 
  ShieldCheck, 
  AlertTriangle, 
  Send, 
  ChevronRight, 
  HelpCircle, 
  Users, 
  ExternalLink,
  Share2,
  CalendarCheck,
  Check,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { collection, addDoc, Timestamp, query, where, orderBy, onSnapshot, updateDoc, doc, getDoc } from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import { db } from '../firebase';
import { Appointment, AppointmentType, ContactMessage } from '../types';
import { toast } from 'sonner';
import { getCachedAccessToken } from '../services/googleAuth';
import { appendSingleAppointmentToSheet, appendSingleMessageToSheet } from '../services/googleSheets';

interface ContactAppointmentPageProps {
  user: FirebaseUser | null;
}

const SERVICE_OPTIONS = [
  { id: 'omra', label: 'Omra 2026 (Forfaits, visa & hôtels)', icon: '🕋' },
  { id: 'visa', label: 'Assistance Visa (Dubaï, Turquie, Chine, etc.)', icon: '🛂' },
  { id: 'flight', label: 'Billetterie Aérienne (Vols internationaux & nationaux)', icon: '✈️' },
  { id: 'sea', label: 'Traversées Maritimes (Algérie Ferries, Nouris, Balearia)', icon: '🚢' },
  { id: 'organized-trip', label: 'Voyages Organisés (Malaisie, Azerbaïdjan, Égypte...)', icon: '🌴' },
  { id: 'hotel', label: 'Réservation Hôtels & Séjours sur-mesure', icon: '🏨' },
  { id: 'docs', label: 'Dépôt / Retrait de Passeport et Documents', icon: '📁' },
  { id: 'other', label: 'Autre demande ou conseil voyage', icon: '💬' }
];

const TIME_SLOTS = [
  '09:30', '10:15', '11:00', '11:45',
  '14:00', '14:45', '15:30', '16:15', '17:00'
];

export default function ContactAppointmentPage({ user }: ContactAppointmentPageProps) {
  const [activeTab, setActiveTab] = useState<'appointment' | 'hotlines' | 'agency'>('appointment');
  
  // Appointment Form State
  const [consultationType, setConsultationType] = useState<AppointmentType>('agency');
  const [serviceInterest, setServiceInterest] = useState<string>('omra');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Default to tomorrow, or Saturday if tomorrow is Friday
    const d = new Date();
    d.setDate(d.getDate() + 1);
    if (d.getDay() === 5) d.setDate(d.getDate() + 1); // skip Friday
    return d.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('10:15');
  const [numberOfPeople, setNumberOfPeople] = useState<number>(1);
  const [fullName, setFullName] = useState<string>(user?.displayName || '');
  const [phone, setPhone] = useState<string>('');
  const [email, setEmail] = useState<string>(user?.email || '');
  const [wilaya, setWilaya] = useState<string>('Oran');
  const [notes, setNotes] = useState<string>('');
  const [submittingAppointment, setSubmittingAppointment] = useState<boolean>(false);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // User's own appointments list
  const [userAppointments, setUserAppointments] = useState<Appointment[]>([]);

  // Direct Callback Form State
  const [callbackName, setCallbackName] = useState<string>(user?.displayName || '');
  const [callbackPhone, setCallbackPhone] = useState<string>('');
  const [callbackSubject, setCallbackSubject] = useState<string>('Devis & Réservation de voyage');
  const [callbackMessage, setCallbackMessage] = useState<string>('');
  const [callbackUrgent, setCallbackUrgent] = useState<boolean>(false);
  const [submittingCallback, setSubmittingCallback] = useState<boolean>(false);

  // Check if agency is currently open (Algeria GMT+1: Sat-Thu 09:00 - 18:00)
  const isAgencyOpen = () => {
    const now = new Date();
    // In Algerian time (UTC+1)
    const day = now.getDay(); // 0 is Sunday, 5 is Friday
    const hour = now.getHours();
    if (day === 5) return false; // Friday closed
    return hour >= 9 && hour < 18;
  };

  const agencyOpenNow = isAgencyOpen();

  // Listen to user appointments if logged in
  useEffect(() => {
    if (!user) {
      setUserAppointments([]);
      return;
    }

    const q = query(
      collection(db, 'appointments'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Appointment));
      setUserAppointments(list);
    }, (error) => {
      console.error('Error fetching appointments:', error);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle appointment submission
  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Veuillez saisir votre nom complet');
      return;
    }
    if (!phone.trim()) {
      toast.error('Veuillez saisir votre numéro de téléphone');
      return;
    }
    if (!selectedDate) {
      toast.error('Veuillez sélectionner une date');
      return;
    }
    if (!selectedSlot) {
      toast.error('Veuillez choisir un créneau horaire');
      return;
    }

    setSubmittingAppointment(true);

    try {
      const appointmentData = {
        uid: user?.uid || null,
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim() || '',
        type: consultationType,
        serviceInterest,
        date: selectedDate,
        timeSlot: selectedSlot,
        numberOfPeople: Number(numberOfPeople) || 1,
        notes: notes.trim() ? `${wilaya ? `[Wilaya: ${wilaya}] ` : ''}${notes.trim()}` : (wilaya ? `[Wilaya: ${wilaya}]` : ''),
        status: 'pending' as const,
        createdAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, 'appointments'), appointmentData);

      const created: Appointment = {
        id: docRef.id,
        ...appointmentData
      };

      // Auto-append appointment to Google Sheets if configured & token available
      try {
        const token = getCachedAccessToken();
        if (token) {
          const settingsSnap = await getDoc(doc(db, 'settings', 'google_sheets'));
          if (settingsSnap.exists()) {
            const config = settingsSnap.data();
            if (config.spreadsheetId && (config.autoSync ?? true)) {
              await appendSingleAppointmentToSheet(token, config.spreadsheetId, created);
            }
          }
        }
      } catch (sheetErr) {
        console.warn("Auto-sync appointment to Google Sheets deferred:", sheetErr);
      }

      setConfirmedAppointment(created);
      toast.success('Rendez-vous planifié avec succès ! Nous vous attendons.');
    } catch (error: any) {
      console.error('Erreur réservation rendez-vous:', error);
      toast.error("Erreur lors de l'enregistrement du rendez-vous. Veuillez réessayer ou nous contacter sur WhatsApp.");
    } finally {
      setSubmittingAppointment(false);
    }
  };

  // Handle callback / contact message submission
  const handleSendCallback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!callbackName.trim() || !callbackPhone.trim() || !callbackMessage.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setSubmittingCallback(true);

    try {
      const msgData = {
        fullName: callbackName.trim(),
        phone: callbackPhone.trim(),
        email: user?.email || '',
        subject: callbackSubject,
        message: callbackMessage.trim(),
        urgent: callbackUrgent,
        status: 'new' as const,
        createdAt: Timestamp.now()
      };

      const msgDocRef = await addDoc(collection(db, 'contact_messages'), msgData);

      // Auto-append message to Google Sheets if configured & token available
      try {
        const token = getCachedAccessToken();
        if (token) {
          const settingsSnap = await getDoc(doc(db, 'settings', 'google_sheets'));
          if (settingsSnap.exists()) {
            const config = settingsSnap.data();
            if (config.spreadsheetId && (config.autoSync ?? true)) {
              await appendSingleMessageToSheet(token, config.spreadsheetId, {
                id: msgDocRef.id,
                ...msgData
              } as any);
            }
          }
        }
      } catch (sheetErr) {
        console.warn("Auto-sync message to Google Sheets deferred:", sheetErr);
      }

      toast.success('Votre message a bien été envoyé ! Un conseiller Afaf Voyages vous contactera très rapidement.');
      setCallbackMessage('');
    } catch (error) {
      console.error('Erreur envoi message:', error);
      toast.error("Impossible d'envoyer votre message. Vous pouvez nous contacter directement sur WhatsApp.");
    } finally {
      setSubmittingCallback(false);
    }
  };

  // Cancel an appointment
  const handleCancelAppointment = async (appId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir annuler ce rendez-vous ?')) return;
    try {
      await updateDoc(doc(db, 'appointments', appId), {
        status: 'cancelled',
        updatedAt: Timestamp.now()
      });
      toast.success('Rendez-vous annulé');
    } catch (err) {
      toast.error("Erreur lors de l'annulation");
    }
  };

  // Quick dates helper (today, tomorrow, next week)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const max = new Date();
    max.setMonth(max.getMonth() + 2);
    return max.toISOString().split('T')[0];
  };

  // WhatsApp quick link for appointment
  const getWhatsAppAppointmentLink = (app: Appointment) => {
    const typeLabel = app.type === 'agency' ? 'En Agence (Ain El Turk)' : (app.type === 'phone' ? 'Par Téléphone' : 'En Visioconférence');
    const msg = `Bonjour Afaf Voyages,%0A%0AJe confirme ma demande de rendez-vous :%0A- Réf: RDV-${app.id.slice(0, 6).toUpperCase()}%0A- Nom: ${encodeURIComponent(app.fullName)}%0A- Date: ${app.date}%0A- Heure: ${app.timeSlot}%0A- Type: ${encodeURIComponent(typeLabel)}%0A- Motif: ${encodeURIComponent(app.serviceInterest)}%0A- Tél: ${encodeURIComponent(app.phone)}%0A%0AMerci !`;
    return `https://wa.me/213781949667?text=${msg}`;
  };

  // Google Calendar link generator
  const getGoogleCalendarUrl = (app: Appointment) => {
    const startTimeStr = `${app.date}T${app.timeSlot.replace(':', '')}00`;
    // Add 45 minutes
    const [h, m] = app.timeSlot.split(':').map(Number);
    const endHour = h + Math.floor((m + 45) / 60);
    const endMin = (m + 45) % 60;
    const endTimeStr = `${app.date}T${String(endHour).padStart(2, '0')}${String(endMin).padStart(2, '0')}00`;
    
    const title = encodeURIComponent(`RDV Afaf Voyages - ${app.serviceInterest}`);
    const details = encodeURIComponent(`Rendez-vous avec l'agence Afaf Voyages.\nType: ${app.type}\nClient: ${app.fullName}\nContact: +213 781 94 96 67 / +213 551 37 27 22`);
    const location = encodeURIComponent('Trouville (en face Commissariat), Ain El Turk, Oran, Algérie');
    
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startTimeStr}/${endTimeStr}&details=${details}&location=${location}`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-28">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-[#1E3A8A] via-[#305AA2] to-[#305AA2] text-white pt-12 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-[#EA6624]/10 blur-2xl pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-white/90">
                <Sparkles size={14} className="text-[#EA6624]" />
                <span>Assistance voyage personnalisée & réactive</span>
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight">
                Prise de Rendez-vous & <span className="text-[#EA6624]">Contact Direct</span>
              </h1>
              <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
                Besoin d'un visa, d'un vol, d'une Omra ou d'un voyage sur mesure ? Rencontrez nos conseillers en agence à Trouville (Ain El Turk, Oran) ou échangez directement par téléphone et WhatsApp 7j/7.
              </p>
            </div>

            {/* Live Agency Status Pill */}
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-white max-w-xs shadow-xl">
              <div className="flex items-center gap-3">
                <span className="relative flex h-3.5 w-3.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${agencyOpenNow ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3.5 w-3.5 ${agencyOpenNow ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-white/80">Agence Ain El Turk</p>
                  <p className="text-sm font-black">
                    {agencyOpenNow ? 'Ouverte actuellement' : 'Fermée pour le moment'}
                  </p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-white/10 text-xs text-blue-100 space-y-1">
                <p className="flex items-center justify-between">
                  <span>Samedi - Jeudi :</span>
                  <span className="font-bold text-white">09h00 - 18h00</span>
                </p>
                <p className="flex items-center justify-between">
                  <span>Vendredi :</span>
                  <span className="text-amber-200 font-semibold">Permanence WhatsApp 24/7</span>
                </p>
              </div>
            </div>
          </div>

          {/* Quick Nav Tabs */}
          <div className="mt-10 flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => setActiveTab('appointment')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'appointment'
                  ? 'bg-white text-[#305AA2] shadow-lg scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <Calendar size={18} />
              <span>Prendre un Rendez-vous</span>
            </button>

            <button
              onClick={() => setActiveTab('hotlines')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'hotlines'
                  ? 'bg-white text-[#305AA2] shadow-lg scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <PhoneCall size={18} />
              <span>Assistance Directe & Hotlines</span>
            </button>

            <button
              onClick={() => setActiveTab('agency')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                activeTab === 'agency'
                  ? 'bg-white text-[#305AA2] shadow-lg scale-105'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
            >
              <MapPin size={18} />
              <span>Agence & Plan d'Accès</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">

        {/* TAB 1: PRENDRE RENDEZ-VOUS */}
        {activeTab === 'appointment' && (
          <div className="space-y-8">
            {confirmedAppointment ? (
              /* Success Confirmation Card */
              <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10 text-center max-w-2xl mx-auto animate-in fade-in zoom-in-95 duration-300">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                  <CheckCircle2 size={44} />
                </div>
                
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
                  Demande Enregistrée
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
                  Votre rendez-vous est réservé !
                </h2>
                <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
                  Merci <span className="font-semibold text-gray-800">{confirmedAppointment.fullName}</span>. Notre équipe prépare votre dossier et vous contactera pour confirmer les derniers détails.
                </p>

                {/* Appointment details box */}
                <div className="bg-gray-50 rounded-2xl p-6 text-left border border-gray-200/80 mb-6 space-y-3">
                  <div className="flex justify-between items-center text-xs pb-3 border-b border-gray-200">
                    <span className="text-gray-500 uppercase font-bold tracking-wider">Référence RDV</span>
                    <span className="font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                      RDV-{confirmedAppointment.id.slice(0, 6).toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm pt-1">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Mode de rendez-vous</p>
                      <p className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                        {confirmedAppointment.type === 'agency' && <><Building2 size={16} className="text-primary" /> En agence (Ain El Turk)</>}
                        {confirmedAppointment.type === 'phone' && <><Phone size={16} className="text-primary" /> Par téléphone</>}
                        {confirmedAppointment.type === 'video' && <><Video size={16} className="text-primary" /> Visioconférence</>}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Service souhaité</p>
                      <p className="font-bold text-gray-900 mt-0.5 capitalize">
                        {SERVICE_OPTIONS.find(s => s.id === confirmedAppointment.serviceInterest)?.label || confirmedAppointment.serviceInterest}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Date</p>
                      <p className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                        <Calendar size={16} className="text-accent" />
                        {new Date(confirmedAppointment.date).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Heure</p>
                      <p className="font-bold text-gray-900 flex items-center gap-1.5 mt-0.5">
                        <Clock size={16} className="text-accent" />
                        {confirmedAppointment.timeSlot}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Téléphone de contact</p>
                      <p className="font-bold text-gray-900 mt-0.5">{confirmedAppointment.phone}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-400 font-semibold">Voyageurs concernés</p>
                      <p className="font-bold text-gray-900 mt-0.5">{confirmedAppointment.numberOfPeople || 1} personne(s)</p>
                    </div>
                  </div>

                  {confirmedAppointment.type === 'agency' && (
                    <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600 flex items-start gap-2">
                      <MapPin size={16} className="text-accent shrink-0 mt-0.5" />
                      <span>
                        <strong>Lieu :</strong> Trouville (en face du Commissariat), Ain El Turk, Oran, Algérie.
                      </span>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <a
                    href={getWhatsAppAppointmentLink(confirmedAppointment)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-green-500/20 transition-all text-sm"
                  >
                    <MessageSquare size={18} />
                    <span>Envoyer sur WhatsApp</span>
                  </a>

                  <a
                    href={getGoogleCalendarUrl(confirmedAppointment)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-800 font-bold px-6 py-3.5 rounded-xl border border-gray-200 transition-all text-sm shadow-sm"
                  >
                    <CalendarCheck size={18} className="text-primary" />
                    <span>Ajouter à Google Agenda</span>
                  </a>

                  <button
                    onClick={() => {
                      setConfirmedAppointment(null);
                      setNotes('');
                    }}
                    className="px-6 py-3.5 text-gray-500 hover:text-gray-800 font-semibold text-sm transition-colors"
                  >
                    Nouveau rendez-vous
                  </button>
                </div>
              </div>
            ) : (
              /* Booking Form Container */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Form (2 cols) */}
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10">
                  <div className="mb-8">
                    <h2 className="text-2xl font-black text-gray-900">Formulaire de Prise de Rendez-vous</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Choisissez la formule qui vous convient et réservez votre créneau en 1 minute.
                    </p>
                  </div>

                  <form onSubmit={handleBookAppointment} className="space-y-8">
                    {/* STEP 1: Consultation Type */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                        1. Choisissez le format de rencontre
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => setConsultationType('agency')}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            consultationType === 'agency'
                              ? 'border-primary bg-primary/5 text-primary shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <Building2 size={24} className={consultationType === 'agency' ? 'text-primary' : 'text-gray-400'} />
                          <p className="font-bold text-sm mt-2">En Agence</p>
                          <p className="text-xs text-gray-500 mt-1 leading-snug">Trouville, Ain El Turk (Oran)</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConsultationType('phone')}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            consultationType === 'phone'
                              ? 'border-primary bg-primary/5 text-primary shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <Phone size={24} className={consultationType === 'phone' ? 'text-primary' : 'text-gray-400'} />
                          <p className="font-bold text-sm mt-2">Par Téléphone</p>
                          <p className="text-xs text-gray-500 mt-1 leading-snug">Un conseiller vous appelle</p>
                        </button>

                        <button
                          type="button"
                          onClick={() => setConsultationType('video')}
                          className={`p-4 rounded-2xl border-2 text-left transition-all ${
                            consultationType === 'video'
                              ? 'border-primary bg-primary/5 text-primary shadow-sm'
                              : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }`}
                        >
                          <Video size={24} className={consultationType === 'video' ? 'text-primary' : 'text-gray-400'} />
                          <p className="font-bold text-sm mt-2">Visioconférence</p>
                          <p className="text-xs text-gray-500 mt-1 leading-snug">Google Meet ou WhatsApp</p>
                        </button>
                      </div>
                    </div>

                    {/* STEP 2: Service / Subject */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                        2. Motif de votre rendez-vous
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {SERVICE_OPTIONS.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setServiceInterest(item.id)}
                            className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                              serviceInterest === item.id
                                ? 'border-primary bg-primary/5 text-primary font-bold shadow-xs'
                                : 'border-gray-200 hover:border-gray-300 text-gray-700 text-sm'
                            }`}
                          >
                            <span className="text-xl shrink-0">{item.icon}</span>
                            <span className="text-xs sm:text-sm leading-snug">{item.label}</span>
                            {serviceInterest === item.id && (
                              <Check size={16} className="text-primary ml-auto shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* STEP 3: Date & Slot Selection */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                        3. Date & Créneau souhaité
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 font-semibold mb-1.5">
                            Sélectionner une date
                          </label>
                          <div className="relative">
                            <input
                              type="date"
                              min={getMinDate()}
                              max={getMaxDate()}
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-primary focus:bg-white"
                              required
                            />
                          </div>
                          <p className="text-[11px] text-gray-400 mt-1">
                            * Agence ouverte du Samedi au Jeudi. Fermée le Vendredi.
                          </p>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 font-semibold mb-1.5">
                            Nombre de voyageurs / personnes
                          </label>
                          <div className="flex items-center gap-2">
                            {[1, 2, 3, 4].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => setNumberOfPeople(num)}
                                className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${
                                  numberOfPeople === num
                                    ? 'bg-primary text-white border-primary shadow-xs'
                                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                {num === 4 ? '4+' : num} {num === 1 ? 'pers.' : 'pers.'}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Time Slots */}
                      <div className="mt-4">
                        <label className="block text-xs text-gray-500 font-semibold mb-2">
                          Sélectionner une heure :
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {TIME_SLOTS.map((slot) => (
                            <button
                              key={slot}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                                selectedSlot === slot
                                  ? 'bg-[#305AA2] text-white shadow-md shadow-primary/20 scale-105'
                                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                              }`}
                            >
                              <Clock size={12} className={selectedSlot === slot ? 'text-white' : 'text-gray-400'} />
                              {slot}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* STEP 4: Client Coordinates */}
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-3">
                        4. Vos coordonnées de contact
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs text-gray-500 font-semibold mb-1">
                            Nom et Prénom *
                          </label>
                          <input
                            type="text"
                            placeholder="Ex: Mohamed Benali"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 font-semibold mb-1">
                            Numéro de Téléphone (Mobile) *
                          </label>
                          <input
                            type="tel"
                            placeholder="Ex: 07 81 94 96 67 ou 05 51 37 27 22"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 font-semibold mb-1">
                            Adresse Email (optionnel)
                          </label>
                          <input
                            type="email"
                            placeholder="votre.email@exemple.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-500 font-semibold mb-1">
                            Wilaya de résidence
                          </label>
                          <select
                            value={wilaya}
                            onChange={(e) => setWilaya(e.target.value)}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white"
                          >
                            <option value="Oran">31 - Oran</option>
                            <option value="Alger">16 - Alger</option>
                            <option value="Tlemcen">13 - Tlemcen</option>
                            <option value="Mostaganem">27 - Mostaganem</option>
                            <option value="Sidi Bel Abbès">22 - Sidi Bel Abbès</option>
                            <option value="Mascara">29 - Mascara</option>
                            <option value="Aïn Témouchent">46 - Aïn Témouchent</option>
                            <option value="Constantine">25 - Constantine</option>
                            <option value="Autre">Autre Wilaya / Étranger</option>
                          </select>
                        </div>
                      </div>

                      <div className="mt-4">
                        <label className="block text-xs text-gray-500 font-semibold mb-1">
                          Précisions ou questions particulières (optionnel)
                        </label>
                        <textarea
                          rows={2}
                          placeholder="Ex: Je souhaite faire une demande de visa Turquie pour 3 personnes au mois de juillet..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white resize-none"
                        />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={submittingAppointment}
                        className="w-full bg-[#305AA2] hover:bg-[#1E3A8A] text-white py-4 rounded-2xl font-black text-base shadow-lg shadow-primary/25 transition-all flex items-center justify-center gap-2 hover:gap-3 disabled:opacity-60"
                      >
                        {submittingAppointment ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Réservation en cours...</span>
                          </>
                        ) : (
                          <>
                            <span>Confirmer mon Rendez-vous</span>
                            <ArrowRight size={20} />
                          </>
                        )}
                      </button>
                      <p className="text-center text-xs text-gray-400 mt-3">
                        Rendez-vous sans engagement. Aucun frais de réservation.
                      </p>
                    </div>
                  </form>
                </div>

                {/* Sidebar Info & Trust Badges (1 col) */}
                <div className="space-y-6">
                  {/* Agency Fast Info Card */}
                  <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-6 sm:p-7 text-white shadow-xl">
                    <h3 className="font-black text-lg flex items-center gap-2 mb-4">
                      <Building2 className="text-[#EA6624]" size={20} />
                      <span>Accueil en Agence</span>
                    </h3>
                    <div className="space-y-4 text-xs text-gray-300">
                      <div className="flex items-start gap-3">
                        <MapPin size={18} className="text-[#EA6624] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white text-sm">Afaf Voyages Ain El Turk</p>
                          <p>Trouville (en face du Commissariat de police)</p>
                          <p>Ain El Turk, Oran, Algérie</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Clock size={18} className="text-[#EA6624] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white text-sm">Horaires de réception</p>
                          <p>Samedi au Jeudi : 09h00 - 18h00</p>
                          <p className="text-amber-300">Vendredi : Fermé (Permanence WhatsApp)</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone size={18} className="text-[#EA6624] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-white text-sm">Lignes directes</p>
                          <p>+213 781 94 96 67</p>
                          <p>+213 551 37 27 22</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-5 border-t border-gray-700/80">
                      <a
                        href="https://www.google.com/maps/search/?api=1&query=Ain+El+Turk+Trouville+Oran"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs font-bold text-[#EA6624] hover:text-orange-300 transition-colors"
                      >
                        <span>Ouvrir dans Google Maps</span>
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </div>

                  {/* Why Book an Appointment */}
                  <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-md space-y-4">
                    <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                      <ShieldCheck size={18} className="text-primary" />
                      <span>Pourquoi prendre rendez-vous ?</span>
                    </h3>
                    <ul className="space-y-3 text-xs text-gray-600">
                      <li className="flex items-start gap-2.5">
                        <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Zéro attente en agence</strong> : un conseiller dédié vous reçoit à l'heure convenue.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Étude approfondie de dossier</strong> : vérification rigoureuse de vos pièces visa ou Omra.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Devis personnalisé immédiat</strong> : options de vol, bagages et hôtels comparés en direct.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <Check size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                        <span><strong>Paiement flexible sécurisé</strong> : espèces, BaridiMob, ou virement bancaire sur place.</span>
                      </li>
                    </ul>
                  </div>

                  {/* Emergency box */}
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-200 rounded-3xl p-6">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider mb-2">
                      <AlertTriangle size={16} className="text-accent" />
                      <span>Urgence Voyage 24/7</span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">
                      Votre départ a lieu dans moins de 24h ou vous avez un vol/bateau reporté ? Ne prenez pas de rendez-vous, contactez immédiatement notre hotline prioritaire :
                    </p>
                    <a
                      href="https://wa.me/213781949667?text=URGENCE%20VOYAGE%20:%20Départ%20imminent%20ou%20problème%20vol/bateau"
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-flex items-center gap-2 bg-[#EA6624] text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-orange-600 transition-colors shadow-sm"
                    >
                      <PhoneCall size={14} />
                      <span>WhatsApp Urgence (+213 781 94 96 67)</span>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* User's existing appointments if logged in */}
            {user && userAppointments.length > 0 && (
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6 sm:p-8 mt-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-black text-gray-900">Mes Rendez-vous Prévus</h3>
                    <p className="text-gray-500 text-xs mt-0.5">Historique et statut de vos demandes de rendez-vous</p>
                  </div>
                  <span className="bg-primary/10 text-primary text-xs font-bold px-3 py-1 rounded-full">
                    {userAppointments.length} rendez-vous
                  </span>
                </div>

                <div className="space-y-3">
                  {userAppointments.map((app) => (
                    <div
                      key={app.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 transition-all gap-4"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          {app.type === 'agency' && <Building2 size={22} />}
                          {app.type === 'phone' && <Phone size={22} />}
                          {app.type === 'video' && <Video size={22} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-sm">
                              {app.type === 'agency' ? 'En Agence (Trouville Ain El Turk)' : (app.type === 'phone' ? 'Par Téléphone' : 'Visioconférence')}
                            </p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              app.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                              app.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                              app.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-amber-100 text-amber-800'
                            }`}>
                              {app.status === 'pending' && 'En attente'}
                              {app.status === 'confirmed' && 'Confirmé'}
                              {app.status === 'completed' && 'Effectué'}
                              {app.status === 'cancelled' && 'Annulé'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1 font-semibold text-gray-700">
                              <Calendar size={13} className="text-accent" />
                              {app.date}
                            </span>
                            <span className="flex items-center gap-1 font-semibold text-gray-700">
                              <Clock size={13} className="text-accent" />
                              {app.timeSlot}
                            </span>
                            <span className="capitalize">Motif: {app.serviceInterest}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <a
                          href={getWhatsAppAppointmentLink(app)}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                          title="Échanger sur WhatsApp"
                        >
                          <MessageSquare size={13} />
                          <span>WhatsApp</span>
                        </a>

                        {app.status === 'pending' && (
                          <button
                            onClick={() => handleCancelAppointment(app.id)}
                            className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg font-semibold transition-colors"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: ASSISTANCE DIRECTE & HOTLINES */}
        {activeTab === 'hotlines' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Quick Hotline Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hotline 1 */}
              <div className="bg-white rounded-3xl p-7 shadow-xl border border-gray-100 relative overflow-hidden group hover:shadow-2xl transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-125" />
                <div className="relative z-10 space-y-4">
                  <div className="w-14 h-14 bg-green-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25">
                    <MessageSquare size={28} />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-green-100 text-green-800 text-[11px] font-black uppercase tracking-wider">
                      Ligne 1 • WhatsApp & Appel
                    </span>
                    <h3 className="text-xl font-black text-gray-900 mt-1">Service Billetterie & Vols</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Réservation de billets d'avion (Air Algérie, Air France, Turkish Airlines, etc.), traversées maritimes, modifications de dates et tarifs familles.
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 font-mono text-base font-bold text-gray-900 flex items-center justify-between">
                    <span>+213 781 94 96 67</span>
                    <span className="text-[10px] font-sans font-bold text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                      En Ligne
                    </span>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <a
                      href="https://wa.me/213781949667?text=Bonjour%20Afaf%20Voyages,%20je%20souhaite%20une%20assistance%20billetterie%20ou%20information%20vol/bateau"
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare size={16} />
                      <span>WhatsApp Direct</span>
                    </a>
                    <a
                      href="tel:+213781949667"
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      title="Appel direct"
                    >
                      <Phone size={16} />
                      <span>Appeler</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Hotline 2 */}
              <div className="bg-white rounded-3xl p-7 shadow-xl border border-gray-100 relative overflow-hidden group hover:shadow-2xl transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-10 -mt-10 pointer-events-none transition-transform group-hover:scale-125" />
                <div className="relative z-10 space-y-4">
                  <div className="w-14 h-14 bg-[#305AA2] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/25">
                    <ShieldCheck size={28} />
                  </div>
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-md bg-blue-100 text-[#305AA2] text-[11px] font-black uppercase tracking-wider">
                      Ligne 2 • Visas & Omra
                    </span>
                    <h3 className="text-xl font-black text-gray-900 mt-1">Service Visas, Omra & Séjours</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      Assistance visas touristiques & d'affaires (Dubaï, Turquie, Chine, Schengen), programmes Omra 2026 et voyages organisés (Malaisie, Azerbaïdjan, Égypte).
                    </p>
                  </div>

                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 font-mono text-base font-bold text-gray-900 flex items-center justify-between">
                    <span>+213 551 37 27 22</span>
                    <span className="text-[10px] font-sans font-bold text-[#305AA2] bg-blue-100 px-2 py-0.5 rounded-full">
                      Disponible
                    </span>
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <a
                      href="https://wa.me/213551372722?text=Bonjour%20Afaf%20Voyages,%20je%20souhaite%20une%20assistance%20visa%20ou%20omra"
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare size={16} />
                      <span>WhatsApp Direct</span>
                    </a>
                    <a
                      href="tel:+213551372722"
                      className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      title="Appel direct"
                    >
                      <Phone size={16} />
                      <span>Appeler</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Message / Callback Request Form */}
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 sm:p-10">
              <div className="max-w-2xl mb-8">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#EA6624] mb-1">
                  <PhoneCall size={14} />
                  <span>Rappel Express</span>
                </span>
                <h3 className="text-2xl font-black text-gray-900">Demander un Rappel ou Laisser un Message</h3>
                <p className="text-gray-500 text-sm mt-1">
                  Vous n'avez pas WhatsApp ou préférez être rappelé par un conseiller ? Laissez votre numéro et nous vous recontacterons dans les plus brefs délais.
                </p>
              </div>

              <form onSubmit={handleSendCallback} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-700 font-bold mb-1.5">
                      Votre Nom complet *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Amina Kaci"
                      value={callbackName}
                      onChange={(e) => setCallbackName(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-gray-700 font-bold mb-1.5">
                      Numéro de Téléphone *
                    </label>
                    <input
                      type="tel"
                      placeholder="Ex: 05 51 37 27 22"
                      value={callbackPhone}
                      onChange={(e) => setCallbackPhone(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-700 font-bold mb-1.5">
                    Objet de votre demande *
                  </label>
                  <select
                    value={callbackSubject}
                    onChange={(e) => setCallbackSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white"
                  >
                    <option value="Devis & Réservation de voyage">Devis & Réservation de voyage</option>
                    <option value="Renseignement Omra 2026">Renseignement Omra 2026</option>
                    <option value="Demande d'Assistance Visa">Demande d'Assistance Visa</option>
                    <option value="Modification ou Suivi de Billet">Modification ou Suivi de Billet</option>
                    <option value="Paiement & Facturation">Paiement & Facturation</option>
                    <option value="Autre demande">Autre demande</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-700 font-bold mb-1.5">
                    Votre Message ou Détails de votre voyage *
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Précisez les dates de voyage souhaitées, destination, nombre de passagers ou toute question..."
                    value={callbackMessage}
                    onChange={(e) => setCallbackMessage(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-primary focus:bg-white resize-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="urgentCheckbox"
                    checked={callbackUrgent}
                    onChange={(e) => setCallbackUrgent(e.target.checked)}
                    className="w-4 h-4 text-accent border-gray-300 rounded focus:ring-accent"
                  />
                  <label htmlFor="urgentCheckbox" className="text-xs font-semibold text-gray-700 cursor-pointer">
                    Demande urgente (départ dans les 48h ou urgence visa)
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submittingCallback}
                  className="bg-[#305AA2] hover:bg-[#1E3A8A] text-white px-8 py-3.5 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submittingCallback ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>Envoyer ma demande de rappel</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: AGENCE & PLAN D'ACCÈS */}
        {activeTab === 'agency' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Agency Detailed Card (1 col) */}
              <div className="bg-white rounded-3xl p-7 sm:p-8 shadow-xl border border-gray-100 space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Siège & Agence Principale</span>
                  <h3 className="text-2xl font-black text-gray-900 mt-1">Afaf Voyages</h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Agence de voyage et de tourisme agréée par le Ministère du Tourisme et de l'Artisanat.
                  </p>
                </div>

                <div className="space-y-4 text-sm text-gray-700">
                  <div className="flex items-start gap-3">
                    <MapPin className="text-accent shrink-0 mt-1" size={18} />
                    <div>
                      <p className="font-bold text-gray-900">Adresse</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        Trouville (en face du Commissariat de police)
                      </p>
                      <p className="text-xs text-gray-600">
                        Ain El Turk, Wilaya d'Oran, Algérie
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="text-accent shrink-0 mt-1" size={18} />
                    <div>
                      <p className="font-bold text-gray-900">Horaires d'ouverture</p>
                      <div className="text-xs text-gray-600 mt-0.5 space-y-0.5">
                        <p><span className="font-medium text-gray-800">Samedi - Mercredi :</span> 09h00 - 18h00</p>
                        <p><span className="font-medium text-gray-800">Jeudi :</span> 09h00 - 17h00</p>
                        <p className="text-amber-600 font-semibold"><span className="font-medium">Vendredi :</span> Fermé (Permanence WhatsApp 24/7)</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="text-accent shrink-0 mt-1" size={18} />
                    <div>
                      <p className="font-bold text-gray-900">Numéros de téléphone</p>
                      <div className="text-xs text-gray-600 mt-0.5 space-y-0.5 font-mono">
                        <p><a href="tel:+213781949667" className="hover:text-primary">+213 781 94 96 67</a></p>
                        <p><a href="tel:+213551372722" className="hover:text-primary">+213 551 37 27 22</a></p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="text-accent shrink-0 mt-1" size={18} />
                    <div>
                      <p className="font-bold text-gray-900">Courrier électronique</p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        <a href="mailto:afafvoyage54@gmail.com" className="hover:text-primary">
                          afafvoyage54@gmail.com
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 flex flex-col gap-2.5">
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Ain+El+Turk+Trouville+Oran"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-[#305AA2] hover:bg-[#1E3A8A] text-white py-3 rounded-xl font-bold text-xs text-center transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20"
                  >
                    <ExternalLink size={15} />
                    <span>Calculer mon Itinéraire GPS</span>
                  </a>

                  <a
                    href="https://wa.me/213781949667?text=Bonjour,%20je%20suis%20en%20route%20vers%20votre%20agence%20à%20Ain%20El%20Turk"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-3 rounded-xl font-bold text-xs text-center transition-all flex items-center justify-center gap-2 border border-green-200"
                  >
                    <MessageSquare size={15} />
                    <span>Prévenir de mon arrivée sur WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Map & Access Guide (2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100">
                  {/* Interactive Map Iframe */}
                  <div className="h-80 sm:h-96 w-full relative bg-gray-100">
                    <iframe
                      title="Plan de localisation Afaf Voyages Ain El Turk"
                      src="https://www.openstreetmap.org/export/embed.html?bbox=-0.7700%2C35.7350%2C-0.7300%2C35.7600&amp;layer=mapnik&amp;marker=35.7460%2C-0.7490"
                      className="w-full h-full border-0"
                      loading="lazy"
                    />
                    <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl shadow-lg border border-gray-200/80 text-xs">
                      <p className="font-bold text-gray-900 flex items-center gap-1.5">
                        <MapPin size={14} className="text-[#EA6624]" />
                        <span>Afaf Voyages • Trouville, Ain El Turk</span>
                      </p>
                      <p className="text-[10px] text-gray-500 mt-0.5">En face du Commissariat de Police</p>
                    </div>
                  </div>

                  <div className="p-6 sm:p-7 bg-gray-50 border-t border-gray-100">
                    <h4 className="font-bold text-sm text-gray-900 mb-2">Comment vous rendre à l'agence :</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-600">
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-primary shrink-0">🚗 En voiture :</span>
                        <span>Depuis Oran Centre, emprunter la route de la Corniche supérieure ou inférieure en direction d'Ain El Turk. Stationnement facile disponible devant et autour de l'agence.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="font-bold text-primary shrink-0">🚌 En transport :</span>
                        <span>Prendre les bus ou taxis collectifs ligne Oran - Ain El Turk (arrêt Trouville / Commissariat). L'agence est située directement en face.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Remote booking notice */}
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-3xl p-6 text-xs text-blue-900 flex items-start gap-3">
                  <Sparkles size={20} className="text-[#305AA2] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-[#1E3A8A]">Vous habitez hors de la Wilaya d'Oran ?</p>
                    <p className="mt-1 text-gray-700 leading-relaxed">
                      Pas besoin de vous déplacer ! <strong>90% de nos prestations</strong> (billetterie aérienne & maritime, e-visas et forfaits voyages) peuvent être traitées à 100% à distance par WhatsApp et e-mail avec paiement sécurisé par CCP / BaridiMob.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16 bg-white rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-10">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-[#EA6624]">Questions Fréquentes</span>
            <h3 className="text-2xl font-black text-gray-900 mt-1">Tout ce qu'il faut savoir avant de nous contacter</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100">
              <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                <HelpCircle size={16} className="text-primary" />
                <span>Quels documents dois-je préparer pour un visa ?</span>
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Pour la plupart des demandes (Turquie, EAU/Dubaï, Chine), prévoyez un passeport d'une validité minimale de 6 mois, une photo d'identité fond blanc récente et une copie de votre carte d'identité. Nos conseillers vous transmettent la liste exacte adaptée à votre pays de destination.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100">
              <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                <HelpCircle size={16} className="text-primary" />
                <span>Quels sont les modes de paiement acceptés ?</span>
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Nous acceptons les règlements en espèces (Dinar Algérien) en agence, les virements bancaires ainsi que les paiements à distance instantanés par BaridiMob / CCP avec délivrance immédiate de votre reçu officiel.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100">
              <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                <HelpCircle size={16} className="text-primary" />
                <span>Puis-je modifier ou annuler mon rendez-vous ?</span>
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Oui, totalement sans frais ! Vous pouvez annuler votre demande directement depuis cette page si vous êtes connecté, ou en envoyant simplement un petit message sur WhatsApp avec votre nom et heure de rendez-vous.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-gray-50/70 border border-gray-100">
              <h4 className="font-bold text-gray-900 flex items-center gap-2 mb-2">
                <HelpCircle size={16} className="text-primary" />
                <span>Comment obtenir mon billet d'avion ou de bateau ?</span>
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                Dès confirmation et émission de votre réservation, votre billet électronique officiel (e-ticket avec code PNR) vous est transmis en version PDF par WhatsApp et e-mail, ou imprimé directement en agence lors de votre visite.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
