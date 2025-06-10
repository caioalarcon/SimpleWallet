export interface Preset {
  name: string;
  content: string;
}

export const defaultPresets: Preset[] = [
  { name: 'Preset 1', content: '{}' },
  { name: 'Preset 2', content: '{}' },
  { name: 'Preset 3', content: '{}' }
];
