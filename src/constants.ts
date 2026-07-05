import { TravelOffer } from './types';

export const TRAVEL_OFFERS: TravelOffer[] = [
  {
    id: 'hotel-1',
    type: 'hotel',
    title: 'Sheraton Club des Pins',
    description: 'Séjour de luxe en bord de mer à Alger.',
    destination: 'Alger, Algérie',
    imageUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=800',
    rating: 5,
    startDate: '2026-04-15',
    endDate: '2026-04-20',
    amenities: ['Wifi gratuit', 'Piscine', 'Spa & Fitness', 'Petit-déjeuner inclus']
  },
  {
    id: 'hotel-2',
    type: 'hotel',
    title: 'Hôtel El Aurassi',
    description: 'Vue imprenable sur la baie d\'Alger.',
    destination: 'Alger, Algérie',
    imageUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
    rating: 5,
    startDate: '2026-05-01',
    endDate: '2026-05-05',
    amenities: ['Vue sur mer', 'Restaurant gastronomique', 'Parking gratuit', 'Room service']
  },
  {
    id: 'hotel-paris',
    type: 'hotel',
    title: 'Hôtel Ritz Paris',
    description: 'L\'élégance française au cœur de la Place Vendôme.',
    destination: 'Paris, France',
    imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800',
    rating: 5,
    startDate: '2026-06-10',
    endDate: '2026-06-15',
    amenities: ['Luxe absolu', 'Spa Chanel', 'Jardin privé', 'Tea time mythique']
  },
  {
    id: 'hotel-dubai',
    type: 'hotel',
    title: 'Burj Al Arab Jumeirah',
    description: 'L\'hôtel le plus luxueux au monde sur sa propre île.',
    destination: 'Dubaï, Émirats Arabes Unis',
    imageUrl: 'https://i.pinimg.com/736x/91/df/2e/91df2ed9c5470e3a6f0856575f53f345.jpg',
    rating: 5,
    startDate: '2026-09-01',
    endDate: '2026-09-07',
    amenities: ['Service majordome', 'Plage privée', 'Héliport', 'Aquarium']
  },
  {
    id: 'hotel-istanbul',
    type: 'hotel',
    title: 'Ciragan Palace Kempinski',
    description: 'Un palais ottoman sur les rives du Bosphore.',
    destination: 'Istanbul, Turquie',
    imageUrl: 'https://i.pinimg.com/736x/0b/3f/b0/0b3fb0c8016e618bfe93e73c32331cc1.jpg',
    rating: 5,
    startDate: '2026-05-15',
    endDate: '2026-05-20',
    amenities: ['Piscine à débordement', 'Hammam traditionnel', 'Petit-déjeuner royal', 'Vue Bosphore']
  },
  {
    id: 'hotel-kl',
    type: 'hotel',
    title: 'Mandarin Oriental KL',
    description: 'Vue spectaculaire sur les tours Petronas.',
    destination: 'Kuala Lumpur, Malaisie',
    imageUrl: 'https://images.pexels.com/photos/13672220/pexels-photo-13672220.jpeg',
    rating: 5,
    startDate: '2026-11-10',
    endDate: '2026-11-17',
    amenities: ['Piscine rooftop', 'Spa holistique', 'Accès direct au parc KLCC', 'Restaurants primés']
  },
  {
    id: 'hotel-ny',
    type: 'hotel',
    title: 'The Plaza Hotel',
    description: 'L\'icône de New York face à Central Park.',
    destination: 'New York, USA',
    imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80&w=800',
    rating: 5,
    startDate: '2026-12-20',
    endDate: '2026-12-27',
    amenities: ['The Palm Court', 'Butler service', 'Shopping de luxe', 'Fitness center']
  },
  {
    id: 'hotel-london',
    type: 'hotel',
    title: 'The Savoy',
    description: 'L\'hôtel le plus célèbre de Londres sur les rives de la Tamise.',
    destination: 'Londres, Royaume-Uni',
    imageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=800',
    rating: 5,
    startDate: '2026-07-05',
    endDate: '2026-07-12',
    amenities: ['Afternoon Tea', 'American Bar', 'Service majordome', 'Vue sur la Tamise']
  },
  {
    id: 'hotel-tokyo',
    type: 'hotel',
    title: 'Park Hyatt Tokyo',
    description: 'Une icône moderne offrant une vue imprenable sur le mont Fuji.',
    destination: 'Tokyo, Japon',
    imageUrl: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800',
    rating: 5,
    startDate: '2026-10-15',
    endDate: '2026-10-22',
    amenities: ['Piscine intérieure', 'Spa de luxe', 'New York Bar', 'Design sophistiqué']
  },
  {
    id: 'hotel-maldives',
    type: 'hotel',
    title: 'Soneva Jani',
    description: 'Villas sur pilotis avec toboggans privés dans un lagon turquoise.',
    destination: 'Maldives',
    imageUrl: 'https://images.unsplash.com/photo-1514282401047-d79a71a590e8?auto=format&fit=crop&q=80&w=800',
    rating: 5,
    startDate: '2026-02-10',
    endDate: '2026-02-17',
    amenities: ['Villa sur l\'eau', 'Cinéma sous les étoiles', 'Observatoire', 'Tout inclus']
  },
  {
    id: 'sea-1',
    type: 'sea',
    title: 'Traversée Alger - Marseille',
    description: 'Voyagez confortablement avec Algérie Ferries.',
    destination: 'Marseille, France',
    imageUrl: 'https://images.unsplash.com/photo-1548574505-5e239809ee19?auto=format&fit=crop&q=80&w=800',
    startDate: '2026-07-01',
    endDate: '2026-07-02',
    amenities: ['Cabine privée', 'Repas à bord', 'Transport véhicule', 'Espace détente']
  },
  {
    id: 'sea-2',
    type: 'sea',
    title: 'Traversée Oran - Alicante',
    description: 'La liaison la plus rapide vers l\'Espagne.',
    destination: 'Alicante, Espagne',
    imageUrl: 'https://images.unsplash.com/photo-1500514966906-fe245eea9344?auto=format&fit=crop&q=80&w=800',
    startDate: '2026-08-10',
    endDate: '2026-08-11',
    amenities: ['Fauteuil confort', 'Cafétéria', 'Boutique duty-free', 'Pont extérieur']
  },
  {
    id: 'visa-uae',
    type: 'visa',
    title: 'Visa Émirats Arabes Unis',
    description: 'Assistance complète pour votre visa touristique ou d\'affaires pour Dubaï et Abu Dhabi.',
    destination: 'United Arab Emirates',
    imageUrl: 'https://i.pinimg.com/736x/91/df/2e/91df2ed9c5470e3a6f0856575f53f345.jpg',
    amenities: ['Traitement 48h', 'Assurance incluse', 'Support 24/7']
  },
  {
    id: 'visa-turkey',
    type: 'visa',
    title: 'Visa Turquie',
    description: 'E-visa ou visa classique pour vos vacances ou voyages d\'affaires en Turquie.',
    destination: 'Turkey',
    imageUrl: 'https://i.pinimg.com/736x/0b/3f/b0/0b3fb0c8016e618bfe93e73c32331cc1.jpg',
    amenities: ['E-visa rapide', 'Assistance dossier', 'Paiement sécurisé']
  },
  {
    id: 'visa-egypt',
    type: 'visa',
    title: 'Visa Égypte',
    description: 'Explorez les pyramides avec notre service d\'assistance visa rapide.',
    destination: 'Egypt',
    imageUrl: 'https://i.pinimg.com/736x/ea/77/e6/ea77e6b28d3c330c8da3e2c565cb3da3.jpg',
    amenities: ['Visa à l\'arrivée', 'Conseils voyage', 'Support WhatsApp']
  },
  {
    id: 'visa-china',
    type: 'visa',
    title: 'Visa Chine',
    description: 'Assistance pour vos demandes de visa touristique (L) ou d\'affaires (M) pour la Chine.',
    destination: 'China',
    imageUrl: 'https://images.unsplash.com/photo-1508197149814-0cc02e8b7f74?auto=format&fit=crop&q=80&w=800',
    amenities: ['Prise de RDV', 'Remplissage formulaire', 'Vérification documents']
  },
  {
    id: 'trip-malaysia',
    type: 'organized-trip',
    title: 'Évasion Malaisie',
    description: 'Un voyage inoubliable entre modernité à KL et plages paradisiaques à Langkawi.',
    destination: 'Malaisie',
    imageUrl: 'https://i.pinimg.com/1200x/2e/1a/93/2e1a93a0250c4a768b82e708b53e7364.jpg',
    startDate: '2026-08-05',
    endDate: '2026-08-15',
    amenities: ['Vols inclus', 'Hôtels 4*', 'Petit-déjeuner', 'Excursions']
  },
  {
    id: 'trip-azerbaijan',
    type: 'organized-trip',
    title: 'AZERBAÏDJAN – BAKU & GABALA',
    description: 'Séjour 8 jours / 7 nuits – Départ d’Alger. Découvrez la perle du Caucase.',
    destination: 'Azerbaïdjan',
    imageUrl: 'https://i.pinimg.com/736x/be/75/47/be7547c4ec579eccfb0d474defeca23c.jpg',
    amenities: ['8 jours / 7 nuits', 'Départ d’Alger', 'Baku & Gabala', 'Hôtels 4*']
  },
  {
    id: 'trip-tunisia',
    type: 'organized-trip',
    title: 'Tunisie (Sousse & Hammamet)',
    description: '7 nuits / 8 jours (départ Oran). Profitez des plages dorées de la Tunisie.',
    destination: 'Tunisie',
    imageUrl: 'https://i.pinimg.com/1200x/d4/90/ab/d490abe887f165431e9222eb69f5fd1a.jpg',
    amenities: ['7 nuits / 8 jours', 'Départ Oran', 'Sousse & Hammamet', 'Demi-pension']
  },
  {
    id: 'trip-egypt',
    type: 'organized-trip',
    title: 'Égypte (Le Caire & Sharm El Sheikh)',
    description: '8 jours / 7 nuits (départ Alger). Un mélange parfait d\'histoire et de détente.',
    destination: 'Égypte',
    imageUrl: 'https://i.pinimg.com/736x/ea/77/e6/ea77e6b28d3c330c8da3e2c565cb3da3.jpg',
    amenities: ['8 jours / 7 nuits', 'Départ Alger', 'Le Caire & Sharm', 'Vols inclus']
  },
  {
    id: 'trip-malaysia-long',
    type: 'organized-trip',
    title: 'Malaisie (Kuala Lumpur & Langkawi)',
    description: '10 nuits / 12 jours depuis Alger. Une évasion tropicale complète.',
    destination: 'Malaisie',
    imageUrl: 'https://i.pinimg.com/1200x/2e/1a/93/2e1a93a0250c4a768b82e708b53e7364.jpg',
    amenities: ['10 nuits / 12 jours', 'Départ Alger', 'KL & Langkawi', 'Hôtels 4*/5*']
  },
  {
    id: 'trip-dubai-doha',
    type: 'organized-trip',
    title: 'Dubaï',
    description: 'Découvrez le luxe et la modernité de la perle des Émirats.',
    destination: 'Dubaï',
    imageUrl: 'https://i.pinimg.com/736x/91/df/2e/91df2ed9c5470e3a6f0856575f53f345.jpg',
    amenities: ['Vols inclus', 'Hôtels de luxe', 'Visites incluses', 'Transferts']
  },
  {
    id: 'trip-qatar',
    type: 'organized-trip',
    title: 'Qatar',
    description: 'Une destination fascinante alliant tradition et futurisme.',
    destination: 'Qatar',
    imageUrl: 'https://i.pinimg.com/1200x/b0/f6/85/b0f6851b1831e6c3a9938d7be68ef71f.jpg',
    amenities: ['Doha City Tour', 'Désert Safari', 'Hôtels 5*', 'Transferts']
  },
  {
    id: 'trip-oman',
    type: 'organized-trip',
    title: 'Oman',
    description: 'Découvrez la beauté sauvage et l\'authenticité du Sultanat d\'Oman.',
    destination: 'Oman',
    imageUrl: 'https://i.pinimg.com/736x/02/88/6b/02886b30792b999a5da9381ee7fede13.jpg',
    amenities: ['Mascate', 'Wadis & Désert', 'Nature préservée', 'Guide local']
  },
  {
    id: 'omra-premium',
    type: 'omra',
    title: 'Omra Premium 2026',
    description: 'Vivez une expérience spirituelle unique avec nos forfaits Omra haut de gamme. Accompagnement complet et hôtels de prestige.',
    destination: 'Arabie Saoudite',
    imageUrl: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&q=80&w=800',
    duration: '15 Jours',
    amenities: ['Hôtels proches Haram', 'Visa Omra', 'Vols directs', 'Accompagnement religieux']
  },
  {
    id: 'omra-eco',
    type: 'omra',
    title: 'Omra Économique 2026',
    description: 'Une Omra accessible avec un excellent rapport qualité-prix. Hébergement confortable et assistance complète.',
    destination: 'Arabie Saoudite',
    imageUrl: 'https://i.pinimg.com/736x/05/09/ee/0509eee1e7cacc7b5821c6d3cf676b17.jpg',
    duration: '15 Jours',
    amenities: ['Hôtels 3* ou 4*', 'Visa Omra', 'vol avec escale', 'Assistance 24/7']
  }
];

