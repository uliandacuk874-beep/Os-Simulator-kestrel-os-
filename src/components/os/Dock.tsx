import React from 'react';
import { Trash2 } from 'lucide-react';
import { APP_REGISTRY } from '../../os/constants';
import { useOS } from '../../os/OSContext';
import { AppId } from '../../os/types';
import { getChildren } from '../../os/vfs';
import { AppIcon } from './AppIcon';

export const Dock: React.FC = () => {
  const { windows, activeWindowId, openApp, focusWindow, minimizeWindow, settings, vfs } = useOS();

  const pinnedApps = Object.values(APP_REGISTRY).filter((a) => a.pinnedInDock);
  const runningUnpinnedIds = Array.from(
    new Set(
      windows
        .map((w) => w.appId)
        .filter((id) => !APP_REGISTRY[id].pinnedInDock)
    )
  );
  const dockApps: AppId[] = [...pinnedApps.map((a) => a.id), ...runningUnpinnedIds];

  const trashItemsCount = getChildren(vfs, 'trash').length;

  const sizeClasses =
    settings.dockSize === 'compact'
      ? 'px-2 py-1.5 gap-1.5'
      : settings.dockSize === 'large'
      ? 'px-3.5 py-2.5 gap-3'
      : 'px-3 py-2 gap-2';

  const handleDockClick = (appId: AppId) => {
    const appWindows = windows.filter((w) => w.appId === appId);
    if (appWindows.length === 0) {
      openApp(appId);
      return;
    }
    const activeMatching = appWindows.find((w) => w.id === activeWindowId && !w.isMinimized);
    if (activeMatching) {
      minimizeWindow(activeMatching.id);
      return;
    }
    const target = [...appWindows].sort((a, b) => b.zIndex - a.zIndex)[0];
    focusWindow(target.id);
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center px-4">
      <nav
        aria-label="Application dock"
        className={`pointer-events-auto flex items-center rounded-2xl border border-slate-900/10 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-white/15 dark:bg-slate-900/80 ${sizeClasses}`}
      >
        {dockApps.map((appId) => {
          const def = APP_REGISTRY[appId];
          const appWindows = windows.filter((w) => w.appId === appId);
          const isRunning = appWindows.length > 0;
          const isFocused = appWindows.some((w) => w.id === activeWindowId && !w.isMinimized);

          return (
            <button
              key={appId}
              type="button"
              onClick={() => handleDockClick(appId)}
              className="group relative flex flex-col items-center rounded-xl p-1 transition-transform duration-150 hover:-translate-y-1.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title={def.name}
            >
              <span className="pointer-events-none absolute -top-9 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-800 opacity-0 shadow-md transition-opacity group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 whitespace-nowrap">
                {def.name}
              </span>
              <AppIcon appId={appId} size={settings.dockSize === 'compact' ? 'sm' : 'md'} />
              <span
                className={`mt-1 h-1 rounded-full transition-all ${
                  isFocused
                    ? 'w-4 bg-slate-900 dark:bg-white'
                    : isRunning
                    ? 'w-1.5 bg-slate-500 dark:bg-slate-400'
                    : 'w-0 bg-transparent'
                }`}
              />
            </button>
          );
        })}

        <span className="mx-1 h-8 w-px bg-slate-900/10 dark:bg-white/10" aria-hidden="true" />

        {/* Trash Shortcut */}
        <button
          type="button"
          onClick={() => openApp('files', { path: '/home/claire/Trash' })}
          className="group relative flex flex-col items-center rounded-xl p-1 transition-transform duration-150 hover:-translate-y-1.5 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          title={`Trash (${trashItemsCount})`}
        >
          <span className="pointer-events-none absolute -top-9 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-800 opacity-0 shadow-md transition-opacity group-hover:opacity-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 whitespace-nowrap">
            Trash ({trashItemsCount})
          </span>
          <span
            className={`inline-flex items-center justify-center rounded-xl border border-slate-300/80 bg-slate-100 text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 ${
              settings.dockSize === 'compact' ? 'h-8 w-8' : 'h-10 w-10'
            }`}
          >
            <Trash2 className="h-5 w-5" />
          </span>
          {trashItemsCount > 0 ? (
            <span className="mt-1 h-1 w-1.5 rounded-full bg-slate-500 dark:bg-slate-400" />
          ) : (
            <span className="mt-1 h-1 w-0" />
          )}
        </button>
      </nav>
    </div>
  );
};
