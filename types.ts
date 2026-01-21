
export interface DriveVideo {
  id: string;
  name: string;
  thumbnail: string;
  size: string;
  date: string;
  timestamp: number;
  webContentLink?: string;
  category: string;
}

export interface SearchState {
  query: string;
  category: string;
  isSearching: boolean;
}
