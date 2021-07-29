import { Square } from 'src/lib/chess';
import create from 'zustand';
import { combine } from 'zustand/middleware';

export const useStore = create(combine({
  game: {},
  state: 'idle',
  selectedSquare: null as Square | null
}, (set, get) => ({
  selectSquare: (square: Square) => set({ selectedSquare: square }),
  clearSelection: () => set({ selectedSquare: null })
})))