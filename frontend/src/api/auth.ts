import type { User } from "../store/authStore";
import client from "./client";

interface AuthResponse {
  success: boolean;
  user: User;
}

export interface RegisteredUser {
  id: number;
  name: string;
  email: string;
}

interface RegisterResponse {
  success: boolean;
  user: RegisteredUser;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
  role: "ORGANIZER" | "ATTENDEE";
}

export const fetchMe = async (): Promise<User> => {
  const response = await client.get<AuthResponse>("/auth/me");
  return response.data.user;
};

export const login = async (credentials: LoginCredentials): Promise<User> => {
  const response = await client.post<AuthResponse>("/auth/login", credentials);
  return response.data.user;
};

export const register = async (credentials: RegisterCredentials): Promise<RegisteredUser> => {
  const response = await client.post<RegisterResponse>("/auth/register", credentials);
  return response.data.user;
};

export const logout = async (): Promise<void> => {
  await client.post("/auth/logout");
};