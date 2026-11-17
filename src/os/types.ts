export type PowerState = 'booting' | 'locked' | 'desktop' | 'sleeping';

export type ThemeMode = 'light' | 'dark';

export type AccentColor = 'cobalt' | 'emerald' | 'amber' | 'crimson' | 'slate';

export type AppId =
  | 'files'
  | 'terminal'
  | 'notes'
  | 'code'
  | 'monitor'
  | 'browser'
  | 'calculator'
  | 'viewer'
  | 'settings';

export type VFSNodeType = 'folder' | 'file';

export interface VFSBaseNode {
  id: string;
  name: string;
  type: VFSNodeType;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
  originalParentId?: string | null;
}

export interface VFSFolder extends VFSBaseNode {
  type: 'folder';
}

export interface VFSFile extends VFSBaseNode {
  type: 'file';
  mimeType: string;
  content: string;
  imageSrc?: string;
}

export type VFSNode = VFSFolder | VFSFile;

export interface VFSState {
  rootId: string;
  nodes: Record<string, VFSNode>;
}

export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OSWindow {
  id: string;
  pid: number;
  appId: AppId;
  title: string;
  bounds: WindowBounds;
  prevBounds?: WindowBounds;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  payload?: {
    fileId?: string;
    path?: string;
    url?: string;
  };
}

export interface OSSettings {
  theme: ThemeMode;
  accent: AccentColor;
  wallpaperId: string;
  dockSize: 'compact' | 'standard' | 'large';
  translucentWindows: boolean;
  wifiEnabled: boolean;
  bluetoothEnabled: boolean;
  volume: number;
  brightness: number;
  userName: string;
  userHandle: string;
}

export interface OSNotification {
  id: string;
  title: string;
  body: string;
  appId?: AppId;
  timestamp: number;
  read: boolean;
}

export interface AppDefinition {
  id: AppId;
  name: string;
  subtitle: string;
  defaultWidth: number;
  defaultHeight: number;
  minWidth: number;
  minHeight: number;
  singleton?: boolean;
  pinnedInDock: boolean;
  desktopShortcut?: boolean;
}