export const FLIGHT_ROUTES = [
  { from: 'Alger', to: 'Paris', airline: 'Air Algérie' },
  { from: 'Alger', to: 'Istanbul', airline: 'Turkish Airlines' },
  { from: 'Alger', to: 'Dubaï', airline: 'Emirates' },
  { from: 'Alger', to: 'Londres', airline: 'Air France' },
  { from: 'Alger', to: 'Rome', airline: 'ITA Airways' },
  { from: 'Alger', to: 'Kuala Lumpur', airline: 'Qatar Airways' },
  { from: 'Alger', to: 'New York', airline: 'Air France' },
  { from: 'Alger', to: 'Madrid', airline: 'Vueling' },
  { from: 'Oran', to: 'Marseille', airline: 'Air Algérie' },
  { from: 'Oran', to: 'Alicante', airline: 'Air Algérie' },
  { from: 'Alger', to: 'Marseille', airline: 'Air Algérie' },
  { from: 'Oran', to: 'Alger', airline: 'Air Algérie' },
  { from: 'Oran', to: 'Annaba', airline: 'Air Algérie' },
  { from: 'Oran', to: 'Constantine', airline: 'Air Algérie' },
  { from: 'Oran', to: 'Tamanrasset', airline: 'Air Algérie' },
  { from: 'Oran', to: 'Sétif', airline: 'Tassili Airlines' },
  { from: 'Alger', to: 'Sétif', airline: 'Air Algérie' },
  { from: 'Alger', to: 'Adrar', airline: 'Air Algérie' },
  { from: 'Alger', to: 'Béchar', airline: 'Air Algérie' },
];

