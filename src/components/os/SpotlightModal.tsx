import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CornerDownLeft, FileText, Folder, Search } from 'lucide-react';
import { APP_REGISTRY } from '../../os/constants';
import { useOS } from '../../os/OSContext';
import { AppDefinition, VFSFile, VFSNode } from '../../os/types';
import { getNodePath } from '../../os/vfs';
import { AppIcon } from './AppIcon';

type SearchResult =
  | { kind: 'app'; app: AppDefinition }
  | { kind: 'node'; node: VFSNode; path: string };

export const SpotlightModal: React.FC = () => {
  const { spotlightOpen, setSpotlightOpen, openApp, openFileInApp, vfs } = useOS();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (spotlightOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [spotlightOpen]);

  const results: SearchResult[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const apps = Object.values(APP_REGISTRY).filter(
      (a) => !q || a.name.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );

    const nodes = Object.values(vfs.nodes)
      .filter((n) => n.id !== vfs.rootId && n.name)
      .filter((n) => {
        if (!q) return n.parentId === 'documents' || n.parentId === 'projects';
        return n.name.toLowerCase().includes(q);
      })
      .slice(0, 8);

    const combined: SearchResult[] = [
      ...apps.map((app) => ({ kind: 'app' as const, app })),
      ...nodes.map((node) => ({
        kind: 'node' as const,
        node,
        path: getNodePath(vfs, node.id),
      })),
    ];

    return combined.slice(0, 10);
  }, [query, vfs]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [results.length]);

  if (!spotlightOpen) return null;

  const executeResult = (item: SearchResult) => {
    setSpotlightOpen(false);
    if (item.kind === 'app') {
      openApp(item.app.id);
    } else if (item.node.type === 'folder') {
      openApp('files', { path: item.path });
    } else {
      openFileInApp(item.node as VFSFile);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      executeResult(results[selectedIndex]);
    } else if (e.key === 'Escape') {
      setSpotlightOpen(false);
    }
  };

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setSpotlightOpen(false);
      }}
      className="fixed inset-0 z-[80] flex items-start justify-center bg-slate-950/45 pt-24 px-4 backdrop-blur-xs"
    >
      <div
        onKeyDown={handleKeyDown}
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95"
      >
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 py-3.5 dark:border-slate-800">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications, documents, scripts, or folders..."
            className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-slate-100"
          />
          <kbd className="rounded border border-slate-200 px-1.5 py-0.5 font-mono-code text-[10px] text-slate-500 dark:border-slate-700 dark:text-slate-400">
            ESC
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 os-scroll">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No matching applications or files found.
            </div>
          ) : (
            results.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              if (item.kind === 'app') {
                return (
                  <button
                    key={`app-${item.app.id}`}
                    type="button"
                    onClick={() => executeResult(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                      isSelected
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <AppIcon appId={item.app.id} size="sm" />
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">{item.app.name}</div>
                        <div
                          className={`text-xs truncate ${
                            isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          Application · {item.app.subtitle}
                        </div>
                      </div>
                    </div>
                    {isSelected && <CornerDownLeft className="h-4 w-4 shrink-0 opacity-80" />}
                  </button>
                );
              }

              return (
                <button
                  key={`node-${item.node.id}`}
                  type="button"
                  onClick={() => executeResult(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {item.node.type === 'folder' ? (
                        <Folder className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{item.node.name}</div>
                      <div
                        className={`font-mono-code text-[11px] truncate ${
                          isSelected ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {item.path}
                      </div>
                    </div>
                  </div>
                  {isSelected && <CornerDownLeft className="h-4 w-4 shrink-0 opacity-80" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
