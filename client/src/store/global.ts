import { create } from 'zustand';
// import { localKey } from '../lib/api';

export interface NavStack {
  title: string;
  path: string;
}

// interface UserStore {
//   token: string | null;
//   setToken: (token: string) => void;
//   tenantId: string | null;
//   setTenantId: (tenantId: string) => void;
// }

// export const userStore = create<UserStore>((set) => ({
//   token: localStorage.getItem(localKey.token) || null,
//   setToken: (token) => set({ token }),
//   tenantId: null,
//   setTenantId: (tenantId) => set({ tenantId }),
// }));

interface NavigationStore {
  navStack: NavStack[];
  setNavStack: (navStack: NavStack[]) => void;
  safeSetNavStack: (navStack: NavStack[]) => void;
}

export const useNavigationStore = create<NavigationStore>((set) => ({
  navStack: [],
  setNavStack: (navStack) => set({ navStack }),
  safeSetNavStack: (navStack) => {
    if (navStack.length != 0) {
      set({ navStack });
    }
  },
}));

// interface HotKeyActionStore {
//   isSearchOpen: boolean;
//   setIsSearchOpen: (isSearchOpen: boolean) => void;
// }

// export const useHotKeyActionStore = create<HotKeyActionStore>((set) => ({
//   isSearchOpen: false,
//   setIsSearchOpen: (isSearchOpen) => set({ isSearchOpen }),
// }));