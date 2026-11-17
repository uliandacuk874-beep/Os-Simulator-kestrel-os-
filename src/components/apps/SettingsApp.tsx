import React, { useState } from 'react';
import { HardDrive, Image, Monitor, Moon, Palette, RotateCcw, Sun } from 'lucide-react';
import { ACCENT_TOKENS, OS_VERSION, USER_AVATAR_SRC, WALLPAPERS } from '../../os/constants';
import { useOS } from '../../os/OSContext';
import { AccentColor, OSWindow } from '../../os/types';
import { computeVFSBytes, formatBytes } from '../../os/vfs';

interface SettingsAppProps {
  win: OSWindow;
}

type SettingsTab = 'appearance' | 'wallpaper' | 'dock' | 'system';

export const SettingsApp: React.FC<SettingsAppProps> = ({ win }) => {
  const { settings, updateSettings, vfs, resetVFS, setPowerState } = useOS();
  const [tab, setTab] = useState<SettingsTab>(() =>
    win.payload?.path === 'wallpaper' ? 'wallpaper' : 'appearance'
  );
  const [confirmReset, setConfirmReset] = useState(false);

  const navItems: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'wallpaper', label: 'Wallpaper', icon: Image },
    { id: 'dock', label: 'Dock & Display', icon: Monitor },
    { id: 'system', label: 'Storage & Reset', icon: HardDrive },
  ];

  const vfsSize = formatBytes(computeVFSBytes(vfs));

  return (
    <div className="flex h-full bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-52 shrink-0 border-r border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
        {/* User Profile Card */}
        <div className="mb-4 flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-2.5 dark:border-slate-800 dark:bg-slate-900">
          <img
            src={USER_AVATAR_SRC}
            alt={settings.userName}
            referrerPolicy="no-referrer"
            className="h-9 w-9 rounded-full object-cover"
          />
          <div className="min-w-0">
            <div className="truncate text-xs font-semibold">{settings.userName}</div>
            <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              Local Administrator
            </div>
          </div>
        </div>

        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main Panel */}
      <div className="flex-1 overflow-y-auto p-6 os-scroll">
        {tab === 'appearance' && (
          <div className="max-w-lg space-y-6">
            <div>
              <h2 className="font-display text-lg font-semibold">Appearance</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Customize Kestrel OS window surfaces and color theme.
              </p>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <div className="text-xs font-semibold">Theme Mode</div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => updateSettings({ theme: 'light' })}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    settings.theme === 'light'
                      ? 'border-blue-600 bg-blue-50/70 text-slate-900 dark:bg-blue-950/30 dark:text-white'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Sun className="h-5 w-5 text-amber-500" />
                  <div>
                    <div className="text-xs font-semibold">Light</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Daylight paper</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => updateSettings({ theme: 'dark' })}
                  className={`flex items-center gap-3 rounded-xl border p-3.5 text-left transition-colors ${
                    settings.theme === 'dark'
                      ? 'border-blue-600 bg-blue-50/70 text-slate-900 dark:bg-blue-950/30 dark:text-white'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <Moon className="h-5 w-5 text-blue-400" />
                  <div>
                    <div className="text-xs font-semibold">Dark</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">Studio slate</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <div className="text-xs font-semibold">Accent Color</div>
              <div className="flex flex-wrap gap-3">
                {(Object.keys(ACCENT_TOKENS) as AccentColor[]).map((key) => {
                  const tok = ACCENT_TOKENS[key];
                  const selected = settings.accent === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => updateSettings({ accent: key })}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                        selected
                          ? 'border-slate-900 bg-slate-100 dark:border-white dark:bg-slate-800'
                          : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full"
                        style={{ backgroundColor: tok.swatch }}
                      />
                      <span>{tok.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 pt-5 dark:border-slate-800">
              <div>
                <div className="text-xs font-semibold">Window Translucency</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Apply subtle backdrop blur behind floating windows
                </div>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ translucentWindows: !settings.translucentWindows })}
                className={`h-6 w-11 rounded-full p-0.5 transition-colors ${
                  settings.translucentWindows ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                aria-label="Toggle window translucency"
              >
                <span
                  className={`block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    settings.translucentWindows ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {tab === 'wallpaper' && (
          <div className="max-w-xl space-y-5">
            <div>
              <h2 className="font-display text-lg font-semibold">Desktop Wallpaper</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Select a photographic backdrop or minimalist studio surface.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {WALLPAPERS.map((wp) => {
                const selected = settings.wallpaperId === wp.id;
                return (
                  <button
                    key={wp.id}
                    type="button"
                    onClick={() => updateSettings({ wallpaperId: wp.id })}
                    className={`group overflow-hidden rounded-xl border text-left transition-all ${
                      selected
                        ? 'border-blue-600 ring-2 ring-blue-500/30'
                        : 'border-slate-200 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="aspect-video w-full overflow-hidden bg-slate-900">
                      {wp.kind === 'image' && wp.src ? (
                        <img
                          src={wp.src}
                          alt={wp.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="h-full w-full" style={{ background: wp.css }} />
                      )}
                    </div>
                    <div className="flex items-center justify-between px-3 py-2 text-xs font-medium">
                      <span>{wp.name}</span>
                      {selected && (
                        <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'dock' && (
          <div className="max-w-lg space-y-6">
            <div>
              <h2 className="font-display text-lg font-semibold">Dock & Display</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Adjust dock icon sizing and screen luminance.
              </p>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <div className="text-xs font-semibold">Dock Icon Size</div>
              <div className="flex items-center gap-2">
                {(['compact', 'standard', 'large'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => updateSettings({ dockSize: sz })}
                    className={`rounded-lg border px-4 py-2 text-xs font-medium capitalize transition-colors ${
                      settings.dockSize === sz
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : 'border-slate-200 hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-200 pt-5 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Display Brightness</span>
                <span className="font-mono-code tabular-nums">{settings.brightness}%</span>
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
          </div>
        )}

        {tab === 'system' && (
          <div className="max-w-lg space-y-6">
            <div>
              <h2 className="font-display text-lg font-semibold">Storage & Kernel</h2>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Inspect virtual file system allocation and manage session state.
              </p>
            </div>

            <dl className="space-y-2.5 border-t border-slate-200 pt-5 text-xs dark:border-slate-800">
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">System Release</dt>
                <dd className="font-medium">{OS_VERSION}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">VFS Used Storage</dt>
                <dd className="font-mono-code tabular-nums">{vfsSize}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500 dark:text-slate-400">Total VFS Nodes</dt>
                <dd className="font-mono-code tabular-nums">{Object.keys(vfs.nodes).length}</dd>
              </div>
            </dl>

            <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <div className="text-xs font-semibold">Session Actions</div>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => setPowerState('locked')}
                  className="rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  Lock Screen
                </button>
                <button
                  type="button"
                  onClick={() => setPowerState('booting')}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reboot Kernel</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 border-t border-slate-200 pt-5 dark:border-slate-800">
              <div className="text-xs font-semibold text-red-600 dark:text-red-400">
                Reset Virtual File System
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Restores default folders and starter files. Custom files will be removed.
              </p>
              {!confirmReset ? (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="rounded-lg border border-red-300 px-3.5 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  Reset VFS to Factory Defaults
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      resetVFS();
                      setConfirmReset(false);
                    }}
                    className="rounded-lg bg-red-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Confirm Reset
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
