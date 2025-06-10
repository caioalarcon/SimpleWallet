export interface Preset {
  name: string;
  content: string;
}

export const defaultPresets: Preset[] = [
  { name: 'Preset 1', content: `;; preset 1\n(command 1)` },
  { name: 'Preset 2', content: `;; preset 2\n(command 2)` },
  { name: 'Preset 3', content: `;; preset 3\n(command 3)` }
];
