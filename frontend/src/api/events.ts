import client from "./client";

export type EventStatus = "draft" | "published" | "cancelled";

export interface Event {
  id: number;
  organizer_id: number;
  name: string;
  description: string | null;
  venue: string;
  start_at: string;
  status: EventStatus;
  created_at: string;
  updated_at: string;
}

export interface EventsResponse {
  success: boolean;
  events: Event[];
  page: number;
  limit: number;
  hasMore: boolean;
}

export const fetchEvents = async (page: number, limit: number): Promise<EventsResponse> => {
  const response = await client.get<EventsResponse>("/events", {
    params: { page, limit },
  });
  return response.data;
};

export interface Tier {
  id: number;
  event_id: number;
  name: string;
  price: string; // DECIMAL arrives as a string, e.g. "50.00"
  total_quantity: number;
  available_quantity: number;
  created_at: string;
  updated_at: string;
}

export const fetchEvent = async (id: number): Promise<Event> => {
  const response = await client.get<{ success: boolean; event: Event }>(`/events/${id}`);
  return response.data.event;
};

export const fetchTiers = async (eventId: number): Promise<Tier[]> => {
  const response = await client.get<{ success: boolean; tiers: Tier[] }>(
    `/events/${eventId}/ticket_tiers`
  );
  return response.data.tiers;
};