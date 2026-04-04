import { useState, useEffect, useMemo } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link, 
  useNavigate, 
  useLocation,
  useParams
} from 'react-router-dom';
import { 
  Plane, 
  Ship, 
  Hotel, 
  FileText, 
  Home, 
  Search, 
  User, 
  LogOut, 
  Menu, 
  X,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  LayoutDashboard,
  Loader2,
  Facebook,
  Instagram,
  Calendar,
  Check,
  Star,
  Globe,
  Moon,
  ArrowUpDown,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster, toast } from 'sonner';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  Timestamp,
  updateDoc,
  getDocs,
  arrayUnion,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { UserProfile, BookingRequest, ServiceType, BookingStatus, TravelOffer } from './types';
import Chatbot from './components/Chatbot';
import { TRAVEL_OFFERS, FLIGHT_ROUTES, AIRLINE_CAMPAIGNS, SEA_CAMPAIGNS } from './constants';
import { useSearchParams } from 'react-router-dom';

// --- Components ---

const Navbar = ({ user, profile }: { user: FirebaseUser | null, profile: UserProfile | null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Accueil', path: '/', icon: Home },
    { name: 'Services', path: '/services', icon: Plane },
    { name: 'Suivre ma demande', path: '/track', icon: Search },
  ];

  if (profile?.role === 'admin') {
    navLinks.push({ name: 'Dashboard', path: '/admin', icon: LayoutDashboard });
  }

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img 
                src="/logo.png" 
                alt="Afaf Voyages" 
                className="h-16 w-auto" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://placehold.co/200x80/1B365D/FFFFFF?text=Afaf+Voyages';
                }}
              />
            </Link>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-2 text-sm font-bold transition-colors ${
                  location.pathname === link.path ? 'text-primary' : 'text-gray-500 hover:text-primary'
                }`}
              >
                <link.icon size={18} />
                {link.name}
              </Link>
            ))}
            {user ? (
              <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
                <div className="text-right hidden lg:block">
                  <p className="text-xs font-bold text-gray-900">{user.displayName}</p>
                  <p className="text-[10px] text-accent font-black uppercase tracking-wider">{profile?.role}</p>
                </div>
                <button
                  onClick={() => signOut(auth)}
                  className="p-2 text-gray-400 hover:text-accent transition-colors"
                  title="Déconnexion"
                >
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-primary text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20"
              >
                Connexion
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-600 p-2"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100 overflow-hidden"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                >
                  <link.icon size={20} />
                  {link.name}
                </Link>
              ))}
              {!user && (
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-bold bg-primary text-white"
                >
                  <User size={20} />
                  Connexion
                </Link>
              )}
              {user && (
                <button
                  onClick={() => {
                    signOut(auth);
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut size={20} />
                  Déconnexion
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Footer = () => (
  <footer className="bg-gray-900 text-white py-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
        <div className="space-y-6">
          <div className="flex items-center">
            <img 
              src="/logo.png" 
              alt="Afaf Voyages" 
              className="h-12 w-auto brightness-0 invert" 
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://placehold.co/200x80/1B365D/FFFFFF?text=Afaf+Voyages';
              }}
            />
          </div>
          <p className="text-gray-400 text-sm leading-relaxed">
            Votre partenaire de confiance pour tous vos besoins de voyage : Air, Mer, Hôtel et Visas.
          </p>
        </div>
        
        <div>
          <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">Services</h4>
          <ul className="space-y-3 text-sm text-gray-400">
            <li><Link to="/booking/air" className="hover:text-accent transition-colors">Billets d'avion</Link></li>
            <li><Link to="/booking/sea" className="hover:text-accent transition-colors">Traversées maritimes</Link></li>
            <li><Link to="/booking/hotel" className="hover:text-accent transition-colors">Réservations d'hôtels</Link></li>
            <li><Link to="/booking/visa" className="hover:text-accent transition-colors">Assistance Visa</Link></li>
            <li><Link to="/services?type=organized-trip" className="hover:text-accent transition-colors">Voyages Organisés</Link></li>
            <li><Link to="/services?type=omra" className="hover:text-accent transition-colors">Omra</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">Contact</h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li className="flex items-center gap-3"><Phone size={16} className="text-accent" /> +213 781 94 96 67</li>
            <li className="flex items-center gap-3"><Phone size={16} className="text-accent" /> +213 551 37 27 22</li>
            <li className="flex items-center gap-3"><Mail size={16} className="text-accent" /> afafvoyage@gmail.com</li>
            <li className="flex items-center gap-3"><MapPin size={16} className="text-accent" /> Trouville (en face Commissariat) Ain El Turk, Oran, Algérie</li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-6 text-white uppercase tracking-widest text-xs">Suivez-nous</h4>
          <div className="flex gap-4">
            <a 
              href="https://www.facebook.com/afafvoyages/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-primary transition-all group"
            >
              <Facebook size={20} className="group-hover:scale-110 transition-transform" />
            </a>
            <a 
              href="#" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-accent transition-all group"
            >
              <Instagram size={20} className="group-hover:scale-110 transition-transform" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-gray-800 mt-16 pt-8 text-center text-gray-500 text-[10px] font-bold uppercase tracking-[0.2em]">
        &copy; {new Date().getFullYear()} Agence Afaf Voyages. Tous droits réservés.
      </div>
    </div>
  </footer>
);

// --- Pages ---

const HomePage = () => (
  <div className="space-y-32 pb-32">
    {/* Hero Section - Editorial Style */}
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-900">
      <div className="absolute inset-0 z-0">
        <img 
          src="https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=2070" 
          alt="Travel" 
          className="w-full h-full object-cover brightness-[0.25] scale-105"
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1464037862646-647f187a4936?auto=format&fit=crop&q=80&w=2070';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 via-transparent to-gray-900"></div>
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.5 }}
          className="space-y-12"
        >
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-2.5 rounded-full">
            <span className="w-2 h-2 bg-accent rounded-full animate-pulse shadow-[0_0_10px_rgba(243,112,33,0.8)]"></span>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-300">Explorez le monde avec Afaf</span>
          </div>
          
          <div className="relative">
            <motion.h1 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-[15vw] md:text-[12vw] font-black leading-[0.85] tracking-tighter uppercase italic text-white/10 absolute -top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap"
            >
              Voyages
            </motion.h1>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-7xl md:text-9xl font-black leading-[0.9] tracking-tighter relative"
            >
              L'ART DE <br />
              <span className="text-accent">VOYAGER</span>
            </motion.h2>
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto font-medium"
          >
            Une expertise unique pour vos billets d'avion, réservations d'hôtels et visas. 
            Nous collaborons avec les plus grandes compagnies mondiales pour votre confort.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex flex-wrap justify-center gap-6 pt-8"
          >
            <Link 
              to="/services" 
              className="group bg-primary text-white px-12 py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-secondary transition-all shadow-[0_20px_50px_rgba(27,54,93,0.3)] flex items-center gap-4"
            >
              Découvrir nos offres <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link 
              to="/track" 
              className="bg-white/5 backdrop-blur-md text-white border border-white/10 px-12 py-6 rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all"
            >
              Suivre ma demande
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
      >
        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500">Défiler</span>
        <div className="w-px h-12 bg-gradient-to-b from-accent to-transparent"></div>
      </motion.div>
    </section>

    {/* Stats Section - Clean Utility */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16">
        {[
          { label: 'Clients Heureux', value: '15k+', color: 'text-primary' },
          { label: 'Destinations', value: '60+', color: 'text-accent' },
          { label: 'Années d\'Expérience', value: '12', color: 'text-primary' },
          { label: 'Partenaires', value: '25+', color: 'text-accent' }
        ].map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="text-center space-y-2"
          >
            <p className={`text-5xl md:text-7xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{stat.label}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* Campaigns Section - Airlines & Sea Boats */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Airlines Side */}
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-accent font-black tracking-[0.4em] uppercase text-[10px]">Compagnies Aériennes</h2>
            <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Nos Partenaires <br /><span className="text-primary">Aériens</span></h3>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {AIRLINE_CAMPAIGNS.map((airline, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-3 group hover:shadow-xl transition-all"
              >
                <div className="h-12 flex items-center justify-center">
                  <img 
                    src={airline.logo} 
                    alt={airline.name} 
                    className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x200/1B365D/FFFFFF?text=${airline.name}`;
                    }}
                  />
                </div>
                <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary transition-colors text-center">{airline.name}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Sea Boats Side */}
        <div className="space-y-12">
          <div className="space-y-4">
            <h2 className="text-accent font-black tracking-[0.4em] uppercase text-[10px]">Traversées Maritimes</h2>
            <h3 className="text-4xl font-black text-gray-900 tracking-tighter uppercase">Lignes <br /><span className="text-primary">Maritimes</span></h3>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {SEA_CAMPAIGNS.map((sea, i) => (
              <motion.div 
                key={i}
                whileHover={{ scale: 1.05 }}
                className="bg-white border border-gray-100 p-8 rounded-[32px] shadow-sm flex flex-col items-center justify-center gap-6 group hover:shadow-xl transition-all h-full"
              >
                <div className="h-20 flex items-center justify-center">
                  <img 
                    src={sea.logo} 
                    alt={sea.name} 
                    className="max-h-full max-w-full object-contain grayscale group-hover:grayscale-0 transition-all" 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://placehold.co/400x200/1B365D/FFFFFF?text=${sea.name}`;
                    }}
                  />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-primary transition-colors">{sea.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>

    {/* About Us - Split Layout */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
        <div className="space-y-12">
          <div className="space-y-6">
            <h2 className="text-accent font-black tracking-[0.4em] uppercase text-[10px]">Notre Histoire</h2>
            <h3 className="text-6xl font-black text-gray-900 leading-[0.9] tracking-tighter">
              L'EXCELLENCE <br />
              <span className="text-primary">SANS COMPROMIS</span>
            </h3>
          </div>
          <p className="text-gray-500 leading-relaxed text-xl font-medium">
            Depuis plus d'une décennie, Afaf Voyages redéfinit les standards du voyage en Algérie. 
            Notre mission est simple : transformer chaque déplacement en une expérience mémorable, 
            grâce à une attention méticuleuse aux détails et des partenariats mondiaux stratégiques.
          </p>
          <div className="space-y-6">
            {[
              "Accompagnement personnalisé 24h/24",
              "Accès exclusif aux meilleurs tarifs aériens",
              "Expertise reconnue en assistance Visa"
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Check size={14} />
                </div>
                <span className="font-bold text-gray-700">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative group">
          <div className="aspect-[4/5] rounded-[60px] overflow-hidden shadow-[0_50px_100px_rgba(0,0,0,0.1)]">
            <img 
              src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=1974" 
              alt="Beach" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506929199175-60903ee89234?auto=format&fit=crop&q=80&w=1974';
              }}
            />
          </div>
          <div className="absolute -bottom-12 -right-12 bg-white p-10 rounded-[40px] shadow-2xl border border-gray-50 hidden xl:block max-w-xs">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                <ShieldCheck size={24} />
              </div>
              <p className="font-black text-gray-900 text-lg leading-tight uppercase tracking-tight">Garantie de Sérénité</p>
              <p className="text-xs text-gray-400 font-medium leading-relaxed">Nous gérons les imprévus pour que vous puissiez profiter de l'essentiel.</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Testimonials - Editorial Touch */}
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center space-y-6 mb-20">
        <h2 className="text-accent font-black tracking-[0.4em] uppercase text-[10px]">Témoignages</h2>
        <h3 className="text-6xl font-black text-gray-900 tracking-tighter uppercase italic">Ils nous font confiance</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {[
          { name: "Amine K.", role: "Voyageur d'affaires", text: "Un service irréprochable. Afaf Voyages s'occupe de tout, de mon visa à mon hôtel, avec une réactivité exemplaire." },
          { name: "Sarah B.", role: "Touriste", text: "Ma famille et moi avons passé des vacances inoubliables en Turquie grâce à leurs conseils et leur organisation parfaite." },
          { name: "Karim M.", role: "Client régulier", text: "Les meilleurs tarifs pour les vols internationaux. Je ne passe plus que par eux pour mes déplacements." }
        ].map((t, i) => (
          <div key={i} className="space-y-8 p-10 bg-gray-50 rounded-[40px] relative">
            <div className="text-primary opacity-20 absolute top-8 left-8">
              <MessageCircle size={40} />
            </div>
            <p className="text-gray-600 italic text-lg leading-relaxed relative z-10">"{t.text}"</p>
            <div className="pt-6 border-t border-gray-200">
              <p className="font-black text-gray-900 uppercase tracking-tight">{t.name}</p>
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{t.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const ServicesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>(searchParams.get('type') || 'all');
  
  const services = [
    { id: 'all', title: 'Tous', icon: Search, color: 'text-gray-600', bg: 'bg-gray-100' },
    { id: 'air', title: 'Vols', icon: Plane, color: 'text-primary', bg: 'bg-primary/10' },
    { id: 'hotel', title: 'Hôtels', icon: Hotel, color: 'text-warm', bg: 'bg-warm/10' },
    { id: 'sea', title: 'Maritime', icon: Ship, color: 'text-accent', bg: 'bg-accent/10' },
    { id: 'visa', title: 'Visas', icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
    { id: 'organized-trip', title: 'Voyages Organisés', icon: Globe, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'omra', title: 'Omra', icon: Moon, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const filteredOffers = TRAVEL_OFFERS.filter(offer => {
    const matchesSearch = offer.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         offer.destination.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || offer.type === selectedType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase">Nos Offres & Services</h1>
        <p className="text-gray-500 max-w-xl mx-auto font-medium">Trouvez la meilleure offre pour votre prochain voyage avec Afaf Voyages.</p>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-8 rounded-[40px] shadow-xl border border-gray-50 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Rechercher une destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
            />
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            {services.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedType(s.id)}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  selectedType === s.id 
                    ? 'bg-primary text-white shadow-xl shadow-primary/30' 
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                <s.icon size={18} />
                {s.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <AnimatePresence mode="popLayout">
          {/* Special Flight Service Card - Always shown when 'air' or 'all' is selected */}
          {(selectedType === 'air' || selectedType === 'all' || selectedType === 'omra') && (
            <motion.div
              key="special-flight-card"
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`${selectedType === 'omra' ? 'bg-amber-900' : 'bg-gray-900'} rounded-[40px] p-10 space-y-8 text-white flex flex-col justify-between border border-white/10 relative overflow-hidden group`}
            >
              <div className={`absolute top-0 right-0 w-32 h-32 ${selectedType === 'omra' ? 'bg-amber-500/20' : 'bg-primary/20'} blur-3xl rounded-full -translate-y-1/2 translate-x-1/2`}></div>
              <div className="space-y-6 relative z-10">
                <div className={`w-16 h-16 ${selectedType === 'omra' ? 'bg-amber-500' : 'bg-primary'} rounded-2xl flex items-center justify-center`}>
                  {selectedType === 'omra' ? <Moon size={32} /> : <Plane size={32} />}
                </div>
                <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">
                  {selectedType === 'omra' ? 'Demande de' : 'Billetterie'} <br />
                  <span className="text-accent">{selectedType === 'omra' ? 'Visa Arabie Saoudite' : 'Aérienne'}</span>
                </h3>
                <p className="text-gray-400 font-medium leading-relaxed">
                  {selectedType === 'omra' 
                    ? "Nous facilitons l'obtention de votre visa pour l'Arabie Saoudite. Service rapide et fiable pour votre Omra ou voyage d'affaires."
                    : "Nous vous offrons un accès direct aux meilleures lignes mondiales. Vols nationaux et internationaux au meilleur prix garantis."}
                </p>
                <div className="space-y-3">
                  {(selectedType === 'omra' 
                    ? ['Visa Omra', 'Visa Touristique', 'Visa Business', 'Assistance complète']
                    : ['Air Algérie', 'Tassili Airlines', 'Turkish Airlines', 'Air France']
                  ).map((p, i) => (
                    <div key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-500">
                      <Check size={12} className="text-accent" /> {p}
                    </div>
                  ))}
                </div>
              </div>
              <Link 
                to={selectedType === 'omra' ? "/booking/visa?dest=Saudi Arabia" : "/booking/air"}
                className="w-full bg-white text-gray-900 py-5 rounded-2xl font-black uppercase tracking-widest text-center hover:bg-accent hover:text-white transition-all relative z-10"
              >
                {selectedType === 'omra' ? "Demander un visa" : "Réserver un vol"}
              </Link>
            </motion.div>
          )}

          {/* Special Hotel Service Card - Always shown when 'hotel' or 'all' is selected */}
          {(selectedType === 'hotel' || selectedType === 'all') && (
            <motion.div
              key="special-hotel-card"
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-warm rounded-[40px] p-10 space-y-8 text-white flex flex-col justify-between border border-white/10 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="space-y-6 relative z-10">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                  <Hotel size={32} />
                </div>
                <h3 className="text-3xl font-black tracking-tighter uppercase leading-none">
                  Hébergement <br />
                  <span className="text-gray-900">Mondial</span>
                </h3>
                <p className="text-white/80 font-medium leading-relaxed">
                  Accédez à plus de <span className="text-white font-bold">1 000 000 d'hôtels</span> à travers le monde. 
                  Nous garantissons les meilleurs tarifs pour tous vos séjours.
                </p>
                <div className="space-y-3">
                  {['Luxe & Palaces', 'Business Hotels', 'Resorts All-Inclusive', 'Appart-Hotels'].map((p, i) => (
                    <div key={i} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-white/60">
                      <Check size={12} className="text-white" /> {p}
                    </div>
                  ))}
                </div>
              </div>
              <Link 
                to="/booking/hotel"
                className="w-full bg-gray-900 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-center hover:bg-white hover:text-gray-900 transition-all relative z-10"
              >
                Réserver un hôtel
              </Link>
            </motion.div>
          )}

          {filteredOffers.map((offer) => (
            <motion.div
              layout
              key={offer.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group bg-white rounded-[40px] border border-gray-50 shadow-sm overflow-hidden hover:shadow-2xl transition-all"
            >
              <div className="relative h-60 overflow-hidden">
                <img 
                  src={offer.imageUrl} 
                  alt={offer.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://placehold.co/800x600/1B365D/FFFFFF?text=${offer.title}`;
                  }}
                />
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                  <div className="bg-white/90 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-primary shadow-sm">
                    {offer.type}
                  </div>
                  {offer.partner && (
                    <div className="bg-gray-900/80 backdrop-blur px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
                      {offer.partner}
                    </div>
                  )}
                </div>
                {offer.rating && (
                  <div className="absolute top-6 right-6 bg-warm text-white px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-lg">
                    <Star size={12} fill="currentColor" /> {offer.rating}
                  </div>
                )}
              </div>
              <div className="p-8 space-y-5">
                <div>
                  <h3 className="font-black text-gray-900 text-xl group-hover:text-primary transition-colors uppercase tracking-tight">{offer.title}</h3>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2 mt-2">
                    <MapPin size={14} className="text-accent" /> {offer.destination}
                  </p>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed font-medium">
                  {offer.description}
                </p>

                {/* Dates & Duration */}
                {(offer.startDate || offer.endDate || offer.duration) && (
                  <div className="flex items-center gap-4 py-3 border-y border-gray-50">
                    {(offer.startDate || offer.endDate) && (
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500">
                        <Calendar size={14} className="text-primary" />
                        {offer.startDate && new Date(offer.startDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        {offer.startDate && offer.endDate && ' - '}
                        {offer.endDate && new Date(offer.endDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                      </div>
                    )}
                    {(offer.duration || (offer.startDate && offer.endDate)) && (
                      <div className="ml-auto bg-gray-50 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400">
                        {offer.duration ? offer.duration : `${Math.ceil((new Date(offer.endDate!).getTime() - new Date(offer.startDate!).getTime()) / (1000 * 60 * 60 * 24))} Jours`}
                      </div>
                    )}
                  </div>
                )}

                {/* Amenities */}
                {offer.amenities && offer.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {offer.amenities.map((amenity, idx) => (
                      <span key={idx} className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        <Check size={10} /> {amenity}
                      </span>
                    ))}
                  </div>
                )}

                <div className="pt-6 border-t border-gray-50 flex items-center justify-end">
                  <Link 
                    to={`/booking/${offer.type}?dest=${encodeURIComponent(offer.destination)}`}
                    className="bg-gray-900 text-white px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-accent transition-all shadow-lg hover:shadow-accent/20"
                  >
                    Réserver
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredOffers.length === 0 && (
        <div className="text-center py-20 space-y-4">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-300">
            <Search size={40} />
          </div>
          <p className="text-gray-500 font-medium">Aucune offre ne correspond à vos critères.</p>
          <button 
            onClick={() => { setSearchTerm(''); setSelectedType('all'); }}
            className="text-primary font-black text-[10px] uppercase tracking-widest hover:underline"
          >
            Réinitialiser les filtres
          </button>
        </div>
      )}
    </div>
  );
};

const BookingFormPage = ({ user }: { user: FirebaseUser | null }) => {
  const { type } = useParams<{ type: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const initialDestination = searchParams.get('dest') || '';

  const serviceTitles: Record<string, string> = {
    air: 'Billet d\'Avion',
    sea: 'Traversée Maritime',
    hotel: 'Hôtel',
    visa: 'Assistance Visa',
    'organized-trip': 'Voyage Organisé',
    omra: 'Omra'
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) {
      toast.error('Veuillez vous connecter pour soumettre une demande.');
      navigate('/login');
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      let passportUrl = '';
      if (file) {
        const storageRef = ref(storage, `passports/${user.uid}/${Date.now()}_${file.name}`);
        const uploadResult = await uploadBytes(storageRef, file);
        passportUrl = await getDownloadURL(uploadResult.ref);
      }

      const bookingData = {
        uid: user.uid,
        serviceType: type as ServiceType,
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        dob: formData.get('dob'),
        destination: formData.get('destination'),
        passportScanUrl: passportUrl,
        status: 'pending',
        createdAt: Timestamp.now(),
      };

      await addDoc(collection(db, 'bookings'), bookingData);
      toast.success('Votre demande a été soumise avec succès !');
      navigate('/track');
    } catch (error) {
      console.error(error);
      toast.error('Une erreur est survenue lors de la soumission.');
    } finally {
      setLoading(false);
    }
  };

  const visaCountries = [
    "United Arab Emirates",
    "Lebanon",
    "Indonesia",
    "Egypt",
    "China",
    "Bangladesh",
    "Japan",
    "Jordan",
    "Turkey",
    "Oman",
    "Qatar",
    "Azerbaijan",
    "Singapore",
    "Armenia",
    "Uzbekistan",
    "Ethiopia",
    "Madagascar"
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 py-24">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-[40px] shadow-2xl border border-gray-50 overflow-hidden"
      >
        <div className="bg-primary p-10 text-white">
          <h1 className="text-3xl font-black uppercase tracking-tight">Demande de {serviceTitles[type || ''] || 'Service'}</h1>
          <p className="text-white/70 text-xs font-bold uppercase tracking-widest mt-2">Veuillez remplir le formulaire ci-dessous avec précision.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Nom</label>
              <input 
                name="lastName" 
                required 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                placeholder="Votre nom"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Prénom</label>
              <input 
                name="firstName" 
                required 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                placeholder="Votre prénom"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Date de naissance</label>
              <input 
                name="dob" 
                type="date" 
                required 
                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Destination / Offre</label>
              {type === 'visa' ? (
                <select 
                  name="destination" 
                  required 
                  defaultValue={initialDestination}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary outline-none transition-all font-medium appearance-none"
                >
                  <option value="" disabled>Sélectionnez un pays</option>
                  {visaCountries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
              ) : (
                <>
                  <input 
                    name="destination" 
                    list="destinations-list"
                    required 
                    defaultValue={initialDestination}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-primary outline-none transition-all font-medium"
                    placeholder="Ex: Paris, France"
                  />
                  {type === 'air' && (
                    <datalist id="destinations-list">
                      {FLIGHT_ROUTES.map((line, idx) => (
                        <option key={idx} value={`${line.from} - ${line.to} (${line.airline})`} />
                      ))}
                    </datalist>
                  )}
                  {type === 'hotel' && (
                    <datalist id="destinations-list">
                      {TRAVEL_OFFERS.filter(o => o.type === 'hotel').map((o, idx) => (
                        <option key={idx} value={o.destination} />
                      ))}
                      <option value="Dubaï, Émirats Arabes Unis" />
                      <option value="Paris, France" />
                      <option value="Istanbul, Turquie" />
                      <option value="Kuala Lumpur, Malaisie" />
                      <option value="New York, USA" />
                      <option value="Charm el-Cheikh, Égypte" />
                    </datalist>
                  )}
                  {type === 'omra' && (
                    <datalist id="destinations-list">
                      <option value="Omra Premium 2026 (15 Jours)" />
                      <option value="Omra Économique 2026 (15 Jours)" />
                      <option value="Omra Ramadan 2026" />
                    </datalist>
                  )}
                  {type === 'organized-trip' && (
                    <datalist id="destinations-list">
                      {TRAVEL_OFFERS.filter(o => o.type === 'organized-trip').map((o, idx) => (
                        <option key={idx} value={o.title} />
                      ))}
                    </datalist>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scan du Passeport (PDF/JPG)</label>
            <div className="relative border-2 border-dashed border-gray-100 rounded-[32px] p-10 text-center hover:border-primary transition-colors cursor-pointer group bg-gray-50/50">
              <input 
                type="file" 
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="space-y-3">
                <FileText className="mx-auto text-gray-300 group-hover:text-primary transition-colors" size={40} />
                <p className="text-sm text-gray-500 font-bold">
                  {file ? file.name : "Cliquez ou glissez votre fichier ici"}
                </p>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Max 5MB</p>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-primary text-white py-5 rounded-2xl font-black uppercase tracking-widest text-lg hover:bg-secondary transition-all shadow-2xl shadow-primary/30 flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={24} />
                Envoi en cours...
              </>
            ) : (
              'Soumettre ma demande'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const TrackRequestPage = ({ user }: { user: FirebaseUser | null }) => {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'bookings'),
      where('uid', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookingRequest));
      setBookings(data);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'in-progress': return 'bg-primary/10 text-primary border-primary/20';
      case 'confirmed': return 'bg-green-100 text-green-700 border-green-200';
      case 'action-needed': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'in-progress': return 'En cours';
      case 'confirmed': return 'Confirmé';
      case 'action-needed': return 'Action requise';
      default: return status;
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-400">
          <Search size={40} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Suivre ma demande</h1>
        <p className="text-gray-500">Veuillez vous connecter pour voir vos demandes en cours.</p>
        <Link to="/login" className="inline-block bg-primary text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/20">Connexion</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 space-y-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold text-gray-900">Mes Demandes</h1>
        <p className="text-gray-500">Suivez l'état de vos réservations en temps réel.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-primary" size={48} />
        </div>
      ) : bookings.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm">
          <p className="text-gray-500">Vous n'avez aucune demande pour le moment.</p>
          <Link to="/services" className="text-primary font-black uppercase tracking-widest text-[10px] mt-4 inline-block hover:underline">Commencer un voyage</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {bookings.map((booking) => (
            <motion.div 
              key={booking.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary">
                  {booking.serviceType === 'air' && <Plane size={28} />}
                  {booking.serviceType === 'sea' && <Ship size={28} />}
                  {booking.serviceType === 'hotel' && <Hotel size={28} />}
                  {booking.serviceType === 'visa' && <FileText size={28} />}
                  {booking.serviceType === 'organized-trip' && <Globe size={28} />}
                  {booking.serviceType === 'omra' && <Moon size={28} />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 capitalize">{booking.serviceType} - {booking.destination}</h3>
                  <p className="text-xs text-gray-500">Soumis le {booking.createdAt?.toDate().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${getStatusColor(booking.status)}`}>
                  {getStatusLabel(booking.status)}
                </span>
                {booking.adminNotes && booking.adminNotes.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                    <AlertCircle size={14} className="text-orange-500" />
                    Note: {booking.adminNotes[booking.adminNotes.length - 1].text}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const AdminDashboardPage = ({ profile }: { profile: UserProfile | null }) => {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortField, setSortField] = useState<'name' | 'createdAt' | 'updatedAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    if (profile && profile.role !== 'admin') {
      navigate('/');
      return;
    }

    const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BookingRequest));
      setBookings(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile, navigate]);

  const filteredAndSortedBookings = useMemo(() => {
    let result = [...bookings];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(b => 
        `${b.firstName} ${b.lastName}`.toLowerCase().includes(term) ||
        b.email.toLowerCase().includes(term) ||
        b.destination.toLowerCase().includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(b => b.status === statusFilter);
    }

    // Service filter
    if (serviceFilter !== 'all') {
      result = result.filter(b => b.serviceType === serviceFilter);
    }

    // Sorting
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

  if (!profile || profile.role !== 'admin') return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 space-y-12">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Tableau de Bord Admin</h1>
          <p className="text-gray-500">Gérez les demandes de réservation entrantes.</p>
        </div>
        <div className="bg-primary/10 text-primary px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest border border-primary/20">
          {bookings.length} Demandes au total
        </div>
      </div>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher un client..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm appearance-none"
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
          className="w-full px-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm appearance-none"
        >
          <option value="all">Tous les services</option>
          <option value="visa">Visa</option>
          <option value="flight">Vol</option>
          <option value="hotel">Hôtel</option>
          <option value="package">Package</option>
        </select>
        <button 
          onClick={() => { setSearchTerm(''); setStatusFilter('all'); setServiceFilter('all'); }}
          className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-2xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
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
                    {b.passportScanUrl ? (
                      <a 
                        href={b.passportScanUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-primary hover:underline text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                      >
                        <FileText size={14} /> Voir
                      </a>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Aucun</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <select 
                      value={b.status}
                      onChange={(e) => updateStatus(b.id, e.target.value as BookingStatus)}
                      className="text-xs bg-gray-100 border-none rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-primary"
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
                        className="p-2 text-gray-400 hover:text-primary transition-colors relative"
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
  );
};

const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user profile exists
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const isAdminEmail = user.email === 'afafvoyage54@gmail.com';
      
      if (!userDoc.exists()) {
        const profile: UserProfile = {
          uid: user.uid,
          displayName: user.displayName || 'Utilisateur',
          email: user.email || '',
          role: isAdminEmail ? 'admin' : 'client',
          createdAt: Timestamp.now(),
        };
        await setDoc(doc(db, 'users', user.uid), profile);
      } else if (isAdminEmail && userDoc.data()?.role !== 'admin') {
        // Ensure bootstrapped admin has the correct role in their profile
        await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
      }
      
      toast.success('Connexion réussie !');
      navigate('/');
    } catch (error) {
      console.error(error);
      toast.error('Erreur lors de la connexion avec Google.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (isSignUp && !name)) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    
    setLoading(true);
    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const user = result.user;
        const isAdminEmail = user.email === 'afafvoyage54@gmail.com';
        
        const profile: UserProfile = {
          uid: user.uid,
          displayName: name,
          email: user.email || '',
          role: isAdminEmail ? 'admin' : 'client',
          createdAt: Timestamp.now(),
        };
        await setDoc(doc(db, 'users', user.uid), profile);
        toast.success('Compte créé avec succès !');
      } else {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const isAdminEmail = user.email === 'afafvoyage54@gmail.com';
        
        if (isAdminEmail && userDoc.exists() && userDoc.data()?.role !== 'admin') {
          await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
        }
        toast.success('Connexion réussie !');
      }
      navigate('/');
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Cet email est déjà utilisé.');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        toast.error('Email ou mot de passe incorrect.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Le mot de passe doit contenir au moins 6 caractères.');
      } else {
        toast.error(isSignUp ? 'Erreur lors de la création du compte.' : 'Erreur lors de la connexion.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white p-10 rounded-3xl shadow-2xl border border-gray-100 text-center space-y-8"
      >
        <img 
          src="/logo.png" 
          alt="Afaf Voyages" 
          className="h-24 w-auto mx-auto mb-4" 
          referrerPolicy="no-referrer"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/200x80/1B365D/FFFFFF?text=Afaf+Voyages';
          }}
        />
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">{isSignUp ? 'Créer un compte' : 'Bienvenue'}</h1>
          <p className="text-gray-500">
            {isSignUp ? 'Inscrivez-vous pour commencer.' : 'Connectez-vous pour accéder à vos services de voyage.'}
          </p>
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          {isSignUp && (
            <input
              type="text"
              placeholder="Nom complet"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
            />
          )}
          <input
            type="email"
            placeholder="Adresse email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
          />
          <input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-primary outline-none transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white py-4 rounded-xl font-bold hover:bg-secondary transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isSignUp ? "S'inscrire" : "Se connecter"}
          </button>
        </form>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-gray-200"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-bold">OU</span>
          <div className="flex-grow border-t border-gray-200"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center gap-4 bg-white border border-gray-200 py-4 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow-md disabled:opacity-50"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-6 h-6" />
          Continuer avec Google
        </button>

        <p className="text-sm text-gray-500 mt-6">
          {isSignUp ? 'Déjà un compte ?' : "Vous n'avez pas de compte ?"}
          <button 
            type="button"
            onClick={() => setIsSignUp(!isSignUp)} 
            className="ml-1 text-primary font-bold hover:underline"
          >
            {isSignUp ? 'Se connecter' : "S'inscrire"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            let profileData = userDoc.data() as UserProfile;
            // Auto-upgrade bootstrapped admin if needed
            if (user.email === 'afafvoyage54@gmail.com' && profileData.role !== 'admin') {
              await updateDoc(doc(db, 'users', user.uid), { role: 'admin' });
              profileData.role = 'admin';
            }
            setProfile(profileData);
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="space-y-6 text-center">
          <img src="/logo.png" alt="Afaf Voyages" className="h-24 w-auto animate-pulse mx-auto" referrerPolicy="no-referrer" />
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-500 font-medium animate-pulse">Chargement d'Afaf Voyages...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-white flex flex-col font-sans selection:bg-primary/10 selection:text-primary">
        <Navbar user={user} profile={profile} />
        
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/booking/:type" element={<BookingFormPage user={user} />} />
            <Route path="/track" element={<TrackRequestPage user={user} />} />
            <Route path="/admin" element={<AdminDashboardPage profile={profile} />} />
            <Route path="/login" element={<LoginPage />} />
          </Routes>
        </main>

        <Footer />
        
        {/* WhatsApp Floating Button */}
        <div className="fixed bottom-24 right-6 flex flex-col gap-3 z-50">
          <a 
            href="https://wa.me/213781949667" 
            target="_blank" 
            rel="noreferrer"
            className="bg-green-500 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-green-600 transition-all hover:scale-110 active:scale-95 group"
            title="Contactez-nous sur WhatsApp (+213 781 94 96 67)"
          >
            <Phone size={24} />
          </a>
          <a 
            href="https://wa.me/213551372722" 
            target="_blank" 
            rel="noreferrer"
            className="bg-green-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-green-700 transition-all hover:scale-110 active:scale-95 group"
            title="Contactez-nous sur WhatsApp (+213 551 37 27 22)"
          >
            <Phone size={24} />
          </a>
        </div>

        <Chatbot />
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
}
