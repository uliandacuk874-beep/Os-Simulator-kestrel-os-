import React, { useEffect, useState } from 'react';
import { ArrowRight, Lock, Moon, Power, RotateCcw } from 'lucide-react';
import { OS_VERSION, USER_AVATAR_SRC, WALLPAPERS } from '../../os/constants';
import { useOS } from '../../os/OSContext';

const BOOT_STAGES = [
  'Initializing kestrel-kernel 6.8.4',
  'Mounting virtual file system at /',
  'Starting window compositor surface',
  'Restoring user session environment',
];

export const BootAndLockScreen: React.FC = () => {
  const { powerState, setPowerState, settings } = useOS();
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [now, setNow] = useState(() => new Date());
  const [avatarFailed, setAvatarFailed] = useState(false);

  useEffect(() => {
    if (powerState !== 'booting') return;
    setProgress(0);
    setStageIdx(0);

    const start = Date.now();
    const duration = 1250;
    const timer = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);
      setStageIdx(Math.min(BOOT_STAGES.length - 1, Math.floor((pct / 100) * BOOT_STAGES.length)));
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => setPowerState('locked'), 160);
      }
    }, 35);

    return () => clearInterval(timer);
  }, [powerState, setPowerState]);

  useEffect(() => {
    if (powerState !== 'locked' && powerState !== 'sleeping') return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [powerState]);

  useEffect(() => {
    if (powerState !== 'locked') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setPowerState('desktop');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [powerState, setPowerState]);

  if (powerState === 'desktop') return null;

  if (powerState === 'sleeping') {
    return (
      <div
        onClick={() => setPowerState('locked')}
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-slate-300 cursor-pointer"
      >
        <Moon className="h-8 w-8 mb-4 text-slate-400" />
        <p className="font-display text-lg font-medium text-white">Workstation Asleep</p>
        <p className="mt-1 text-sm text-slate-400">Click anywhere to wake</p>
      </div>
    );
  }

  if (powerState === 'booting') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-6">
        <div className="w-full max-w-sm flex flex-col items-center">
          <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 shadow-lg">
            <svg viewBox="0 0 24 24" className="h-7 w-7 text-slate-100" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 17L12 4l8 13H4z" strokeLinejoin="round" />
              <path d="M9 17l3-5 3 5" strokeLinejoin="round" />
            </svg>
          </div>

          <h1 className="font-display text-xl font-semibold tracking-tight text-white">
            Kestrel OS
          </h1>

          <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-slate-100 transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="mt-3 flex w-full items-center justify-between text-xs text-slate-400">
            <span className="truncate">{BOOT_STAGES[stageIdx]}</span>
            <span className="font-mono-code tabular-nums ml-3">{progress}%</span>
          </div>

          <button
            type="button"
            onClick={() => setPowerState('desktop')}
            className="mt-8 px-4 py-1.5 text-xs font-medium text-slate-300 border border-slate-800 rounded-lg hover:bg-slate-900 hover:text-white transition-colors"
          >
            Skip Boot
          </button>
        </div>
      </div>
    );
  }

  // Locked screen
  const wallpaper = WALLPAPERS.find((w) => w.id === settings.wallpaperId) ?? WALLPAPERS[0];
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-between overflow-hidden bg-slate-950 text-white">
      {/* Wallpaper backdrop */}
      {wallpaper.kind === 'image' && wallpaper.src ? (
        <img
          src={wallpaper.src}
          alt={wallpaper.name}
          referrerPolicy="no-referrer"
          className="absolute inset-0 h-full w-full object-cover scale-105 blur-md opacity-70"
        />
      ) : (
        <div className="absolute inset-0" style={{ background: wallpaper.css }} />
      )}
      <div className="absolute inset-0 bg-slate-950/55" />

      {/* Top date/time */}
      <div className="relative z-10 flex flex-col items-center pt-16 text-center">
        <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-slate-200">
          <Lock className="h-3.5 w-3.5" />
          <span>{OS_VERSION}</span>
        </div>
        <div className="mt-3 font-display text-6xl font-semibold tracking-tight tabular-nums text-white sm:text-7xl">
          {timeStr}
        </div>
        <p className="mt-2 text-base font-medium text-slate-200">{dateStr}</p>
      </div>

      {/* User Unlock Card */}
      <div className="relative z-10 flex flex-col items-center pb-14">
        <div className="flex flex-col items-center">
          <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-white/30 bg-slate-800 shadow-xl">
            {!avatarFailed ? (
              <img
                src={USER_AVATAR_SRC}
                alt={settings.userName}
                referrerPolicy="no-referrer"
                onError={() => setAvatarFailed(true)}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-2xl font-semibold text-white">
                {settings.userName.charAt(0)}
              </div>
            )}
          </div>
          <h2 className="mt-4 font-display text-xl font-semibold text-white">
            {settings.userName}
          </h2>
          <p className="mt-0.5 text-xs text-slate-300">Local Workstation Session</p>

          <button
            type="button"
            onClick={() => setPowerState('desktop')}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg hover:bg-slate-100 active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span>Sign In</span>
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="mt-3 text-xs text-slate-300/80">Press Enter to unlock</p>
        </div>

        <div className="mt-10 flex items-center gap-6 text-xs text-slate-300">
          <button
            type="button"
            onClick={() => setPowerState('sleeping')}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Moon className="h-3.5 w-3.5" />
            <span>Sleep</span>
          </button>
          <button
            type="button"
            onClick={() => setPowerState('booting')}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Restart</span>
          </button>
          <button
            type="button"
            onClick={() => setPowerState('booting')}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Power className="h-3.5 w-3.5" />
            <span>Reboot Kernel</span>
          </button>
        </div>
      </div>
    </div>
  );
};
