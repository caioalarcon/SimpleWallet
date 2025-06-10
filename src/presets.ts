export interface Preset {
  name: string;
  code: string;
}

export const defaultPresets: Preset[] = [
  { name: 'Preset 1', code: `;; preset 1\n(command 1)` },
  { name: 'Preset 2', code: `;; preset 2\n(command 2)` },
  { name: 'Preset 3', code: `;; preset 3\n(command 3)` }
];
