import { create } from 'zustand';

export type OsintCategory = "All" | "Business & Economy" | "Lifestyle & Culture" | "Local News" | "Politics & Society" | "Science & Technology" | "Sports" | "World / International";

interface OsintState {
    osintDrawerOpen: boolean;
    setOsintDrawerOpen: (open: boolean) => void;
    currentRegionLat: number;
    currentRegionLon: number;
    setCurrentRegion: (lat: number, lon: number) => void;
    selectedCategory: OsintCategory;
    setSelectedCategory: (category: OsintCategory) => void;
}

export const useOsintStore = create<OsintState>((set) => ({
    osintDrawerOpen: false,
    setOsintDrawerOpen: (osintDrawerOpen) => set({ osintDrawerOpen }),
    currentRegionLat: 0,
    currentRegionLon: 0,
    setCurrentRegion: (lat, lon) => set({ currentRegionLat: lat, currentRegionLon: lon }),
    selectedCategory: "All",
    setSelectedCategory: (category) => set({ selectedCategory: category }),
}));
