import React, { useRef, useState } from 'react';
import { Maximize2, Minimize2, Minus, X } from 'lucide-react';
import { APP_REGISTRY } from '../../os/constants';
import { useOS } from '../../os/OSContext';
import { OSWindow } from '../../os/types';
import { AppIcon } from './AppIcon';

interface WindowFrameProps {
  win: OSWindow;
  children: React.ReactNode;
}

type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const WindowFrame: React.FC<WindowFrameProps> = ({ win, children }) => {
  const {
    activeWindowId,
    focusWindow,
    closeWindow,
    minimizeWindow,
    toggleMaximizeWindow,
    updateWindowBounds,
    snapWindow,
    settings,
  } = useOS();

  const [snapPreview, setSnapPreview] = useState<'left' | 'right' | 'full' | null>(null);
  const interactionRef = useRef<{
    type: 'drag' | 'resize';
    dir?: ResizeDir;
    startX: number;
    startY: number;
    startBounds: OSWindow['bounds'];
  } | null>(null);

  if (win.isMinimized) return null;

  const isFocused = activeWindowId === win.id;
  const def = APP_REGISTRY[win.appId];

  const handleTitlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    e.preventDefault();
    focusWindow(win.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startBounds = { ...win.bounds };
    interactionRef.current = { type: 'drag', startX, startY, startBounds };

    const onMove = (ev: PointerEvent) => {
      if (!interactionRef.current) return;
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const nextX = Math.max(-startBounds.width + 120, Math.min(vw - 120, startBounds.x + dx));
      const nextY = Math.max(38, Math.min(vh - 96, startBounds.y + dy));

      if (ev.clientX <= 14) setSnapPreview('left');
      else if (ev.clientX >= vw - 14) setSnapPreview('right');
      else if (ev.clientY <= 42) setSnapPreview('full');
      else setSnapPreview(null);

      updateWindowBounds(win.id, {
        ...startBounds,
        x: nextX,
        y: nextY,
      });
    };

    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const vw = window.innerWidth;
      if (ev.clientX <= 14) snapWindow(win.id, 'left');
      else if (ev.clientX >= vw - 14) snapWindow(win.id, 'right');
      else if (ev.clientY <= 42) snapWindow(win.id, 'full');
      setSnapPreview(null);
      interactionRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleResizePointerDown = (dir: ResizeDir) => (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    focusWindow(win.id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startBounds = { ...win.bounds };

    const onMove = (ev: PointerEvent) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      let { x, y, width, height } = startBounds;

      if (dir.includes('e')) {
        width = Math.max(def.minWidth, startBounds.width + dx);
      }
      if (dir.includes('s')) {
        height = Math.max(def.minHeight, startBounds.height + dy);
      }
      if (dir.includes('w')) {
        const nextW = Math.max(def.minWidth, startBounds.width - dx);
        x = startBounds.x + (startBounds.width - nextW);
        width = nextW;
      }
      if (dir.includes('n')) {
        const nextH = Math.max(def.minHeight, startBounds.height - dy);
        const proposedY = startBounds.y + (startBounds.height - nextH);
        if (proposedY >= 38) {
          y = proposedY;
          height = nextH;
        }
      }

      updateWindowBounds(win.id, { x, y, width, height });
    };

    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const surfaceClass = settings.translucentWindows
    ? 'bg-white/92 dark:bg-slate-900/92 backdrop-blur-xl'
    : 'bg-white dark:bg-slate-900';

  return (
    <>
      {/* Snap zone visual preview */}
      {snapPreview && (
        <div
          className="pointer-events-none fixed z-30 rounded-xl border-2 border-blue-500/70 bg-blue-500/15 backdrop-blur-xs transition-all duration-100"
          style={
            snapPreview === 'left'
              ? { left: 8, top: 42, width: 'calc(50% - 12px)', height: 'calc(100vh - 128px)' }
              : snapPreview === 'right'
              ? { right: 8, top: 42, width: 'calc(50% - 12px)', height: 'calc(100vh - 128px)' }
              : { left: 8, top: 42, width: 'calc(100vw - 16px)', height: 'calc(100vh - 128px)' }
          }
        />
      )}

      <section
        role="dialog"
        aria-label={win.title}
        onMouseDown={() => {
          if (!isFocused) focusWindow(win.id);
        }}
        style={{
          left: win.bounds.x,
          top: win.bounds.y,
          width: win.bounds.width,
          height: win.bounds.height,
          zIndex: win.zIndex,
        }}
        className={`animate-window-in fixed flex flex-col overflow-hidden rounded-xl border select-text transition-shadow duration-150 ${surfaceClass} ${
          isFocused
            ? 'border-slate-300 shadow-[0_24px_60px_-15px_rgba(15,23,42,0.45)] dark:border-slate-700 dark:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.75)]'
            : 'border-slate-200/80 shadow-lg opacity-95 dark:border-slate-800'
        }`}
      >
        {/* Titlebar */}
        <div
          onPointerDown={handleTitlePointerDown}
          onDoubleClick={() => toggleMaximizeWindow(win.id)}
          className={`flex h-10 shrink-0 items-center justify-between border-b px-3 select-none cursor-grab active:cursor-grabbing ${
            isFocused
              ? 'border-slate-200 bg-slate-50/90 dark:border-slate-800 dark:bg-slate-900/95'
              : 'border-slate-200/70 bg-slate-100/70 dark:border-slate-800/80 dark:bg-slate-950/70'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <AppIcon appId={win.appId} size="xs" />
            <span className="truncate font-display text-xs font-semibold text-slate-800 dark:text-slate-100">
              {win.title}
            </span>
            <span className="hidden sm:inline font-mono-code text-[10px] text-slate-400 dark:text-slate-500">
              PID {win.pid}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => minimizeWindow(win.id)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              title="Minimize"
              aria-label="Minimize window"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => toggleMaximizeWindow(win.id)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-slate-200/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
              title={win.isMaximized ? 'Restore' : 'Maximize'}
              aria-label={win.isMaximized ? 'Restore window' : 'Maximize window'}
            >
              {win.isMaximized ? (
                <Minimize2 className="h-3.5 w-3.5" />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => closeWindow(win.id)}
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-500 hover:bg-red-500 hover:text-white dark:text-slate-400 dark:hover:bg-red-600 dark:hover:text-white transition-colors"
              title="Close"
              aria-label="Close window"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* App Viewport */}
        <div className="relative flex-1 overflow-hidden text-slate-900 dark:text-slate-100">
          {children}
        </div>

        {/* 8-Edge Resize Handles */}
        {!win.isMaximized && (
          <>
            <div onPointerDown={handleResizePointerDown('n')} className="absolute inset-x-2 top-0 h-1 cursor-n-resize" />
            <div onPointerDown={handleResizePointerDown('s')} className="absolute inset-x-2 bottom-0 h-1.5 cursor-s-resize" />
            <div onPointerDown={handleResizePointerDown('w')} className="absolute inset-y-2 left-0 w-1.5 cursor-w-resize" />
            <div onPointerDown={handleResizePointerDown('e')} className="absolute inset-y-2 right-0 w-1.5 cursor-e-resize" />
            <div onPointerDown={handleResizePointerDown('nw')} className="absolute top-0 left-0 h-3 w-3 cursor-nw-resize" />
            <div onPointerDown={handleResizePointerDown('ne')} className="absolute top-0 right-0 h-3 w-3 cursor-ne-resize" />
            <div onPointerDown={handleResizePointerDown('sw')} className="absolute bottom-0 left-0 h-3 w-3 cursor-sw-resize" />
            <div onPointerDown={handleResizePointerDown('se')} className="absolute bottom-0 right-0 h-3.5 w-3.5 cursor-se-resize" />
          </>
        )}
      </section>
    </>
  );
};
