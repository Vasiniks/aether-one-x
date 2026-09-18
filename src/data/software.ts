export type AppId =
  | 'camera'
  | 'photos'
  | 'messages'
  | 'weather'
  | 'music'
  | 'maps'
  | 'timer'
  | 'settings'

/** Short, demonstrative bullets for the AetherOS phone simulator. */
export const PHONE_INTERACTION_COPY = [
  'Everything stays on-device: summaries, transcripts, and photo cleanup never leave the phone.',
  'Pull the status bar down for a one-handed quick-settings panel.',
  'Apps open in a single motion - one thumb, no menus to memorize.',
  'Notifications group by context and quietly step aside when focus is on.',
]