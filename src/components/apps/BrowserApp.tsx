import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Code2,
  Flag,
  Gamepad2,
  Home,
  Plus,
  RotateCw,
  X,
} from 'lucide-react';
import { OS_VERSION } from '../../os/constants';
import { useOS } from '../../os/OSContext';
import { VFSFile } from '../../os/types';
import { getNodePath, resolvePath } from '../../os/vfs';

interface BrowserTab {
  id: string;
  title: string;
  url: string;
  history: string[];
  histIdx: number;
}

const BOOKMARKS = [
  { label: 'Home', url: 'kestrel://home' },
  { label: 'Docs', url: 'kestrel://docs' },
  { label: 'Minesweeper', url: 'kestrel://minesweeper' },
  { label: 'Clock Widget', url: 'vfs:///home/claire/Projects/clock-widget.html' },
];

// Playable Minesweeper mini-game for kestrel://minesweeper
const MinesweeperGame: React.FC = () => {
  const SIZE = 8;
  const MINES = 10;

  interface Cell {
    mine: boolean;
    revealed: boolean;
    flagged: boolean;
    adj: number;
  }

  const createBoard = (): Cell[][] => {
    const grid: Cell[][] = Array.from({ length: SIZE }, () =>
      Array.from({ length: SIZE }, () => ({ mine: false, revealed: false, flagged: false, adj: 0 }))
    );
    let placed = 0;
    while (placed < MINES) {
      const r = Math.floor(Math.random() * SIZE);
      const c = Math.floor(Math.random() * SIZE);
      if (!grid[r][c].mine) {
        grid[r][c].mine = true;
        placed++;
      }
    }
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c].mine) continue;
        let count = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE && grid[nr][nc].mine) count++;
          }
        }
        grid[r][c].adj = count;
      }
    }
    return grid;
  };

  const [board, setBoard] = useState<Cell[][]>(createBoard);
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const reset = () => {
    setBoard(createBoard());
    setStatus('playing');
  };

  const reveal = (r: number, c: number) => {
    if (status !== 'playing') return;
    setBoard((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      if (next[r][c].revealed || next[r][c].flagged) return prev;

      if (next[r][c].mine) {
        for (let i = 0; i < SIZE; i++) {
          for (let j = 0; j < SIZE; j++) {
            if (next[i][j].mine) next[i][j].revealed = true;
          }
        }
        setStatus('lost');
        return next;
      }

      const flood = (row: number, col: number) => {
        if (row < 0 || row >= SIZE || col < 0 || col >= SIZE) return;
        const cell = next[row][col];
        if (cell.revealed || cell.flagged || cell.mine) return;
        cell.revealed = true;
        if (cell.adj === 0) {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              flood(row + dr, col + dc);
            }
          }
        }
      };
      flood(r, c);

      let unrevealedSafe = 0;
      for (let i = 0; i < SIZE; i++) {
        for (let j = 0; j < SIZE; j++) {
          if (!next[i][j].mine && !next[i][j].revealed) unrevealedSafe++;
        }
      }
      if (unrevealedSafe === 0) setStatus('won');
      return next;
    });
  };

  const toggleFlag = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (status !== 'playing') return;
    setBoard((prev) => {
      const next = prev.map((row) => row.map((cell) => ({ ...cell })));
      if (!next[r][c].revealed) next[r][c].flagged = !next[r][c].flagged;
      return next;
    });
  };

  return (
    <div className="mx-auto max-w-md py-8 px-4 text-center">
      <div className="flex items-center justify-between mb-4">
        <div className="text-left">
          <h2 className="font-display text-lg font-semibold">Minesweeper</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Left-click to reveal · Right-click to flag
          </p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          New Game
        </button>
      </div>

      {status !== 'playing' && (
        <div
          className={`mb-4 rounded-lg px-3 py-2 text-xs font-semibold ${
            status === 'won'
              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
              : 'bg-red-500/15 text-red-700 dark:text-red-300'
          }`}
        >
          {status === 'won' ? 'Board cleared! You won.' : 'Mine detonated. Try again.'}
        </div>
      )}

      <div className="inline-grid grid-cols-8 gap-1 rounded-xl border border-slate-200 bg-slate-100 p-2 dark:border-slate-800 dark:bg-slate-950">
        {board.map((row, r) =>
          row.map((cell, c) => (
            <button
              key={`${r}-${c}`}
              type="button"
              onClick={() => reveal(r, c)}
              onContextMenu={(e) => toggleFlag(e, r, c)}
              className={`flex h-9 w-9 items-center justify-center rounded-md font-mono-code text-xs font-bold transition-colors ${
                cell.revealed
                  ? cell.mine
                    ? 'bg-red-600 text-white'
                    : 'bg-white text-slate-800 dark:bg-slate-800 dark:text-slate-100'
                  : 'bg-slate-300 hover:bg-slate-400/70 dark:bg-slate-700 dark:hover:bg-slate-600'
              }`}
            >
              {cell.revealed ? (
                cell.mine ? (
                  '×'
                ) : cell.adj > 0 ? (
                  cell.adj
                ) : (
                  ''
                )
              ) : cell.flagged ? (
                <Flag className="h-3.5 w-3.5 text-amber-500" />
              ) : (
                ''
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export const BrowserApp: React.FC = () => {
  const { vfs, openApp, settings } = useOS();

  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'Kestrel Start',
      url: 'kestrel://home',
      history: ['kestrel://home'],
      histIdx: 0,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState('tab-1');
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? tabs[0];
  const [urlInput, setUrlInput] = useState(activeTab.url);

  const htmlFiles = useMemo(() => {
    return Object.values(vfs.nodes).filter(
      (n): n is VFSFile =>
        n.type === 'file' &&
        n.parentId !== 'trash' &&
        (n.name.endsWith('.html') || n.name.endsWith('.htm'))
    );
  }, [vfs]);

  const titleForUrl = (url: string): string => {
    if (url === 'kestrel://home') return 'Kestrel Start';
    if (url === 'kestrel://docs') return 'OS Reference';
    if (url === 'kestrel://minesweeper') return 'Minesweeper';
    if (url.startsWith('vfs://')) return url.split('/').pop() || 'Local File';
    return url;
  };

  const navigate = (targetUrl: string) => {
    const clean = targetUrl.trim();
    if (!clean) return;
    setUrlInput(clean);
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== activeTab.id) return t;
        const nextHist = [...t.history.slice(0, t.histIdx + 1), clean];
        return {
          ...t,
          url: clean,
          title: titleForUrl(clean),
          history: nextHist,
          histIdx: nextHist.length - 1,
        };
      })
    );
  };

  const goBack = () => {
    if (activeTab.histIdx <= 0) return;
    const nextIdx = activeTab.histIdx - 1;
    const targetUrl = activeTab.history[nextIdx];
    setUrlInput(targetUrl);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id
          ? { ...t, histIdx: nextIdx, url: targetUrl, title: titleForUrl(targetUrl) }
          : t
      )
    );
  };

  const goForward = () => {
    if (activeTab.histIdx >= activeTab.history.length - 1) return;
    const nextIdx = activeTab.histIdx + 1;
    const targetUrl = activeTab.history[nextIdx];
    setUrlInput(targetUrl);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTab.id
          ? { ...t, histIdx: nextIdx, url: targetUrl, title: titleForUrl(targetUrl) }
          : t
      )
    );
  };

  const addTab = () => {
    const id = `tab-${Date.now()}`;
    const tab: BrowserTab = {
      id,
      title: 'Kestrel Start',
      url: 'kestrel://home',
      history: ['kestrel://home'],
      histIdx: 0,
    };
    setTabs((prev) => [...prev, tab]);
    setActiveTabId(id);
    setUrlInput(tab.url);
  };

  const closeTab = (id: string) => {
    if (tabs.length === 1) return;
    const next = tabs.filter((t) => t.id !== id);
    setTabs(next);
    if (activeTabId === id) {
      setActiveTabId(next[0].id);
      setUrlInput(next[0].url);
    }
  };

  const renderPage = () => {
    const url = activeTab.url;

    if (!settings.wifiEnabled && !url.startsWith('kestrel://') && !url.startsWith('vfs://')) {
      return (
        <div className="flex h-full flex-col items-center justify-center p-8 text-center">
          <h2 className="font-display text-lg font-semibold">Network Offline</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Wi-Fi is disabled in Control Center. Local kestrel:// and vfs:// pages remain available.
          </p>
        </div>
      );
    }

    if (url === 'kestrel://home') {
      return (
        <div className="mx-auto max-w-2xl px-6 py-10">
          <h1 className="font-display text-2xl font-bold tracking-tight">Kestrel Surf</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Local workstation intranet and VFS HTML sandbox.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => navigate('kestrel://docs')}
              className="flex flex-col items-start rounded-xl border border-slate-200 p-4 text-left hover:border-blue-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 transition-colors"
            >
              <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400 mb-3" />
              <div className="font-display text-sm font-semibold">OS Reference</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Shell commands & shortcuts
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('kestrel://minesweeper')}
              className="flex flex-col items-start rounded-xl border border-slate-200 p-4 text-left hover:border-blue-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 transition-colors"
            >
              <Gamepad2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mb-3" />
              <div className="font-display text-sm font-semibold">Minesweeper</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Playable 8×8 logic puzzle
              </div>
            </button>

            <button
              type="button"
              onClick={() => openApp('code')}
              className="flex flex-col items-start rounded-xl border border-slate-200 p-4 text-left hover:border-blue-500 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50 transition-colors"
            >
              <Code2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mb-3" />
              <div className="font-display text-sm font-semibold">Code Studio</div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Author local HTML pages
              </div>
            </button>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
            <h2 className="font-display text-sm font-semibold text-slate-700 dark:text-slate-200">
              Local HTML Files in VFS
            </h2>
            <div className="mt-3 space-y-2">
              {htmlFiles.map((file) => {
                const path = getNodePath(vfs, file.id);
                return (
                  <button
                    key={file.id}
                    type="button"
                    onClick={() => navigate(`vfs://${path}`)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                  >
                    <span className="font-medium">{file.name}</span>
                    <span className="font-mono-code text-slate-500 dark:text-slate-400">
                      vfs://{path}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    if (url === 'kestrel://docs') {
      return (
        <div className="mx-auto max-w-2xl px-6 py-8 space-y-6">
          <div>
            <h1 className="font-display text-2xl font-bold">{OS_VERSION} Guide</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Keyboard shortcuts, window compositor gestures, and shell capabilities.
            </p>
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-5 text-sm dark:border-slate-800">
            <h2 className="font-display text-base font-semibold">Window Compositor</h2>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <li>Drag any window to the left, right, or top screen edge to snap half-screen or maximize.</li>
              <li>Double-click a window titlebar to toggle fullscreen maximize.</li>
              <li>Drag any edge or corner of a window to resize dynamically.</li>
              <li>Press Ctrl+K (or Cmd+K) anywhere to open Spotlight Quick Launcher.</li>
            </ul>
          </div>

          <div className="space-y-3 border-t border-slate-200 pt-5 text-sm dark:border-slate-800">
            <h2 className="font-display text-base font-semibold">Virtual File System</h2>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-300">
              Files created or edited in Terminal, Files, Notes, or Code Studio share the same persistent storage tree and survive browser refreshes.
            </p>
          </div>
        </div>
      );
    }

    if (url === 'kestrel://minesweeper') {
      return <MinesweeperGame />;
    }

    if (url.startsWith('vfs://')) {
      const path = url.slice('vfs://'.length);
      const node = resolvePath(vfs, path, 'claire');
      if (node && node.type === 'file') {
        return (
          <iframe
            title={node.name}
            sandbox="allow-scripts"
            srcDoc={(node as VFSFile).content}
            className="h-full w-full bg-white"
          />
        );
      }
      return (
        <div className="p-8 text-center text-sm text-slate-500">
          404 — VFS path <code className="font-mono-code">{path}</code> not found.
        </div>
      );
    }

    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <h2 className="font-display text-lg font-semibold">Sandboxed Offline Browser</h2>
        <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          External URLs like <span className="font-mono-code">{url}</span> cannot be loaded in the hermetic workstation sandbox. Try{' '}
          <button
            type="button"
            onClick={() => navigate('kestrel://home')}
            className="text-blue-600 hover:underline dark:text-blue-400"
          >
            kestrel://home
          </button>{' '}
          or open a local <span className="font-mono-code">vfs://</span> HTML file.
        </p>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Tab Strip */}
      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-100/80 px-2 pt-1.5 dark:border-slate-800 dark:bg-slate-950">
        {tabs.map((tab) => {
          const active = tab.id === activeTab.id;
          return (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
                setUrlInput(tab.url);
              }}
              className={`group flex max-w-[180px] cursor-pointer items-center justify-between gap-2 rounded-t-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? 'bg-white text-slate-900 dark:bg-slate-900 dark:text-white'
                  : 'text-slate-500 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              <span className="truncate">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(tab.id);
                  }}
                  className="rounded p-0.5 opacity-60 hover:bg-slate-200 hover:opacity-100 dark:hover:bg-slate-700"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
        <button
          type="button"
          onClick={addTab}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800"
          title="New Tab"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Address Bar */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
        <button
          type="button"
          onClick={goBack}
          disabled={activeTab.histIdx <= 0}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-35 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={goForward}
          disabled={activeTab.histIdx >= activeTab.history.length - 1}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-35 dark:hover:bg-slate-800"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => navigate(activeTab.url)}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <RotateCw className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => navigate('kestrel://home')}
          className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Home className="h-3.5 w-3.5" />
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(urlInput);
          }}
          className="flex-1"
        >
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 font-mono-code text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          />
        </form>
      </div>

      {/* Bookmarks Strip */}
      <div className="flex items-center gap-3 border-b border-slate-200 px-3 py-1 text-[11px] text-slate-600 dark:border-slate-800 dark:text-slate-400">
        {BOOKMARKS.map((bm) => (
          <button
            key={bm.url}
            type="button"
            onClick={() => navigate(bm.url)}
            className="hover:text-slate-900 dark:hover:text-white whitespace-nowrap"
          >
            {bm.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto os-scroll">{renderPage()}</div>
    </div>
  );
};
