import { BookingRequest, Appointment, ContactMessage } from '../types';

export interface SpreadsheetMetadata {
  id: string;
  title: string;
  url: string;
}

export const AFAF_SHEET_TITLE = 'Afaf Voyages - Données Clients & Réservations';

const BOOKING_HEADERS = [
  'ID Réservation',
  'Date de Demande',
  'Nom',
  'Prénom',
  'Email',
  'Téléphone',
  'Date de Naissance',
  'Service',
  'Destination / Offre',
  'Date Aller',
  'Date Retour',
  'Statut',
  'Lien Scan Passeport',
  'Notes Internes'
];

const APPOINTMENT_HEADERS = [
  'ID Rendez-vous',
  'Date du RDV',
  'Créneau Horaire',
  'Nom Client',
  'Téléphone',
  'Email',
  'Mode de RDV',
  'Intérêt / Destination',
  'Message Client',
  'Statut',
  'Date de Demande'
];

const MESSAGE_HEADERS = [
  'ID Message',
  'Date Réception',
  'Nom Client',
  'Email',
  'Téléphone',
  'Sujet',
  'Message',
  'Statut'
];

/**
 * Searches user's Google Drive for an existing Afaf Voyages spreadsheet
 */
export const findExistingSpreadsheet = async (accessToken: string): Promise<SpreadsheetMetadata | null> => {
  try {
    const query = encodeURIComponent(`mimeType='application/vnd.google-apps.spreadsheet' and name='${AFAF_SHEET_TITLE}' and trashed=false`);
    const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,webViewLink)`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn("Drive search warning:", err);
      return null;
    }

    const data = await res.json();
    if (data.files && data.files.length > 0) {
      return {
        id: data.files[0].id,
        title: data.files[0].name,
        url: data.files[0].webViewLink || `https://docs.google.com/spreadsheets/d/${data.files[0].id}/edit`,
      };
    }
    return null;
  } catch (error) {
    console.error("Error searching spreadsheet:", error);
    return null;
  }
};

/**
 * Creates a brand-new structured spreadsheet with styled tabs for Afaf Voyages
 */
export const createAfafSpreadsheet = async (accessToken: string): Promise<SpreadsheetMetadata> => {
  const body = {
    properties: {
      title: AFAF_SHEET_TITLE,
    },
    sheets: [
      {
        properties: {
          title: 'Réservations Clients',
          gridProperties: {
            frozenRowCount: 1,
            columnCount: BOOKING_HEADERS.length + 2,
          },
        },
      },
      {
        properties: {
          title: 'Rendez-vous Clients',
          gridProperties: {
            frozenRowCount: 1,
            columnCount: APPOINTMENT_HEADERS.length + 2,
          },
        },
      },
      {
        properties: {
          title: 'Messages Contacts',
          gridProperties: {
            frozenRowCount: 1,
            columnCount: MESSAGE_HEADERS.length + 2,
          },
        },
      },
    ],
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(`Erreur Google Sheets (${res.status}): ${errorData?.error?.message || 'Impossible de créer la feuille'}`);
  }

  const sheetData = await res.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // Initialize headers with styling
  await initializeHeaders(accessToken, spreadsheetId, sheetData.sheets);

  return {
    id: spreadsheetId,
    title: AFAF_SHEET_TITLE,
    url: spreadsheetUrl,
  };
};

/**
 * Populates header rows in all tabs with brand styling
 */
const initializeHeaders = async (accessToken: string, spreadsheetId: string, sheets: any[]) => {
  // 1. Write header text
  const valueData = [
    {
      range: "'Réservations Clients'!A1",
      values: [BOOKING_HEADERS],
    },
    {
      range: "'Rendez-vous Clients'!A1",
      values: [APPOINTMENT_HEADERS],
    },
    {
      range: "'Messages Contacts'!A1",
      values: [MESSAGE_HEADERS],
    },
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      valueInputOption: 'USER_ENTERED',
      data: valueData,
    }),
  });

  // 2. Format header rows: Navy blue background (#305AA2) and white bold text
  try {
    const requests = sheets.map(sheet => ({
      repeatCell: {
        range: {
          sheetId: sheet.properties.sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 48 / 255, green: 90 / 255, blue: 162 / 255 }, // Brand primary
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontSize: 10,
            },
            horizontalAlignment: 'CENTER',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
      },
    }));

    await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests }),
    });
  } catch (err) {
    console.warn("Could not apply style formatting to headers, continuing:", err);
  }
};

