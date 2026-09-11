export type ConfessionStatus = 'pending' | 'approved' | 'rejected' | 'archived';

export interface Confession {
  id: string;
  created_at: string;
  title: string;
  body: string;
  category: string;
  nickname: string;
  status: ConfessionStatus;
  shown_at?: string | null;
}

export interface Streamer {
  id: string;
  name: string;
  twitch_handle: string;
  slot: number;
}

export const STREAMER_SLOTS = [1, 2, 3] as const;

export const CATEGORIES = [
  { id: 'amor', label: 'Amor' },
  { id: 'desamor', label: 'Confesión vergonzosa' },
  { id: 'redflag', label: '¿Es una Red Flag?' },
  { id: 'norespondido', label: 'Amor no correspondido' },
  { id: 'toxico', label: 'Secreto tóxico' },
] as const;

export function categoryLabel(category: string): string {
  return CATEGORIES.find((c) => c.id === category)?.label ?? category;
}