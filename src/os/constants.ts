import { AccentColor, AppDefinition, AppId, OSSettings } from './types';

export interface WallpaperOption {
  id: string;
  name: string;
  kind: 'image' | 'gradient';
  src?: string;
  css?: string;
  darkTextOnWallpaper: boolean;
}

export const USER_AVATAR_SRC = '/src/assets/images/avatar_os_user_1794931629303.jpg';

export const WALLPAPERS: WallpaperOption[] = [
  {
    id: 'nordic-dusk',
    name: 'Nordic Dusk',
    kind: 'image',
    src: '/src/assets/images/wallpaper_nordic_dusk_1794931627699.jpg',
    darkTextOnWallpaper: false,
  },
  {
    id: 'studio-waves',
    name: 'Studio Waves',
    kind: 'image',
    src: '/src/assets/images/wallpaper_studio_waves_1794931627544.jpg',
    darkTextOnWallpaper: false,
  },
  {
    id: 'desert-horizon',
    name: 'Desert Horizon',
    kind: 'image',
    src: '/src/assets/images/wallpaper_desert_horizon_1794931627842.jpg',
    darkTextOnWallpaper: true,
  },
  {
    id: 'obsidian-slate',
    name: 'Obsidian Slate',
    kind: 'gradient',
    css: 'radial-gradient(circle at 20% 20%, #1e293b 0%, #0f172a 55%, #020617 100%)',
    darkTextOnWallpaper: false,
  },
  {
    id: 'alabaster-paper',
    name: 'Alabaster Studio',
    kind: 'gradient',
    css: 'linear-gradient(145deg, #f8fafc 0%, #e2e8f0 55%, #cbd5e1 100%)',
    darkTextOnWallpaper: true,
  },
];

export const ACCENT_TOKENS: Record<
  AccentColor,
  {
    label: string;
    swatch: string;
    bg: string;
    bgHover: string;
    text: string;
    ring: string;
    softBg: string;
  }
> = {
  cobalt: {
    label: 'Cobalt',
    swatch: '#2563EB',
    bg: 'bg-blue-600',
    bgHover: 'hover:bg-blue-700',
    text: 'text-blue-600 dark:text-blue-400',
    ring: 'focus-visible:ring-blue-500',
    softBg: 'bg-blue-500/12 text-blue-700 dark:text-blue-300',
  },
  emerald: {
    label: 'Emerald',
    swatch: '#059669',
    bg: 'bg-emerald-600',
    bgHover: 'hover:bg-emerald-700',
    text: 'text-emerald-600 dark:text-emerald-400',
    ring: 'focus-visible:ring-emerald-500',
    softBg: 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300',
  },
  amber: {
    label: 'Amber',
    swatch: '#D97706',
    bg: 'bg-amber-600',
    bgHover: 'hover:bg-amber-700',
    text: 'text-amber-600 dark:text-amber-400',
    ring: 'focus-visible:ring-amber-500',
    softBg: 'bg-amber-500/12 text-amber-700 dark:text-amber-300',
  },
  crimson: {
    label: 'Crimson',
    swatch: '#DC2626',
    bg: 'bg-red-600',
    bgHover: 'hover:bg-red-700',
    text: 'text-red-600 dark:text-red-400',
    ring: 'focus-visible:ring-red-500',
    softBg: 'bg-red-500/12 text-red-700 dark:text-red-300',
  },
  slate: {
    label: 'Graphite',
    swatch: '#475569',
    bg: 'bg-slate-700',
    bgHover: 'hover:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    ring: 'focus-visible:ring-slate-500',
    softBg: 'bg-slate-500/12 text-slate-700 dark:text-slate-300',
  },
};

export const APP_REGISTRY: Record<AppId, AppDefinition> = {
  files: {
    id: 'files',
    name: 'Files',
    subtitle: 'Virtual file explorer',
    defaultWidth: 840,
    defaultHeight: 540,
    minWidth: 560,
    minHeight: 380,
    pinnedInDock: true,
    desktopShortcut: true,
  },
  terminal: {
    id: 'terminal',
    name: 'Terminal',
    subtitle: 'Interactive POSIX shell',
    defaultWidth: 740,
    defaultHeight: 460,
    minWidth: 480,
    minHeight: 320,
    pinnedInDock: true,
    desktopShortcut: true,
  },
  notes: {
    id: 'notes',
    name: 'Notes',
    subtitle: 'Markdown & text editor',
    defaultWidth: 780,
    defaultHeight: 520,
    minWidth: 500,
    minHeight: 360,
    pinnedInDock: true,
    desktopShortcut: true,
  },
  code: {
    id: 'code',
    name: 'Code Studio',
    subtitle: 'Script & HTML sandbox',
    defaultWidth: 880,
    defaultHeight: 560,
    minWidth: 580,
    minHeight: 400,
    pinnedInDock: true,
    desktopShortcut: true,
  },
  browser: {
    id: 'browser',
    name: 'Browser',
    subtitle: 'Local & intranet viewer',
    defaultWidth: 900,
    defaultHeight: 580,
    minWidth: 560,
    minHeight: 400,
    pinnedInDock: true,
    desktopShortcut: true,
  },
  monitor: {
    id: 'monitor',
    name: 'System Monitor',
    subtitle: 'Processes & telemetry',
    defaultWidth: 760,
    defaultHeight: 520,
    minWidth: 540,
    minHeight: 380,
    singleton: true,
    pinnedInDock: true,
    desktopShortcut: true,
  },
  calculator: {
    id: 'calculator',
    name: 'Calculator',
    subtitle: 'Precision arithmetic',
    defaultWidth: 340,
    defaultHeight: 490,
    minWidth: 300,
    minHeight: 430,
    singleton: true,
    pinnedInDock: true,
    desktopShortcut: false,
  },
  viewer: {
    id: 'viewer',
    name: 'Image Viewer',
    subtitle: 'Inspect & set wallpapers',
    defaultWidth: 700,
    defaultHeight: 500,
    minWidth: 420,
    minHeight: 320,
    pinnedInDock: false,
    desktopShortcut: false,
  },
  settings: {
    id: 'settings',
    name: 'Settings',
    subtitle: 'Appearance & system config',
    defaultWidth: 780,
    defaultHeight: 520,
    minWidth: 580,
    minHeight: 420,
    singleton: true,
    pinnedInDock: true,
    desktopShortcut: true,
  },
};

export const DEFAULT_SETTINGS: OSSettings = {
  theme: 'dark',
  accent: 'cobalt',
  wallpaperId: 'nordic-dusk',
  dockSize: 'standard',
  translucentWindows: true,
  wifiEnabled: true,
  bluetoothEnabled: true,
  volume: 72,
  brightness: 95,
  userName: 'Claire Vance',
  userHandle: 'claire',
};

export const OS_VERSION = 'Kestrel OS 2.4';
export const KERNEL_VERSION = 'kestrel-kernel 6.8.4-workstation';
