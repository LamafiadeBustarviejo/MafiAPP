export interface CalendarEvent {
  id: string;
  summary: string; // Título
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string; // Para eventos de todo el día
  };
  end: {
    dateTime?: string;
    date?: string;
  };
}

const CALENDAR_ID = import.meta.env.VITE_GOOGLE_CALENDAR_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_CALENDAR_API_KEY;

export const calendarService = {
  async getUpcomingEvents(): Promise<CalendarEvent[]> {
    if (!CALENDAR_ID || !API_KEY) {
      throw new Error('Faltan credenciales de Google Calendar');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timeMin = today.toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${API_KEY}&singleEvents=true&orderBy=startTime&timeMin=${timeMin}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Error de Google Calendar: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.items || [];
  }
};
