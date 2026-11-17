import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { APP_REGISTRY, DEFAULT_SETTINGS } from './constants';
import {
  AppId,
  OSNotification,
  OSSettings,
  OSWindow,
  PowerState,
  VFSFile,
  VFSFolder,
  VFSNode,
  VFSState,
  WindowBounds,
} from './types';
import {
  createInitialVFS,
  getChildren,
  inferMimeType,
  loadVFS,
  saveVFS,
} from './vfs';

const SETTINGS_STORAGE_KEY = 'kestrel_settings_v1';

interface OSContextValue {
  powerState: PowerState;
  setPowerState: (state: PowerState) => void;
  bootTime: number;
  settings: OSSettings;
  updateSettings: (patch: Partial<OSSettings>) => void;
  vfs: VFSState;
  windows: OSWindow[];
  activeWindowId: string | null;
  spotlightOpen: boolean;
  setSpotlightOpen: React.Dispatch<React.SetStateAction<boolean>>;
  notifications: OSNotification[];
  toasts: OSNotification[];
  cpuStressActive: boolean;
  setCpuStressActive: React.Dispatch<React.SetStateAction<boolean>>;

  // Window Manager
  openApp: (appId: AppId, payload?: OSWindow['payload']) => void;
  openFileInApp: (file: VFSFile) => void;
  closeWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximizeWindow: (id: string) => void;
  snapWindow: (id: string, zone: 'left' | 'right' | 'full') => void;
  focusWindow: (id: string) => void;
  updateWindowBounds: (id: string, bounds: WindowBounds) => void;
  killProcessByPid: (pid: number) => boolean;

  // VFS Operations
  createFile: (parentId: string, name: string, content?: string, mimeType?: string) => VFSFile | null;
  createFolder: (parentId: string, name: string) => VFSFolder | null;
  updateFileContent: (fileId: string, content: string) => void;
  renameNode: (nodeId: string, newName: string) => boolean;
  moveToTrash: (nodeId: string) => boolean;
  restoreFromTrash: (nodeId: string) => boolean;
  deletePermanent: (nodeId: string) => void;
  emptyTrash: () => void;
  moveNode: (nodeId: string, targetParentId: string) => boolean;
  copyNode: (nodeId: string, targetParentId: string, newName?: string) => VFSNode | null;
  resetVFS: () => void;

  // Notifications
  pushNotification: (title: string, body: string, appId?: AppId) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  dismissToast: (id: string) => void;
}

const OSContext = createContext<OSContextValue | null>(null);

