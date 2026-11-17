import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ChevronRight,
  Code2,
  FilePlus,
  FileText,
  Folder,
  FolderPlus,
  HardDrive,
  Home,
  Image as ImageIcon,
  LayoutGrid,
  List,
  Pencil,
  RotateCcw,
  Search,
  Trash2,
} from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { OSWindow, VFSFile, VFSNode } from '../../os/types';
import { formatBytes, getChildren, getNodePath, resolvePath } from '../../os/vfs';

interface FilesAppProps {
  win: OSWindow;
}

const SIDEBAR_LOCATIONS = [
  { id: 'claire', label: 'Home', icon: Home },
  { id: 'desktop', label: 'Desktop', icon: HardDrive },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'projects', label: 'Projects', icon: Code2 },
  { id: 'pictures', label: 'Pictures', icon: ImageIcon },
  { id: 'trash', label: 'Trash', icon: Trash2 },
];

export const FilesApp: React.FC<FilesAppProps> = ({ win }) => {
  const {
    vfs,
    createFile,
    createFolder,
    renameNode,
    moveToTrash,
    restoreFromTrash,
    deletePermanent,
    emptyTrash,
    openFileInApp,
    pushNotification,
  } = useOS();

  const [currentFolderId, setCurrentFolderId] = useState<string>(() => {
    if (win.payload?.path) {
      const node = resolvePath(vfs, win.payload.path, 'claire');
      if (node && node.type === 'folder') return node.id;
    }
    return 'claire';
  });
  const [history, setHistory] = useState<string[]>([currentFolderId]);
  const [historyIdx, setHistoryIdx] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [creatingMode, setCreatingMode] = useState<'file' | 'folder' | null>(null);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (win.payload?.path) {
      const node = resolvePath(vfs, win.payload.path, 'claire');
      if (node && node.type === 'folder') {
        setCurrentFolderId(node.id);
      }
    }
  }, [win.payload?.path, vfs]);

  const navigateTo = (folderId: string) => {
    if (!vfs.nodes[folderId] || vfs.nodes[folderId].type !== 'folder') return;
    if (folderId === currentFolderId) return;
    const nextHist = history.slice(0, historyIdx + 1);
    nextHist.push(folderId);
    setHistory(nextHist);
    setHistoryIdx(nextHist.length - 1);
    setCurrentFolderId(folderId);
    setSelectedId(null);
    setSearch('');
  };

  const goBack = () => {
    if (historyIdx > 0) {
      const prevIdx = historyIdx - 1;
      setHistoryIdx(prevIdx);
      setCurrentFolderId(history[prevIdx]);
      setSelectedId(null);
    }
  };

  const currentFolder = vfs.nodes[currentFolderId] ?? vfs.nodes['claire'];
  const currentPath = getNodePath(vfs, currentFolder.id);
  const isTrash = currentFolder.id === 'trash';

  const items = useMemo(() => {
    const children = getChildren(vfs, currentFolder.id);
    const q = search.trim().toLowerCase();
    if (!q) return children;
    return children.filter((c) => c.name.toLowerCase().includes(q));
  }, [vfs, currentFolder.id, search]);

  const breadcrumbs = useMemo(() => {
    const chain: { id: string; label: string }[] = [];
    let curr: VFSNode | undefined = currentFolder;
    let guard = 0;
    while (curr && guard < 32) {
      chain.unshift({ id: curr.id, label: curr.id === vfs.rootId ? '/' : curr.name });
      curr = curr.parentId ? vfs.nodes[curr.parentId] : undefined;
      guard++;
    }
    return chain;
  }, [currentFolder, vfs]);

  const selectedNode = selectedId ? vfs.nodes[selectedId] : null;

  const handleOpenNode = (node: VFSNode) => {
    if (node.type === 'folder') {
      navigateTo(node.id);
    } else {
      openFileInApp(node as VFSFile);
    }
  };

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) {
      setCreatingMode(null);
      return;
    }
    if (creatingMode === 'folder') {
      const created = createFolder(currentFolder.id, trimmed);
      if (!created) pushNotification('Name Conflict', `Folder "${trimmed}" already exists.`, 'files');
    } else if (creatingMode === 'file') {
      const fileName = trimmed.includes('.') ? trimmed : `${trimmed}.md`;
      const created = createFile(currentFolder.id, fileName, '');
      if (!created) pushNotification('Name Conflict', `File "${fileName}" already exists.`, 'files');
    }
    setNewName('');
    setCreatingMode(null);
  };

  const submitRename = (nodeId: string) => {
    if (renameValue.trim()) {
      const ok = renameNode(nodeId, renameValue.trim());
      if (!ok) pushNotification('Rename Failed', 'Another item already uses that name.', 'files');
    }
    setRenamingId(null);
  };

  const renderNodeIcon = (node: VFSNode) => {
    if (node.type === 'folder') {
      return <Folder className="h-5 w-5 text-sky-600 dark:text-sky-400" />;
    }
    const file = node as VFSFile;
    if (file.mimeType.startsWith('image/') || file.imageSrc) {
      return <ImageIcon className="h-5 w-5 text-rose-500 dark:text-rose-400" />;
    }
    if (
      file.name.endsWith('.js') ||
      file.name.endsWith('.html') ||
      file.name.endsWith('.css') ||
      file.name.endsWith('.json')
    ) {
      return <Code2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
    }
    return <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400" />;
  };

  return (
    <div className="flex h-full bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <aside className="w-48 shrink-0 border-r border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="mb-2 px-2 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          Locations
        </div>
        <nav className="space-y-0.5">
          {SIDEBAR_LOCATIONS.map((loc) => {
            const Icon = loc.icon;
            const active = currentFolder.id === loc.id;
            return (
              <button
                key={loc.id}
                type="button"
                onClick={() => navigateTo(loc.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{loc.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-6 px-2 text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400">
          System
        </div>
        <button
          type="button"
          onClick={() => navigateTo('root')}
          className={`mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
            currentFolder.id === 'root'
              ? 'bg-blue-600 text-white'
              : 'text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800'
          }`}
        >
          <HardDrive className="h-3.5 w-3.5 shrink-0" />
          <span>Root (/)</span>
        </button>
      </aside>

      {/* Main Browser */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-3 py-2 dark:border-slate-800">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={goBack}
              disabled={historyIdx === 0}
              className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-35 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Back"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1 overflow-x-auto text-xs">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={crumb.id}>
                  {idx > 0 && <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />}
                  <button
                    type="button"
                    onClick={() => navigateTo(crumb.id)}
                    className={`rounded px-1.5 py-0.5 font-medium whitespace-nowrap hover:bg-slate-100 dark:hover:bg-slate-800 ${
                      idx === breadcrumbs.length - 1
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {crumb.label}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter..."
                className="w-32 sm:w-40 rounded-lg border border-slate-200 bg-slate-50 py-1 pl-7 pr-2 text-xs text-slate-800 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
            </div>

            {!isTrash ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingMode('folder');
                    setNewName('');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 whitespace-nowrap"
                  title="New Folder"
                >
                  <FolderPlus className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">Folder</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingMode('file');
                    setNewName('');
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800 whitespace-nowrap"
                  title="New File"
                >
                  <FilePlus className="h-3.5 w-3.5" />
                  <span className="hidden md:inline">File</span>
                </button>
              </>
            ) : (
              items.length > 0 && (
                <button
                  type="button"
                  onClick={emptyTrash}
                  className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 whitespace-nowrap"
                >
                  Empty Trash
                </button>
              )
            )}

            <div className="flex items-center rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`rounded p-1 ${
                  viewMode === 'grid'
                    ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500'
                }`}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`rounded p-1 ${
                  viewMode === 'list'
                    ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
                    : 'text-slate-500'
                }`}
                aria-label="List view"
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Inline Creation Bar */}
        {creatingMode && (
          <form
            onSubmit={submitCreate}
            className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs dark:border-slate-800 dark:bg-slate-800/50"
          >
            <span className="font-medium text-slate-600 dark:text-slate-300">
              New {creatingMode === 'folder' ? 'Folder' : 'File'}:
            </span>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={creatingMode === 'folder' ? 'Folder name' : 'untitled.md'}
              className="flex-1 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              className="rounded-md bg-blue-600 px-3 py-1 font-medium text-white hover:bg-blue-700"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => setCreatingMode(null)}
              className="rounded-md px-2.5 py-1 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Cancel
            </button>
          </form>
        )}

        {/* File Listing */}
        <div
          onClick={() => setSelectedId(null)}
          className="flex-1 overflow-y-auto p-4 os-scroll"
        >
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400">
              <Folder className="h-10 w-10 mb-2 opacity-40" />
              <p className="text-sm font-medium">
                {search ? 'No items match your filter' : isTrash ? 'Trash is empty' : 'This folder is empty'}
              </p>
              {!isTrash && !search && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingMode('file');
                  }}
                  className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Create a File
                </button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {items.map((node) => {
                const isSelected = selectedId === node.id;
                const file = node.type === 'file' ? (node as VFSFile) : null;
                return (
                  <div
                    key={node.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(node.id);
                    }}
                    onDoubleClick={() => handleOpenNode(node)}
                    className={`group flex cursor-pointer flex-col items-center rounded-xl border p-3 text-center transition-colors ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50 dark:hover:border-slate-800 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {file?.imageSrc ? (
                      <div className="mb-2 h-14 w-20 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
                        <img
                          src={file.imageSrc}
                          alt={file.name}
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                        {renderNodeIcon(node)}
                      </div>
                    )}

                    {renamingId === node.id ? (
                      <input
                        type="text"
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => submitRename(node.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') submitRename(node.id);
                          if (e.key === 'Escape') setRenamingId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full rounded border border-blue-500 bg-white px-1.5 py-0.5 text-center text-xs text-slate-900 focus:outline-none dark:bg-slate-900 dark:text-slate-100"
                      />
                    ) : (
                      <span className="w-full truncate text-xs font-medium">{node.name}</span>
                    )}

                    <span className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
                      {node.type === 'folder'
                        ? `${getChildren(vfs, node.id).length} items`
                        : formatBytes((node as VFSFile).content.length)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
                  <th className="pb-2 pl-2">Name</th>
                  <th className="pb-2">Kind</th>
                  <th className="pb-2 text-right">Size</th>
                  <th className="pb-2 pr-2 text-right">Modified</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
                {items.map((node) => {
                  const isSelected = selectedId === node.id;
                  return (
                    <tr
                      key={node.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(node.id);
                      }}
                      onDoubleClick={() => handleOpenNode(node)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="flex items-center gap-2.5 py-2 pl-2 font-medium">
                        {renderNodeIcon(node)}
                        {renamingId === node.id ? (
                          <input
                            type="text"
                            autoFocus
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onBlur={() => submitRename(node.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') submitRename(node.id);
                              if (e.key === 'Escape') setRenamingId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="rounded border border-blue-500 bg-white px-1.5 py-0.5 text-xs dark:bg-slate-900"
                          />
                        ) : (
                          <span className="truncate">{node.name}</span>
                        )}
                      </td>
                      <td className="py-2 text-slate-500 dark:text-slate-400">
                        {node.type === 'folder' ? 'Folder' : (node as VFSFile).mimeType}
                      </td>
                      <td className="py-2 text-right font-mono-code tabular-nums text-slate-500 dark:text-slate-400">
                        {node.type === 'folder'
                          ? '--'
                          : formatBytes((node as VFSFile).content.length)}
                      </td>
                      <td className="py-2 pr-2 text-right tabular-nums text-slate-500 dark:text-slate-400">
                        {new Date(node.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Bottom Selection Status & Quick Actions Bar */}
        <div className="flex h-10 shrink-0 items-center justify-between border-t border-slate-200 bg-slate-50/70 px-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
          <div className="flex items-center gap-2 truncate">
            <span className="font-mono-code truncate">{currentPath}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums whitespace-nowrap">{items.length} items</span>
          </div>

          {selectedNode && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleOpenNode(selectedNode)}
                className="rounded px-2 py-1 font-medium text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50"
              >
                Open
              </button>
              {!isTrash ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(selectedNode.id);
                      setRenameValue(selectedNode.name);
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 hover:bg-slate-200 dark:hover:bg-slate-800"
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Rename</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const ok = moveToTrash(selectedNode.id);
                      if (!ok) {
                        pushNotification('Protected Directory', 'System folders cannot be deleted.', 'files');
                      } else {
                        setSelectedId(null);
                      }
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-3 w-3" />
                    <span>Trash</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      restoreFromTrash(selectedNode.id);
                      setSelectedId(null);
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/40"
                  >
                    <RotateCcw className="h-3 w-3" />
                    <span>Restore</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      deletePermanent(selectedNode.id);
                      setSelectedId(null);
                    }}
                    className="inline-flex items-center gap-1 rounded px-2 py-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                  >
                    <span>Delete Forever</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
