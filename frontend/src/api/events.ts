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