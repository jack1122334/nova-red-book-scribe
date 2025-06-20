export interface UserBackgroundData {
  personalities?: {
    type: string;
    content: string;
    id?: string | null;
  };
  resources?: {
    type: string;
    content: string;
    id?: string | null;
  };
  intentions?: {
    type: string;
    content: string;
    id?: string | null;
  };
} 