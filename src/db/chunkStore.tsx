import { create } from 'zustand';

export interface ActiveFileTransfer {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  totalChunks: number;
  chunkSize: number;
  checksum?: string;
  tempFilePath?: string;
  filePath?: string;
  receivedChunksCount?: number;
  receivedChunks?: Set<number>;
  chunkArray?: any[]; // Kept for legacy compatibility
}

interface ChunkState {
  chunkStore: ActiveFileTransfer | null;
  currentChunkSet: ActiveFileTransfer | null;
  setChunkStore: (chunkStore: any) => void;
  resetChunkStore: () => void;
  setCurrentChunkSet: (currentChunkSet: any) => void;
  resetCurrentChunkSet: () => void;
}

export const useChunkStore = create<ChunkState>((set) => ({
  chunkStore: null,
  currentChunkSet: null,
  setChunkStore: (chunkStore) => set(() => ({ chunkStore })),
  resetChunkStore: () => set(() => ({ chunkStore: null })),
  setCurrentChunkSet: (currentChunkSet) => set(() => ({ currentChunkSet })),
  resetCurrentChunkSet: () => set(() => ({ currentChunkSet: null })),
}));
