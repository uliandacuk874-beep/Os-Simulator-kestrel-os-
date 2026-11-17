import React, { useEffect, useMemo, useState } from 'react';
import { Eye, FilePlus, Pencil, Save } from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { OSWindow, VFSFile } from '../../os/types';

interface NotesAppProps {
  win: OSWindow;
}

function renderSimpleMarkdown(md: string): React.ReactNode {
  const lines = md.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('# ')) {
      return (
        <h1 key={idx} className="font-display text-2xl font-bold tracking-tight mt-2 mb-3 text-slate-900 dark:text-white">
          {line.slice(2)}
        </h1>
      );
    }
    if (line.startsWith('## ')) {
      return (
        <h2 key={idx} className="font-display text-lg font-semibold mt-5 mb-2 text-slate-900 dark:text-white">
          {line.slice(3)}
        </h2>
      );
    }
    if (line.startsWith('- [x] ') || line.startsWith('- [ ] ')) {
      const checked = line.startsWith('- [x] ');
      return (
        <div key={idx} className="flex items-center gap-2 my-1 text-sm">
          <input type="checkbox" checked={checked} readOnly className="rounded accent-blue-600" />
          <span className={checked ? 'line-through text-slate-400' : ''}>{line.slice(6)}</span>
        </div>
      );
    }
    if (line.startsWith('- ') || /^\d+\.\s/.test(line)) {
      return (
        <p key={idx} className="my-1 pl-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {line}
        </p>
      );
    }
    if (!line.trim()) {
      return <div key={idx} className="h-3" />;
    }
    // Inline bold & code
    const parts = line.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
    return (
      <p key={idx} className="my-1.5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {parts.map((part, pIdx) => {
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code
                key={pIdx}
                className="rounded bg-slate-100 px-1.5 py-0.5 font-mono-code text-xs text-slate-800 dark:bg-slate-800 dark:text-slate-200"
              >
                {part.slice(1, -1)}
              </code>
            );
          }
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <strong key={pIdx} className="font-semibold text-slate-900 dark:text-white">
                {part.slice(2, -2)}
              </strong>
            );
          }
          return part;
        })}
      </p>
    );
  });
}

export const NotesApp: React.FC<NotesAppProps> = ({ win }) => {
  const { vfs, createFile, updateFileContent, pushNotification } = useOS();

  const textFiles = useMemo(() => {
    return Object.values(vfs.nodes)
      .filter((n): n is VFSFile => {
        if (n.type !== 'file') return false;
        if (n.parentId === 'trash') return false;
        return (
          n.mimeType === 'text/markdown' ||
          n.mimeType === 'text/plain' ||
          n.name.endsWith('.md') ||
          n.name.endsWith('.txt') ||
          n.name.endsWith('.conf') ||
          n.name.endsWith('.log')
        );
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [vfs]);

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    if (win.payload?.fileId && vfs.nodes[win.payload.fileId]) {
      return win.payload.fileId;
    }
    return textFiles[0]?.id ?? '';
  });

  const activeFile = activeFileId ? (vfs.nodes[activeFileId] as VFSFile | undefined) : undefined;
  const [draft, setDraft] = useState<string>(activeFile?.content ?? '');
  const [mode, setMode] = useState<'edit' | 'preview'>(() =>
    activeFile?.name === 'Welcome.md' ? 'preview' : 'edit'
  );
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (win.payload?.fileId && vfs.nodes[win.payload.fileId]) {
      setActiveFileId(win.payload.fileId);
    }
  }, [win.payload?.fileId, vfs.nodes]);

  useEffect(() => {
    if (activeFile) {
      setDraft(activeFile.content);
      setDirty(false);
    }
  }, [activeFileId, activeFile?.id]);

  const handleSave = () => {
    if (!activeFile) return;
    updateFileContent(activeFile.id, draft);
    setDirty(false);
    pushNotification('Note Saved', `Saved changes to ${activeFile.name}`, 'notes');
  };

  const handleNewNote = () => {
    const name = `Note-${Math.floor(Math.random() * 900 + 100)}.md`;
    const created = createFile('documents', name, `# Untitled Note\n\nStart writing...\n`);
    if (created) {
      setActiveFileId(created.id);
      setDraft(created.content);
      setMode('edit');
      setDirty(false);
    }
  };

  const wordCount = draft.trim() ? draft.trim().split(/\s+/).length : 0;

  return (
    <div className="flex h-full bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Notes Sidebar */}
      <aside className="w-52 shrink-0 flex flex-col border-r border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-950/60">
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2.5 dark:border-slate-800">
          <span className="font-display text-xs font-semibold text-slate-700 dark:text-slate-200">
            Documents
          </span>
          <button
            type="button"
            onClick={handleNewNote}
            className="rounded-md p-1 text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800"
            title="New Note"
          >
            <FilePlus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-0.5 os-scroll">
          {textFiles.map((file) => {
            const active = file.id === activeFile?.id;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => {
                  setActiveFileId(file.id);
                  setMode('edit');
                }}
                className={`flex w-full flex-col rounded-lg px-2.5 py-2 text-left transition-colors ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-700 hover:bg-slate-200/70 dark:text-slate-300 dark:hover:bg-slate-800'
                }`}
              >
                <span className="truncate text-xs font-semibold">{file.name}</span>
                <span
                  className={`mt-0.5 truncate text-[11px] ${
                    active ? 'text-blue-100' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {file.content.split('\n')[0]?.replace(/^#\s*/, '') || 'Empty note'}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Editor Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {activeFile ? (
          <>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate font-display text-sm font-semibold">
                  {activeFile.name}
                </span>
                {dirty && (
                  <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400">
                    Unsaved
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setMode('edit')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                      mode === 'edit'
                        ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    <Pencil className="h-3 w-3" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('preview')}
                    className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium ${
                      mode === 'preview'
                        ? 'bg-slate-200 text-slate-900 dark:bg-slate-700 dark:text-white'
                        : 'text-slate-500'
                    }`}
                  >
                    <Eye className="h-3 w-3" />
                    <span>Preview</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!dirty}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-45"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>

            {mode === 'edit' ? (
              <textarea
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  setDirty(e.target.value !== activeFile.content);
                }}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                spellCheck={false}
                className="flex-1 resize-none bg-transparent p-5 font-mono-code text-xs leading-relaxed text-slate-800 focus:outline-none dark:text-slate-200 os-scroll"
              />
            ) : (
              <div className="flex-1 overflow-y-auto p-6 os-scroll">
                <div className="max-w-2xl">{renderSimpleMarkdown(draft)}</div>
              </div>
            )}

            <div className="flex h-8 shrink-0 items-center justify-between border-t border-slate-200 px-4 text-[11px] text-slate-500 tabular-nums dark:border-slate-800 dark:text-slate-400">
              <span>{wordCount} words</span>
              <span>{draft.length} characters</span>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center text-slate-500">
            <p className="text-sm">Select or create a document</p>
          </div>
        )}
      </div>
    </div>
  );
};
