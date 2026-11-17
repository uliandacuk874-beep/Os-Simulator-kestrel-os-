import React, { useState } from 'react';
import { FileText, Folder, X } from 'lucide-react';
import { APP_REGISTRY, WALLPAPERS } from '../../os/constants';
import { useOS } from '../../os/OSContext';
import { AppId, OSWindow, VFSFile } from '../../os/types';
import { getChildren, getNodePath } from '../../os/vfs';
import { BrowserApp } from '../apps/BrowserApp';
import { CalculatorApp } from '../apps/CalculatorApp';
import { CodeStudioApp } from '../apps/CodeStudioApp';
import { FilesApp } from '../apps/FilesApp';
import { ImageViewerApp } from '../apps/ImageViewerApp';
import { NotesApp } from '../apps/NotesApp';
import { SettingsApp } from '../apps/SettingsApp';
import { SystemMonitorApp } from '../apps/SystemMonitorApp';
import { TerminalApp } from '../apps/TerminalApp';
import { AppIcon } from './AppIcon';
import { BootAndLockScreen } from './BootAndLockScreen';
import { DesktopContextMenu } from './DesktopContextMenu';
import { Dock } from './Dock';
import { SpotlightModal } from './SpotlightModal';
import { TopBar } from './TopBar';
import { WindowFrame } from './WindowFrame';

export const DesktopWorkspace: React.FC = () => {
  const {
    powerState,
    settings,
    windows,
    vfs,
    openApp,
    openFileInApp,
    toasts,
    dismissToast,
  } = useOS();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [selectedDesktopItem, setSelectedDesktopItem] = useState<string | null>(null);
  const [wallpaperFailed, setWallpaperFailed] = useState(false);

  React.useEffect(() => {
    setWallpaperFailed(false);
  }, [settings.wallpaperId]);

  const wallpaper = WALLPAPERS.find((w) => w.id === settings.wallpaperId) ?? WALLPAPERS[0];
  const desktopAppShortcuts = Object.values(APP_REGISTRY).filter((a) => a.desktopShortcut);
  const desktopVfsItems = getChildren(vfs, 'desktop');

  const renderAppContent = (win: OSWindow) => {
    switch (win.appId) {
      case 'files':
        return <FilesApp win={win} />;
      case 'terminal':
        return <TerminalApp />;
      case 'notes':
        return <NotesApp win={win} />;
      case 'code':
        return <CodeStudioApp win={win} />;
      case 'browser':
        return <BrowserApp />;
      case 'monitor':
        return <SystemMonitorApp />;
      case 'calculator':
        return <CalculatorApp />;
      case 'viewer':
        return <ImageViewerApp win={win} />;
      case 'settings':
        return <SettingsApp win={win} />;
    }
  };

  const labelToneClass = wallpaper.darkTextOnWallpaper
    ? 'text-slate-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.85)]'
    : 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-slate-950 select-none">
      {/* Brightness overlay */}
      <div
        className="pointer-events-none fixed inset-0 z-[95] bg-black transition-opacity duration-150"
        style={{ opacity: Math.max(0, (100 - settings.brightness) / 115) }}
      />

      {/* Boot / Lock / Sleep Overlay */}
      <BootAndLockScreen />

      {powerState === 'desktop' && (
        <>
          {/* Wallpaper Canvas */}
          <div className="absolute inset-0 z-0">
            {wallpaper.kind === 'image' && wallpaper.src && !wallpaperFailed ? (
              <img
                key={wallpaper.id}
                src={wallpaper.src}
                alt={wallpaper.name}
                referrerPolicy="no-referrer"
                onError={() => setWallpaperFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background:
                    wallpaper.css ??
                    'radial-gradient(circle at 20% 20%, #1e293b 0%, #0f172a 60%, #020617 100%)',
                }}
              />
            )}
          </div>

          {/* Top System Menu Bar */}
          <TopBar />

          {/* Desktop Surface */}
          <main
            onMouseDown={() => {
              setContextMenu(null);
              setSelectedDesktopItem(null);
            }}
            onContextMenu={(e) => {
              if ((e.target as HTMLElement).closest('section[role="dialog"]')) return;
              e.preventDefault();
              setContextMenu({ x: e.clientX, y: e.clientY });
            }}
            className="relative z-10 h-[calc(100vh-36px)] w-full overflow-hidden p-4"
          >
            {/* Desktop Icons Grid (left column flow) */}
            <div className="flex flex-col flex-wrap content-start gap-3 h-[calc(100%-84px)] w-fit">
              {desktopAppShortcuts.map((app) => {
                const key = `app:${app.id}`;
                const selected = selectedDesktopItem === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setContextMenu(null);
                      setSelectedDesktopItem(key);
                    }}
                    onDoubleClick={() => openApp(app.id as AppId)}
                    className={`flex w-20 flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      selected ? 'bg-white/20 backdrop-blur-xs' : 'hover:bg-white/10'
                    }`}
                  >
                    <AppIcon appId={app.id} size="lg" />
                    <span className={`w-full truncate text-[11px] font-medium ${labelToneClass}`}>
                      {app.name}
                    </span>
                  </button>
                );
              })}

              {desktopVfsItems.map((node) => {
                const key = `vfs:${node.id}`;
                const selected = selectedDesktopItem === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setContextMenu(null);
                      setSelectedDesktopItem(key);
                    }}
                    onDoubleClick={() => {
                      if (node.type === 'folder') {
                        openApp('files', { path: getNodePath(vfs, node.id) });
                      } else {
                        openFileInApp(node as VFSFile);
                      }
                    }}
                    className={`flex w-20 flex-col items-center gap-1.5 rounded-xl p-2 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      selected ? 'bg-white/20 backdrop-blur-xs' : 'hover:bg-white/10'
                    }`}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/20 bg-slate-900/60 text-white shadow-md backdrop-blur-md">
                      {node.type === 'folder' ? (
                        <Folder className="h-6 w-6 text-sky-400" />
                      ) : (
                        <FileText className="h-6 w-6 text-amber-300" />
                      )}
                    </span>
                    <span className={`w-full truncate text-[11px] font-medium ${labelToneClass}`}>
                      {node.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Windows */}
            {windows.map((win) => (
              <WindowFrame key={win.id} win={win}>
                {renderAppContent(win)}
              </WindowFrame>
            ))}
          </main>

          {/* Toast Notifications */}
          {toasts.length > 0 && (
            <div className="pointer-events-none fixed right-4 top-12 z-[70] flex w-72 flex-col gap-2">
              {toasts.map((t) => (
                <div
                  key={t.id}
                  className="pointer-events-auto flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-800 shadow-xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-100"
                >
                  {t.appId && <AppIcon appId={t.appId} size="xs" />}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{t.title}</div>
                    <div className="mt-0.5 text-slate-500 dark:text-slate-300">{t.body}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => dismissToast(t.id)}
                    className="rounded p-0.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Right-Click Context Menu */}
          <DesktopContextMenu
            position={contextMenu}
            onClose={() => setContextMenu(null)}
          />

          {/* Spotlight Quick Launcher */}
          <SpotlightModal />

          {/* Floating Dock */}
          <Dock />
        </>
      )}
    </div>
  );
};
