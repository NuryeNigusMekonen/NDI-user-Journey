import { create } from 'zustand';

/** Bridge between DiagramCanvas (React Flow hooks) and AppHeader toolbar */
export const useWorkspaceStore = create((set) => ({
  api: null,
  register: (api) => set({ api }),
  unregister: () => set({ api: null }),
}));
