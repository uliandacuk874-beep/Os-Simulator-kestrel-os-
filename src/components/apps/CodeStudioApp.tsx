import React, { useEffect, useMemo, useState } from 'react';
import { FilePlus, Play, Save, Terminal } from 'lucide-react';
import { useOS } from '../../os/OSContext';
import { OSWindow, VFSFile } from '../../os/types';

interface CodeStudioAppProps {
  win: OSWindow;
}

export const CodeStudioApp: React.FC<CodeStudioAppProps> = ({ win }) => {
  const { vfs, createFile, updateFileContent, pushNotification } = useOS();

  const codeFiles = useMemo(() => {
    return Object.values(vfs.nodes)
      .filter((n): n is VFSFile => {
        if (n.type !== 'file' || n.parentId === 'trash') return false;
        const lower = n.name.toLowerCase();
        return (
          lower.endsWith('.js') ||
          lower.endsWith('.ts') ||
          lower.endsWith('.html') ||
          lower.endsWith('.css') ||
          lower.endsWith('.json')
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [vfs]);

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    if (win.payload?.fileId && vfs.nodes[win.payload.fileId]) {
      return win.payload.fileId;
    }
    return codeFiles[0]?.id ?? '';
  });

  const activeFile = activeFileId ? (vfs.nodes[activeFileId] as VFSFile | undefined) : undefined;
  const [code, setCode] = useState<string>(activeFile?.content ?? '');
  const [dirty, setDirty] = useState(false);
  const [consoleLogs, setConsoleLogs] = useState<{ kind: 'log' | 'error'; text: string }[]>([]);
  const [htmlPreviewDoc, setHtmlPreviewDoc] = useState<string | null>(null);

  useEffect(() => {
    if (win.payload?.fileId && vfs.nodes[win.payload.fileId]) {
      setActiveFileId(win.payload.fileId);
    }
  }, [win.payload?.fileId, vfs.nodes]);

  useEffect(() => {
    if (activeFile) {
      setCode(activeFile.content);
      setDirty(false);
      if (activeFile.name.endsWith('.html')) {
        setHtmlPreviewDoc(activeFile.content);
      } else {
        setHtmlPreviewDoc(null);
      }
    }
  }, [activeFileId, activeFile?.id]);

  const handleSave = () => {
    if (!activeFile) return;
    updateFileContent(activeFile.id, code);
    setDirty(false);
    pushNotification('Saved', `Updated ${activeFile.name}`, 'code');
  };

  const handleRun = () => {
    if (!activeFile) return;
    if (activeFile.name.endsWith('.html') || activeFile.name.endsWith('.htm')) {
      setHtmlPreviewDoc(code);
      setConsoleLogs([{ kind: 'log', text: `Rendered ${activeFile.name} in sandbox iframe.` }]);
      return;
    }

    if (activeFile.name.endsWith('.json')) {
      try {
        const parsed = JSON.parse(code);
        setConsoleLogs([{ kind: 'log', text: `Valid JSON (${Object.keys(parsed).length} top-level keys)` }]);
      } catch (err) {
        setConsoleLogs([{ kind: 'error', text: String(err) }]);
      }
      return;
    }

    // Execute JS safely capturing console.log
    setHtmlPreviewDoc(null);
    const logs: { kind: 'log' | 'error'; text: string }[] = [];
    const customConsole = {
      log: (...args: unknown[]) => {
        logs.push({
          kind: 'log',
          text: args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '),
        });
      },
      error: (...args: unknown[]) => {
        logs.push({ kind: 'error', text: args.map(String).join(' ') });
      },
    };
    try {
      const fn = new Function('console', code);
      const res = fn(customConsole);
      if (res !== undefined) {
        logs.push({ kind: 'log', text: `=> ${String(res)}` });
      }
      if (logs.length === 0) {
        logs.push({ kind: 'log', text: 'Script executed with no output.' });
      }
    } catch (err) {
      logs.push({ kind: 'error', text: err instanceof Error ? err.message : String(err) });
    }
    setConsoleLogs(logs);
  };

  const handleNewScript = () => {
    const name = `script-${Math.floor(Math.random() * 90 + 10)}.js`;
    const created = createFile(
      'projects',
      name,
      `// ${name}\nconst items = [2, 4, 6, 8];\nconsole.log('Sum:', items.reduce((a, b) => a + b, 0));\n`
    );
    if (created) {
      setActiveFileId(created.id);
      setCode(created.content);
      setDirty(false);
      setHtmlPreviewDoc(null);
    }
  };

  const lineCount = code.split('\n').length;

  return (
    <div className="flex h-full bg-slate-950 text-slate-100">
      {/* Explorer Sidebar */}
      <aside className="w-48 shrink-0 flex flex-col border-r border-slate-800 bg-slate-950">
        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2.5">
          <span className="font-display text-xs font-semibold text-slate-300">Workspace</span>
          <button
            type="button"
            onClick={handleNewScript}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
            title="New JS Script"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 os-scroll">
          {codeFiles.map((file) => {
            const active = file.id === activeFile?.id;
            return (
              <button
                key={file.id}
                type="button"
                onClick={() => setActiveFileId(file.id)}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left font-mono-code text-xs transition-colors ${
                  active
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-900'
                }`}
              >
                <span className="truncate">{file.name}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {/* Main Editor + Output Split */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-3 py-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono-code text-xs font-medium text-slate-200 truncate">
              {activeFile?.name ?? 'No file selected'}
            </span>
            {dirty && <span className="text-[11px] text-amber-400">Modified</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={!dirty || !activeFile}
              className="inline-flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-40"
            >
              <Save className="h-3.5 w-3.5" />
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={handleRun}
              disabled={!activeFile}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-3 py-1 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-40"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{activeFile?.name.endsWith('.html') ? 'Render HTML' : 'Run'}</span>
            </button>
          </div>
        </div>

        {/* Code Area + Sandbox Split */}
        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          {/* Code Editor */}
          <div className="flex flex-1 min-h-0 overflow-auto bg-slate-950 os-scroll">
            <div className="select-none border-r border-slate-800/80 bg-slate-950 px-3 py-3 text-right font-mono-code text-xs leading-6 text-slate-600">
              {Array.from({ length: lineCount }, (_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>
            <textarea
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setDirty(e.target.value !== activeFile?.content);
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
                  e.preventDefault();
                  handleSave();
                }
              }}
              spellCheck={false}
              className="flex-1 resize-none bg-transparent p-3 font-mono-code text-xs leading-6 text-slate-100 focus:outline-none"
            />
          </div>

          {/* Live Output / Sandbox Pane */}
          <div className="flex h-48 lg:h-auto lg:w-72 shrink-0 flex-col border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900">
            <div className="flex items-center gap-1.5 border-b border-slate-800 px-3 py-2 text-[11px] font-semibold text-slate-400">
              <Terminal className="h-3.5 w-3.5" />
              <span>{htmlPreviewDoc !== null ? 'Live HTML Sandbox' : 'Execution Output'}</span>
            </div>

            {htmlPreviewDoc !== null ? (
              <iframe
                title="Code Studio HTML Preview"
                sandbox="allow-scripts"
                srcDoc={htmlPreviewDoc}
                className="flex-1 w-full bg-white"
              />
            ) : (
              <div className="flex-1 overflow-y-auto p-3 font-mono-code text-xs space-y-1.5 os-scroll">
                {consoleLogs.length === 0 ? (
                  <p className="text-slate-500">Click Run to execute script or render HTML.</p>
                ) : (
                  consoleLogs.map((entry, idx) => (
                    <div
                      key={idx}
                      className={
                        entry.kind === 'error'
                          ? 'text-red-400 whitespace-pre-wrap'
                          : 'text-emerald-300 whitespace-pre-wrap'
                      }
                    >
                      {entry.text}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