/**
 * Formats a booking item to spreadsheet columns
 */
const bookingToRow = (b: BookingRequest): any[] => {
  const dateStr = b.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '';
  const notes = (b.adminNotes || []).map(n => `[${n.author || 'Admin'}]: ${n.text}`).join(' | ');

  return [
    b.id,
    dateStr,
    b.lastName || '',
    b.firstName || '',
    b.email || '',
    (b as any).phone || '',
    b.dob || '',
    b.serviceType || '',
    b.destination || '',
    b.departureDate || '',
    b.returnDate || '',
    b.status || 'pending',
    b.passportScanUrl || '',
    notes,
  ];
};

/**
 * Formats an appointment item to spreadsheet columns
 */
const appointmentToRow = (a: Appointment): any[] => {
  const reqDate = a.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '';
  const typeLabel = a.type === 'agency' ? 'En Agence' : a.type === 'video' ? 'Appel Vidéo' : 'Téléphone';
  return [
    a.id,
    a.date || '',
    a.timeSlot || '',
    a.fullName || '',
    a.phone || '',
    a.email || '',
    typeLabel,
    a.serviceInterest || '',
    a.notes || '',
    a.status || 'pending',
    reqDate,
  ];
};

/**
 * Formats a message item to spreadsheet columns
 */
const messageToRow = (m: ContactMessage): any[] => {
  const dateStr = m.createdAt?.toDate?.()?.toLocaleDateString('fr-FR') || '';
  return [
    m.id,
    dateStr,
    m.fullName || '',
    m.email || '',
    m.phone || '',
    m.subject || '',
    m.message || '',
    m.status || 'new',
  ];
};

/**
 * Exports/Syncs all bookings to Google Sheets
 */
export const syncBookingsToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  bookings: BookingRequest[]
): Promise<number> => {
  // Clear existing content starting from A2
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Réservations Clients'!A2:N1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (bookings.length === 0) return 0;

  const rows = bookings.map(bookingToRow);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Réservations Clients'!A2:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Erreur lors de la synchronisation des réservations.");
  }

  return rows.length;
};

/**
 * Exports/Syncs all appointments to Google Sheets
 */
export const syncAppointmentsToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  appointments: Appointment[]
): Promise<number> => {
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Rendez-vous Clients'!A2:K1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (appointments.length === 0) return 0;

  const rows = appointments.map(appointmentToRow);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Rendez-vous Clients'!A2:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Erreur lors de la synchronisation des rendez-vous.");
  }

  return rows.length;
};

/**
 * Exports/Syncs all contact messages to Google Sheets
 */
export const syncMessagesToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  messages: ContactMessage[]
): Promise<number> => {
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Messages Contacts'!A2:H1000:clear`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (messages.length === 0) return 0;

  const rows = messages.map(messageToRow);

  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Messages Contacts'!A2:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Erreur lors de la synchronisation des messages.");
  }

  return rows.length;
};

/**
 * Appends a newly created booking row directly into Google Sheets
 */
export const appendSingleBookingToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  booking: BookingRequest
): Promise<void> => {
  const row = bookingToRow(booking);
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Réservations Clients'!A2:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
};

/**
 * Appends a newly created appointment row directly into Google Sheets
 */
export const appendSingleAppointmentToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  appointment: Appointment
): Promise<void> => {
  const row = appointmentToRow(appointment);
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Rendez-vous Clients'!A2:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
};

/**
 * Appends a newly created message row directly into Google Sheets
 */
export const appendSingleMessageToSheet = async (
  accessToken: string,
  spreadsheetId: string,
  message: ContactMessage
): Promise<void> => {
  const row = messageToRow(message);
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'Messages Contacts'!A2:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values: [row] }),
    }
  );
};
