import { create } from "zustand";

export const useReplayStore = create((set) => ({
  recordingData: [],
  setRecordingData: (data) => {
    return set((state) => ({
      recordingData: [...state.recordingData, ...JSON.parse(data)], // 追加数据
    }));
  },
}));
