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