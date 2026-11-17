import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Lock,
  Moon,
  RotateCcw,
  Search,
  Settings,
  SlidersHorizontal,
  Sun,
  Volume2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { APP_REGISTRY, OS_VERSION } from '../../os/constants';
import { useOS } from '../../os/OSContext';
import { AppIcon } from './AppIcon';

export const TopBar: React.FC = () => {
  const {
    settings,
    updateSettings,
    windows,
    activeWindowId,
    openApp,
    snapWindow,
    closeWindow,
    setSpotlightOpen,
    setPowerState,
    notifications,
    markAllNotificationsRead,
    clearNotifications,
  } = useOS();

  const [now, setNow] = useState(() => new Date());
  const [openMenu, setOpenMenu] = useState<'system' | 'control' | 'notifications' | 'about' | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (barRef.current && !barRef.current.contains(e.target as Node)) {
        setOpenMenu((prev) => (prev === 'about' ? prev : null));
      }
    };
    window.addEventListener('mousedown', handleOutside);
    return () => window.removeEventListener('mousedown', handleOutside);
  }, []);

  const activeWindow = windows.find((w) => w.id === activeWindowId && !w.isMinimized) ?? null;
  const activeDef = activeWindow ? APP_REGISTRY[activeWindow.appId] : null;
  const unreadCount = notifications.filter((n) => !n.read).length;

  const formattedTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const formattedDate = now.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <header
      ref={barRef}
      className="relative z-50 flex h-9 w-full items-center justify-between border-b border-slate-900/10 bg-white/80 px-3 text-xs font-medium text-slate-800 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100"
    >
      {/* Left: System Menu + Active App + Window Snapping */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === 'system' ? null : 'system'))}
          className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 whitespace-nowrap shrink-0 transition-colors ${
            openMenu === 'system'
              ? 'bg-slate-900/10 dark:bg-white/15'
              : 'hover:bg-slate-900/5 dark:hover:bg-white/10'
          }`}
          aria-label="System menu"
        >
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M4 17L12 4l8 13H4z" strokeLinejoin="round" />
          </svg>
          <span className="font-display font-semibold tracking-tight">Kestrel</span>
        </button>

        <span className="mx-1 h-3.5 w-px bg-slate-900/15 dark:bg-white/15" aria-hidden="true" />

        <span className="px-2 py-1 font-display font-semibold text-slate-900 dark:text-white whitespace-nowrap shrink-0">
          {activeDef ? activeDef.name : 'Desktop'}
        </span>

        {activeWindow && (
          <div className="hidden sm:flex items-center gap-0.5 ml-1">
            <button
              type="button"
              onClick={() => snapWindow(activeWindow.id, 'left')}
              className="rounded px-2 py-1 text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white whitespace-nowrap shrink-0 transition-colors"
            >
              Tile Left
            </button>
            <button
              type="button"
              onClick={() => snapWindow(activeWindow.id, 'right')}
              className="rounded px-2 py-1 text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white whitespace-nowrap shrink-0 transition-colors"
            >
              Tile Right
            </button>
            <button
              type="button"
              onClick={() => closeWindow(activeWindow.id)}
              className="rounded px-2 py-1 text-slate-600 hover:bg-slate-900/5 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white whitespace-nowrap shrink-0 transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Right: Spotlight, Control Center, Notifications, Clock */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => {
            setOpenMenu(null);
            setSpotlightOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-slate-700 hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/10 whitespace-nowrap shrink-0 transition-colors"
          title="Quick Launcher (Ctrl+K)"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden md:inline text-[11px] text-slate-500 dark:text-slate-400">Ctrl+K</span>
        </button>

        <button
          type="button"
          onClick={() =>
            updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
          }
          className="rounded-md p-1.5 text-slate-700 hover:bg-slate-900/5 dark:text-slate-200 dark:hover:bg-white/10 transition-colors"
          title={`Switch to ${settings.theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle color theme"
        >
          {settings.theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
        </button>

        <button
          type="button"
          onClick={() => setOpenMenu((m) => (m === 'control' ? null : 'control'))}
          className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 transition-colors ${
            openMenu === 'control'
              ? 'bg-slate-900/10 dark:bg-white/15'
              : 'hover:bg-slate-900/5 dark:hover:bg-white/10'
          }`}
          aria-label="Control center"
        >
          {settings.wifiEnabled ? (
            <Wifi className="h-3.5 w-3.5" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-slate-400" />
          )}
          <SlidersHorizontal className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => {
            setOpenMenu((m) => {
              const next = m === 'notifications' ? null : 'notifications';
              if (next === 'notifications') markAllNotificationsRead();
              return next;
            });
          }}
          className={`relative rounded-md p-1.5 transition-colors ${
            openMenu === 'notifications'
              ? 'bg-slate-900/10 dark:bg-white/15'
              : 'hover:bg-slate-900/5 dark:hover:bg-white/10'
          }`}
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
          )}
        </button>

        <div className="ml-1 flex items-center gap-2 rounded-md px-2 py-1 tabular-nums text-slate-800 dark:text-slate-100 whitespace-nowrap shrink-0">
          <span className="hidden sm:inline">{formattedDate}</span>
          <span className="font-semibold">{formattedTime}</span>
        </div>
      </div>

      {/* System Dropdown */}
      {openMenu === 'system' && (
        <div className="absolute left-3 top-10 z-50 w-56 rounded-xl border border-slate-200 bg-white/95 p-1.5 text-xs text-slate-800 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100">
          <button
            type="button"
            onClick={() => setOpenMenu('about')}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span>About Kestrel OS</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              openApp('settings');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings className="h-3.5 w-3.5 text-slate-500" />
            <span>System Settings</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              openApp('monitor');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <span>System Monitor</span>
          </button>
          <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" />
          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              setPowerState('sleeping');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Moon className="h-3.5 w-3.5 text-slate-500" />
            <span>Sleep</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              setPowerState('locked');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Lock className="h-3.5 w-3.5 text-slate-500" />
            <span>Lock Screen</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setOpenMenu(null);
              setPowerState('booting');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restart Workstation</span>
          </button>
        </div>
      )}

      {/* Control Center Popover */}
      {openMenu === 'control' && (
        <div className="absolute right-3 top-10 z-50 w-72 rounded-xl border border-slate-200 bg-white/95 p-4 text-xs text-slate-800 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <span className="font-display text-sm font-semibold">Control Center</span>
            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                openApp('settings');
              }}
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              All Settings
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateSettings({ wifiEnabled: !settings.wifiEnabled })}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                settings.wifiEnabled
                  ? 'border-blue-600/30 bg-blue-600/10 text-blue-700 dark:text-blue-300'
                  : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400'
              }`}
            >
              {settings.wifiEnabled ? <Wifi className="h-4 w-4 shrink-0" /> : <WifiOff className="h-4 w-4 shrink-0" />}
              <div className="min-w-0">
                <div className="font-medium">Wi-Fi</div>
                <div className="truncate text-[11px] opacity-80">
                  {settings.wifiEnabled ? 'Kestrel-5G' : 'Off'}
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() =>
                updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' })
              }
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-slate-800 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {settings.theme === 'dark' ? (
                <Moon className="h-4 w-4 shrink-0 text-blue-400" />
              ) : (
                <Sun className="h-4 w-4 shrink-0 text-amber-500" />
              )}
              <div className="min-w-0">
                <div className="font-medium">Appearance</div>
                <div className="text-[11px] opacity-75 capitalize">{settings.theme}</div>
              </div>
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1 flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Sun className="h-3.5 w-3.5" />
                  Display Brightness
                </span>
                <span className="tabular-nums font-mono-code">{settings.brightness}%</span>
              </div>
              <input
                type="range"
                min={35}
                max={100}
                value={settings.brightness}
                onChange={(e) => updateSettings({ brightness: Number(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center justify-between text-slate-600 dark:text-slate-300">
                <span className="inline-flex items-center gap-1.5">
                  <Volume2 className="h-3.5 w-3.5" />
                  Audio Output
                </span>
                <span className="tabular-nums font-mono-code">{settings.volume}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={settings.volume}
                onChange={(e) => updateSettings({ volume: Number(e.target.value) })}
                className="w-full accent-blue-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* Notification Center Popover */}
      {openMenu === 'notifications' && (
        <div className="absolute right-3 top-10 z-50 w-80 rounded-xl border border-slate-200 bg-white/95 p-3 text-xs text-slate-800 shadow-xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800">
            <span className="font-display text-sm font-semibold">Notifications</span>
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={clearNotifications}
                className="text-[11px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              >
                Clear All
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="py-8 text-center text-slate-500 dark:text-slate-400">
              No recent notifications
            </div>
          ) : (
            <div className="mt-2 max-h-72 space-y-1.5 overflow-y-auto os-scroll">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="flex items-start gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 p-2.5 dark:border-slate-800 dark:bg-slate-800/50"
                >
                  {n.appId && <AppIcon appId={n.appId} size="xs" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold truncate">{n.title}</span>
                      <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                        {new Date(n.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="mt-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                      {n.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* About Modal */}
      {openMenu === 'about' && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 text-slate-800 shadow-2xl dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white dark:bg-slate-800">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.9">
                    <path d="M4 17L12 4l8 13H4z" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-display text-base font-semibold">{OS_VERSION}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Workstation Simulator</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOpenMenu(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <dl className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-xs dark:border-slate-800">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Kernel</dt>
                <dd className="font-mono-code">kestrel-kernel 6.8.4</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Session User</dt>
                <dd>{settings.userName}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Memory</dt>
                <dd className="tabular-nums">16.0 GB Virtual LPDDR5</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">File System</dt>
                <dd>Persistent VFS (LocalStorage)</dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </header>
  );
};
