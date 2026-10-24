import {create} from 'zustand';

export interface User{
  id : number;
  name : string;
  email : string;
  role : "ORGANIZER" | "ATTENDEE";
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

// No token here: the browser keeps it in the httpOnly cookie.
// No `persist` middleware either, because the cookie already survives a refresh.
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
}));