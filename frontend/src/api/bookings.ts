import client from "./client";

export interface Booking {
  id: number;
  user_id: number | null;
  tier_id: number;
  hold_id: number;
  quantity: number;
  created_at: string;
}

export const confirmBooking = async (hold_id: number): Promise<Booking> => {
  const response = await client.post<{ success: boolean; booking: Booking }>("/bookings", {
    hold_id,
  });
  return response.data.booking;
};

export interface BookingDetail extends Booking {
  tier_name: string;
  price: string;
  event_name: string;
  event_start_at: string;
  event_venue: string;
}

export const fetchBookings = async (): Promise<BookingDetail[]> => {
  const response = await client.get<{ success: boolean; bookings: BookingDetail[] }>("/bookings");
  return response.data.bookings;
};