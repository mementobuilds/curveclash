import { create } from "zustand";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  displayName: string;
  picture: string;
  provider: string;
}

interface AuthStoreState {
  user: AuthUser | null;
  isLoggedIn: boolean;
  setUser: (user: AuthUser | null) => void;
  setLoggedIn: (loggedIn: boolean) => void;
  logout: () => void;
}

const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  isLoggedIn: false,
  setUser: (user) => set({ user, isLoggedIn: !!user }),
  setLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
  logout: () => set({ user: null, isLoggedIn: false }),
}));

export default useAuthStore;
