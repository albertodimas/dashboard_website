export type ThemePreset = {
  name: string
  p: string
  s: string
  a: string
  b: string
}

export const THEME_PRESETS: ThemePreset[] = [
  // Core presets
  { name: 'Modern Blue',    p: '#3B82F6', s: '#1F2937', a: '#10B981', b: '#FFFFFF' },
  { name: 'Elegant Purple', p: '#8B5CF6', s: '#374151', a: '#F59E0B', b: '#F9FAFB' },
  { name: 'Fresh Green',    p: '#059669', s: '#111827', a: '#F97316', b: '#F0FDF4' },
  { name: 'Warm Orange',    p: '#EA580C', s: '#1F2937', a: '#0891B2', b: '#FFF7ED' },
  { name: 'Classic Dark',   p: '#6B7280', s: '#111827', a: '#EF4444', b: '#F9FAFB' },
  { name: 'Ocean Blue',     p: '#0891B2', s: '#0F172A', a: '#F59E0B', b: '#F0F9FF' },
  { name: 'Rose Pink',      p: '#EC4899', s: '#831843', a: '#14B8A6', b: '#FDF2F8' },
  { name: 'Sunset Red',     p: '#DC2626', s: '#7F1D1D', a: '#FBBF24', b: '#FEF2F2' },
  { name: 'Mint Fresh',     p: '#14B8A6', s: '#134E4A', a: '#F472B6', b: '#F0FDFA' },
  // Additional presets
  { name: 'Sand Dune',      p: '#FCD34D', s: '#78716C', a: '#A78BFA', b: '#FEFCE8' },
  { name: 'Royal Purple',   p: '#7C3AED', s: '#1F2937', a: '#F59E0B', b: '#F5F3FF' },
  { name: 'Forest Green',   p: '#22C55E', s: '#064E3B', a: '#F59E0B', b: '#ECFDF5' },
  { name: 'Teal Navy',      p: '#0EA5E9', s: '#0F172A', a: '#14B8A6', b: '#E0F2FE' },
  // New dark presets
  { name: 'Dark Elegant',   p: '#6366F1', s: '#0F172A', a: '#F59E0B', b: '#0B1220' },
  { name: 'Forest Night',   p: '#22C55E', s: '#14532D', a: '#86EFAC', b: '#0B1220' },
  { name: 'Neon Pulse',     p: '#06B6D4', s: '#0B1120', a: '#F43F5E', b: '#0B1120' },
  // Extra presets
  { name: 'Royal Gold',     p: '#CA8A04', s: '#111827', a: '#8B5CF6', b: '#FFFBEB' },
  { name: 'Slate Mint',     p: '#0EA5E9', s: '#0F172A', a: '#10B981', b: '#F1F5F9' },
]