export const AIRLINE_CAMPAIGNS = [
  { name: 'Air Algérie', logo: 'https://1000logos.net/wp-content/uploads/2023/05/Air-Algerie-Logo-768x432.png' },
  { name: 'Air France', logo: 'https://1000logos.net/wp-content/uploads/2020/03/Air-France-Logo-640x400.png' },
  { name: 'Turkish Airlines', logo: 'https://1000logos.net/wp-content/uploads/2020/04/Turkish_Airlines_logo-1024x576.png' },
  { name: 'Tunisair', logo: 'https://1000logos.net/wp-content/uploads/2021/02/Tunisair-logo-768x492.png' },
  { name: 'Swiss Air', logo: 'https://1000logos.net/wp-content/uploads/2021/04/Swiss-International-Air-Lines-logo-768x461.png' },
  { name: 'Qatar Airways', logo: 'https://1000logos.net/wp-content/uploads/2020/03/Qatar-Airways-Logo-640x400.png' },
  { name: 'Emirates', logo: 'https://1000logos.net/wp-content/uploads/2020/03/Emirates-Logo-640x400.png' },
  { name: 'Vueling', logo: 'https://1000logos.net/wp-content/uploads/2021/04/Vueling-Airlines-logo-768x432.png' },
  { name: 'Volotea', logo: 'https://1000logos.net/wp-content/uploads/2021/02/Volotea-logo-768x415.png' },
];

export const SEA_CAMPAIGNS = [
  { name: 'BALEARIA', logo: 'https://tse4.mm.bing.net/th/id/OIP.WkaOk3_zM_O-Q8IQn2G1bgHaHa?rs=1&pid=ImgDetMain&o=7&rm=3' },
  { name: 'Nouris Elbahr Ferries', logo: 'https://tse2.mm.bing.net/th/id/OIP.KAJDYPhnsUkQ0cbgfP1OmAHaHa?rs=1&pid=ImgDetMain&o=7&rm=3' },
];
