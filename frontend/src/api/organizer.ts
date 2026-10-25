import client from "./client";
import type { Event, EventStatus } from "./events";

export interface TierStats {
  id: number;
  name: string;
  total_quantity: number;
  available_quantity: number;
  sold: number;
  held: number;
}

export const fetchMyEvents = async (): Promise<Event[]> => {
  const res = await client.get<{ success: boolean; events: Event[] }>("/events/mine");
  return res.data.events;
};

export const createEvent = async (data: {
  name: string;
  description?: string;
  venue: string;
  start_at: string;
}): Promise<Event> => {
  const res = await client.post<{ success: boolean; event: Event }>("/events", data);
  return res.data.event;
};

export const updateEventStatus = async (id: number, status: EventStatus): Promise<Event> => {
  const res = await client.patch<{ success: boolean; event: Event }>(`/events/${id}`, { status });
  return res.data.event;
};

export const createTier = async (
  eventId: number,
  data: { name: string; price: number; total_quantity: number }
) => {
  const res = await client.post(`/events/${eventId}/ticket_tiers`, data);
  return res.data.tier;
};

export const fetchStats = async (eventId: number): Promise<TierStats[]> => {
  const res = await client.get<{ success: boolean; tiers: TierStats[] }>(`/events/${eventId}/stats`);
  return res.data.tiers;
};