function loadSettings(): OSSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export const OSProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [powerState, setPowerState] = useState<PowerState>('booting');
  const [bootTime] = useState<number>(() => Date.now());
  const [settings, setSettings] = useState<OSSettings>(loadSettings);
  const [vfs, setVfs] = useState<VFSState>(loadVFS);
  const [windows, setWindows] = useState<OSWindow[]>([]);
  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [cpuStressActive, setCpuStressActive] = useState(false);
  const [notifications, setNotifications] = useState<OSNotification[]>([
    {
      id: 'notif-welcome',
      title: 'Kestrel OS Ready',
      body: 'Press Ctrl+K anytime to launch apps or search files.',
      appId: 'files',
      timestamp: Date.now() - 120_000,
      read: false,
    },
  ]);
  const [toasts, setToasts] = useState<OSNotification[]>([]);

  const nextPidRef = useRef(1042);
  const nextZRef = useRef(20);
  const hasSeededWelcomeWindowRef = useRef(false);

  // Sync Tailwind dark class and persist settings
  useEffect(() => {
    document.documentElement.classList.toggle('dark', settings.theme === 'dark');
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Persist VFS on updates
  useEffect(() => {
    saveVFS(vfs);
  }, [vfs]);

  // Global keyboard shortcut for Spotlight (Ctrl+K or Cmd+K)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        if (powerState === 'desktop') {
          e.preventDefault();
          setSpotlightOpen((prev) => !prev);
        }
      } else if (e.key === 'Escape' && spotlightOpen) {
        setSpotlightOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [powerState, spotlightOpen]);

  const updateSettings = useCallback((patch: Partial<OSSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const pushNotification = useCallback((title: string, body: string, appId?: AppId) => {
    const notif: OSNotification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      body,
      appId,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => [notif, ...prev].slice(0, 30));
    setToasts((prev) => [notif, ...prev].slice(0, 3));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== notif.id));
    }, 3600);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const getViewportBounds = useCallback(() => {
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const vh = typeof window !== 'undefined' ? window.innerHeight : 900;
    return { vw, vh, topBar: 36, dockArea: 84 };
  }, []);

  const focusWindow = useCallback((id: string) => {
    nextZRef.current += 1;
    const z = nextZRef.current;
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMinimized: false, zIndex: z } : w))
    );
    setActiveWindowId(id);
  }, []);

  const openApp = useCallback(
    (appId: AppId, payload?: OSWindow['payload']) => {
      const def = APP_REGISTRY[appId];
      if (!def) return;

      setWindows((prev) => {
        if (def.singleton) {
          const existing = prev.find((w) => w.appId === appId);
          if (existing) {
            nextZRef.current += 1;
            const z = nextZRef.current;
            setActiveWindowId(existing.id);
            return prev.map((w) =>
              w.id === existing.id
                ? { ...w, isMinimized: false, zIndex: z, payload: payload ?? w.payload }
                : w
            );
          }
        }

        const { vw, vh, topBar, dockArea } = getViewportBounds();
        const maxW = Math.max(320, vw - 48);
        const maxH = Math.max(300, vh - topBar - dockArea - 24);
        const width = Math.min(def.defaultWidth, maxW);
        const height = Math.min(def.defaultHeight, maxH);
        const cascade = (prev.length % 6) * 26;
        const x = Math.max(16, Math.min(vw - width - 16, Math.round((vw - width) / 2) + cascade - 40));
        const y = Math.max(topBar + 12, Math.min(vh - height - dockArea, Math.round((vh - height) / 2) + cascade - 30));

        nextZRef.current += 1;
        nextPidRef.current += 1;
        const id = `win-${appId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

        const newWin: OSWindow = {
          id,
          pid: nextPidRef.current,
          appId,
          title: def.name,
          bounds: { x, y, width, height },
          isMinimized: false,
          isMaximized: false,
          zIndex: nextZRef.current,
          payload,
        };
        setActiveWindowId(id);
        return [...prev, newWin];
      });
    },
    [getViewportBounds]
  );

  // Open an initial starter Notes + Terminal layout right after unlocking for immediate richness
  useEffect(() => {
    if (powerState === 'desktop' && !hasSeededWelcomeWindowRef.current && windows.length === 0) {
      hasSeededWelcomeWindowRef.current = true;
      const { vw, vh } = getViewportBounds();
      const notesW = Math.min(640, vw - 80);
      const notesH = Math.min(460, vh - 160);
      const termW = Math.min(540, vw - 80);
      const termH = Math.min(380, vh - 160);
      const canSideBySide = vw >= 1100;

      const win1: OSWindow = {
        id: 'win-welcome-notes',
        pid: 1024,
        appId: 'notes',
        title: 'Notes',
        bounds: canSideBySide
          ? { x: Math.round((vw - (notesW + termW + 24)) / 2), y: 68, width: notesW, height: notesH }
          : { x: 40, y: 60, width: notesW, height: notesH },
        isMinimized: false,
        isMaximized: false,
        zIndex: 21,
        payload: { fileId: 'file-welcome' },
      };

      const win2: OSWindow = {
        id: 'win-welcome-term',
        pid: 1031,
        appId: 'terminal',
        title: 'Terminal',
        bounds: canSideBySide
          ? {
              x: Math.round((vw - (notesW + termW + 24)) / 2) + notesW + 24,
              y: 108,
              width: termW,
              height: termH,
            }
          : { x: 84, y: 108, width: termW, height: termH },
        isMinimized: false,
        isMaximized: false,
        zIndex: 22,
      };

      nextZRef.current = 24;
      setWindows([win1, win2]);
      setActiveWindowId(win2.id);
    }
  }, [powerState, windows.length, getViewportBounds]);

  const openFileInApp = useCallback(
    (file: VFSFile) => {
      const name = file.name.toLowerCase();
      if (file.mimeType.startsWith('image/') || file.imageSrc) {
        openApp('viewer', { fileId: file.id });
        return;
      }
      if (
        name.endsWith('.js') ||
        name.endsWith('.ts') ||
        name.endsWith('.html') ||
        name.endsWith('.htm') ||
        name.endsWith('.css') ||
        name.endsWith('.json')
      ) {
        openApp('code', { fileId: file.id });
        return;
      }
      openApp('notes', { fileId: file.id });
    },
    [openApp]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const next = prev.filter((w) => w.id !== id);
      setActiveWindowId((currActive) => {
        if (currActive !== id) return currActive;
        const visible = next.filter((w) => !w.isMinimized);
        if (visible.length === 0) return null;
        return visible.sort((a, b) => b.zIndex - a.zIndex)[0].id;
      });
      return next;
    });
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) => {
      const next = prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w));
      const visible = next.filter((w) => !w.isMinimized);
      setActiveWindowId(visible.length ? visible.sort((a, b) => b.zIndex - a.zIndex)[0].id : null);
      return next;
    });
  }, []);

  const toggleMaximizeWindow = useCallback(
    (id: string) => {
      const { vw, vh, topBar, dockArea } = getViewportBounds();
      nextZRef.current += 1;
      const z = nextZRef.current;
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          if (w.isMaximized && w.prevBounds) {
            return {
              ...w,
              isMaximized: false,
              bounds: w.prevBounds,
              prevBounds: undefined,
              zIndex: z,
            };
          }
          return {
            ...w,
            isMaximized: true,
            isMinimized: false,
            prevBounds: w.bounds,
            bounds: { x: 8, y: topBar + 6, width: vw - 16, height: vh - topBar - dockArea - 6 },
            zIndex: z,
          };
        })
      );
      setActiveWindowId(id);
    },
    [getViewportBounds]
  );

  const snapWindow = useCallback(
    (id: string, zone: 'left' | 'right' | 'full') => {
      const { vw, vh, topBar, dockArea } = getViewportBounds();
      const usableH = vh - topBar - dockArea - 8;
      const y = topBar + 6;
      nextZRef.current += 1;
      const z = nextZRef.current;
      setWindows((prev) =>
        prev.map((w) => {
          if (w.id !== id) return w;
          const halfW = Math.floor((vw - 24) / 2);
          const bounds: WindowBounds =
            zone === 'left'
              ? { x: 8, y, width: halfW, height: usableH }
              : zone === 'right'
              ? { x: halfW + 16, y, width: vw - halfW - 24, height: usableH }
              : { x: 8, y, width: vw - 16, height: usableH };
          return {
            ...w,
            isMinimized: false,
            isMaximized: zone === 'full',
            prevBounds: w.prevBounds ?? w.bounds,
            bounds,
            zIndex: z,
          };
        })
      );
      setActiveWindowId(id);
    },
    [getViewportBounds]
  );

  const updateWindowBounds = useCallback((id: string, bounds: WindowBounds) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, bounds, isMaximized: false } : w))
    );
  }, []);

  const killProcessByPid = useCallback(
    (pid: number): boolean => {
      const target = windows.find((w) => w.pid === pid);
      if (!target) return false;
      closeWindow(target.id);
      return true;
    },
    [windows, closeWindow]
  );

  // VFS Operations
  const createFile = useCallback(
    (parentId: string, name: string, content = '', mimeType?: string): VFSFile | null => {
      const cleanName = name.trim();
      if (!cleanName) return null;
      const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const file: VFSFile = {
        id,
        name: cleanName,
        type: 'file',
        parentId,
        mimeType: mimeType ?? inferMimeType(cleanName),
        content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      let created = false;
      setVfs((prev) => {
        const siblings = getChildren(prev, parentId);
        if (siblings.some((s) => s.name === cleanName)) return prev;
        created = true;
        return {
          ...prev,
          nodes: { ...prev.nodes, [id]: file },
        };
      });
      return created ? file : null;
    },
    []
  );

  const createFolder = useCallback((parentId: string, name: string): VFSFolder | null => {
    const cleanName = name.trim();
    if (!cleanName) return null;
    const id = `dir-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const folder: VFSFolder = {
      id,
      name: cleanName,
      type: 'folder',
      parentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    let created = false;
    setVfs((prev) => {
      const siblings = getChildren(prev, parentId);
      if (siblings.some((s) => s.name === cleanName)) return prev;
      created = true;
      return {
        ...prev,
        nodes: { ...prev.nodes, [id]: folder },
      };
    });
    return created ? folder : null;
  }, []);

  const updateFileContent = useCallback((fileId: string, content: string) => {
    setVfs((prev) => {
      const node = prev.nodes[fileId];
      if (!node || node.type !== 'file') return prev;
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [fileId]: { ...node, content, updatedAt: Date.now() },
        },
      };
    });
  }, []);

  const renameNode = useCallback((nodeId: string, newName: string): boolean => {
    const cleanName = newName.trim();
    if (!cleanName) return false;
    let ok = false;
    setVfs((prev) => {
      const node = prev.nodes[nodeId];
      if (!node || !node.parentId) return prev;
      const siblings = getChildren(prev, node.parentId);
      if (siblings.some((s) => s.id !== nodeId && s.name === cleanName)) return prev;
      ok = true;
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: { ...node, name: cleanName, updatedAt: Date.now() },
        },
      };
    });
    return ok;
  }, []);

  const moveToTrash = useCallback((nodeId: string): boolean => {
    const protectedIds = new Set([
      'root',
      'home',
      'claire',
      'desktop',
      'documents',
      'projects',
      'pictures',
      'trash',
      'etc',
      'var',
      'log',
    ]);
    if (protectedIds.has(nodeId)) return false;
    setVfs((prev) => {
      const node = prev.nodes[nodeId];
      if (!node) return prev;
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: {
            ...node,
            originalParentId: node.parentId,
            parentId: 'trash',
            updatedAt: Date.now(),
          },
        },
      };
    });
    return true;
  }, []);

  const restoreFromTrash = useCallback((nodeId: string): boolean => {
    setVfs((prev) => {
      const node = prev.nodes[nodeId];
      if (!node || node.parentId !== 'trash') return prev;
      const targetParent =
        node.originalParentId && prev.nodes[node.originalParentId]
          ? node.originalParentId
          : 'documents';
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: {
            ...node,
            parentId: targetParent,
            originalParentId: undefined,
            updatedAt: Date.now(),
          },
        },
      };
    });
    return true;
  }, []);

  const deletePermanent = useCallback((nodeId: string) => {
    setVfs((prev) => {
      const toDelete = new Set<string>([nodeId]);
      let added = true;
      while (added) {
        added = false;
        for (const n of Object.values(prev.nodes)) {
          if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
            toDelete.add(n.id);
            added = true;
          }
        }
      }
      const nextNodes = { ...prev.nodes };
      toDelete.forEach((id) => delete nextNodes[id]);
      return { ...prev, nodes: nextNodes };
    });
  }, []);

  const emptyTrash = useCallback(() => {
    setVfs((prev) => {
      const trashChildren = Object.values(prev.nodes).filter((n) => n.parentId === 'trash');
      const toDelete = new Set<string>(trashChildren.map((n) => n.id));
      let added = true;
      while (added) {
        added = false;
        for (const n of Object.values(prev.nodes)) {
          if (n.parentId && toDelete.has(n.parentId) && !toDelete.has(n.id)) {
            toDelete.add(n.id);
            added = true;
          }
        }
      }
      const nextNodes = { ...prev.nodes };
      toDelete.forEach((id) => delete nextNodes[id]);
      return { ...prev, nodes: nextNodes };
    });
  }, []);

  const moveNode = useCallback((nodeId: string, targetParentId: string): boolean => {
    if (nodeId === targetParentId) return false;
    let moved = false;
    setVfs((prev) => {
      const node = prev.nodes[nodeId];
      const target = prev.nodes[targetParentId];
      if (!node || !target || target.type !== 'folder') return prev;
      const siblings = getChildren(prev, targetParentId);
      if (siblings.some((s) => s.name === node.name && s.id !== nodeId)) return prev;
      moved = true;
      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: { ...node, parentId: targetParentId, updatedAt: Date.now() },
        },
      };
    });
    return moved;
  }, []);

  const copyNode = useCallback(
    (nodeId: string, targetParentId: string, newName?: string): VFSNode | null => {
      let result: VFSNode | null = null;
      setVfs((prev) => {
        const node = prev.nodes[nodeId];
        const target = prev.nodes[targetParentId];
        if (!node || !target || target.type !== 'folder') return prev;
        if (node.type === 'folder') return prev; // file copy
        const name = newName?.trim() || `${node.name} copy`;
        const id = `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        const copy: VFSFile = {
          ...node,
          id,
          name,
          parentId: targetParentId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        result = copy;
        return {
          ...prev,
          nodes: { ...prev.nodes, [id]: copy },
        };
      });
      return result;
    },
    []
  );

  const resetVFS = useCallback(() => {
    const fresh = createInitialVFS();
    setVfs(fresh);
    pushNotification('File System Reset', 'Restored default Kestrel OS directory tree.', 'settings');
  }, [pushNotification]);

  return (
    <OSContext.Provider
      value={{
        powerState,
        setPowerState,
        bootTime,
        settings,
        updateSettings,
        vfs,
        windows,
        activeWindowId,
        spotlightOpen,
        setSpotlightOpen,
        notifications,
        toasts,
        cpuStressActive,
        setCpuStressActive,
        openApp,
        openFileInApp,
        closeWindow,
        minimizeWindow,
        toggleMaximizeWindow,
        snapWindow,
        focusWindow,
        updateWindowBounds,
        killProcessByPid,
        createFile,
        createFolder,
        updateFileContent,
        renameNode,
        moveToTrash,
        restoreFromTrash,
        deletePermanent,
        emptyTrash,
        moveNode,
        copyNode,
        resetVFS,
        pushNotification,
        markAllNotificationsRead,
        clearNotifications,
        dismissToast,
      }}
    >
      {children}
    </OSContext.Provider>
  );
};

export function useOS(): OSContextValue {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used within OSProvider');
  return ctx;
}
