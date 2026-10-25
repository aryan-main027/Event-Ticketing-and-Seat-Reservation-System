import client from "./client";

export interface Hold {
  id: number;
  user_id: number;
  tier_id: number;
  quantity: number;
  status: "active" | "expired" | "converted";
  created_at: string;
  expiry_time: string;
}

export const createHold = async (tier_id: number, quantity: number): Promise<Hold> => {
  const response = await client.post<{ success: boolean; hold: Hold }>("/holds", {
    tier_id,
    quantity,
  });
  return response.data.hold;
};

export interface HoldDetail extends Hold {
  in_time: boolean; // computed by the database clock
}

export const fetchHold = async (id: number): Promise<HoldDetail> => {
  const response = await client.get<{ success: boolean; hold: HoldDetail }>(`/holds/${id}`);
  return response.data.hold;
};

export const fetchHolds = async (): Promise<HoldDetail[]> => {
  const response = await client.get<{ success: boolean; holds: HoldDetail[] }>("/holds");
  return response.data.holds;
};