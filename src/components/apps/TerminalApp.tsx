import React, { useEffect, useRef, useState } from 'react';
import { KERNEL_VERSION, OS_VERSION } from '../../os/constants';
import { useOS } from '../../os/OSContext';
import { VFSFile } from '../../os/types';
import {
  formatBytes,
  getChildren,
  getNodePath,
  getParentAndName,
  resolvePath,
} from '../../os/vfs';

interface TerminalLine {
  id: string;
  kind: 'prompt' | 'output' | 'error';
  text: string;
  cwd?: string;
}

const COMMAND_LIST = [
  'help',
  'ls',
  'cd',
  'pwd',
  'cat',
  'echo',
  'touch',
  'mkdir',
  'rm',
  'mv',
  'cp',
  'clear',
  'whoami',
  'uname',
  'date',
  'uptime',
  'ps',
  'kill',
  'neofetch',
  'open',
  'theme',
  'calc',
];

export const TerminalApp: React.FC = () => {
  const {
    vfs,
    windows,
    settings,
    bootTime,
    updateSettings,
    createFile,
    createFolder,
    updateFileContent,
    moveToTrash,
    moveNode,
    copyNode,
    openApp,
    openFileInApp,
    killProcessByPid,
  } = useOS();

  const [cwdId, setCwdId] = useState<string>('claire');
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState<number>(-1);
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      id: 'init-1',
      kind: 'output',
      text: `${OS_VERSION} Shell (ksh 2.4) — Type "help" for available commands.`,
    },
  ]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  const cwdNode = vfs.nodes[cwdId] ?? vfs.nodes['claire'];
  const cwdPath = getNodePath(vfs, cwdNode.id);
  const displayPath = cwdPath.startsWith('/home/claire')
    ? '~' + cwdPath.slice('/home/claire'.length)
    : cwdPath;

  const appendLines = (entries: Omit<TerminalLine, 'id'>[]) => {
    setLines((prev) => [
      ...prev,
      ...entries.map((e, i) => ({
        ...e,
        id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
      })),
    ]);
  };

  const tokenize = (raw: string): string[] => {
    const tokens: string[] = [];
    let curr = '';
    let quote: '"' | "'" | null = null;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (quote) {
        if (ch === quote) quote = null;
        else curr += ch;
      } else if (ch === '"' || ch === "'") {
        quote = ch;
      } else if (/\s/.test(ch)) {
        if (curr) {
          tokens.push(curr);
          curr = '';
        }
      } else {
        curr += ch;
      }
    }
    if (curr) tokens.push(curr);
    return tokens;
  };

  const runCommand = (rawCommand: string) => {
    const trimmed = rawCommand.trim();
    const promptLine: Omit<TerminalLine, 'id'> = {
      kind: 'prompt',
      cwd: displayPath,
      text: rawCommand,
    };

    if (!trimmed) {
      appendLines([promptLine]);
      return;
    }

    setHistory((prev) => [trimmed, ...prev].slice(0, 50));
    setHistoryIdx(-1);

    // Support echo "..." > file redirection
    const redirectMatch = trimmed.match(/^echo\s+(.+?)\s*>\s*(\S+)$/);
    if (redirectMatch) {
      const rawText = redirectMatch[1].replace(/^["']|["']$/g, '');
      const targetPath = redirectMatch[2];
      const existing = resolvePath(vfs, targetPath, cwdNode.id);
      if (existing && existing.type === 'file') {
        updateFileContent(existing.id, rawText + '\n');
        appendLines([promptLine, { kind: 'output', text: `Wrote to ${targetPath}` }]);
      } else {
        const pn = getParentAndName(vfs, targetPath, cwdNode.id);
        if (!pn) {
          appendLines([promptLine, { kind: 'error', text: `ksh: cannot create ${targetPath}` }]);
        } else {
          createFile(pn.parent.id, pn.name, rawText + '\n');
          appendLines([promptLine, { kind: 'output', text: `Created ${targetPath}` }]);
        }
      }
      return;
    }

    const args = tokenize(trimmed);
    const cmd = args[0];

    switch (cmd) {
      case 'clear': {
        setLines([]);
        return;
      }
      case 'help': {
        appendLines([
          promptLine,
          {
            kind: 'output',
            text: [
              'File System:  ls [-l], cd <dir>, pwd, cat <file>, touch <file>, mkdir <dir>, rm <path>, mv <src> <dst>, cp <src> <dst>',
              'System:       ps, kill <pid>, uname [-a], whoami, date, uptime, neofetch, theme <light|dark>',
              'Utilities:    open <app|file>, echo <text> [> file], calc <expression>, clear',
            ].join('\n'),
          },
        ]);
        return;
      }
      case 'pwd': {
        appendLines([promptLine, { kind: 'output', text: cwdPath }]);
        return;
      }
      case 'whoami': {
        appendLines([promptLine, { kind: 'output', text: settings.userHandle }]);
        return;
      }
      case 'uname': {
        const text = args.includes('-a')
          ? `KestrelOS kestrel-workstation ${KERNEL_VERSION} x86_64`
          : 'KestrelOS';
        appendLines([promptLine, { kind: 'output', text }]);
        return;
      }
      case 'date': {
        appendLines([promptLine, { kind: 'output', text: new Date().toString() }]);
        return;
      }
      case 'uptime': {
        const secs = Math.floor((Date.now() - bootTime) / 1000);
        const mins = Math.floor(secs / 60);
        const rem = secs % 60;
        appendLines([
          promptLine,
          { kind: 'output', text: `up ${mins}m ${rem}s, 1 user, load average: 0.24, 0.19, 0.14` },
        ]);
        return;
      }
      case 'ls': {
        const showLong = args.some((a) => a.startsWith('-') && a.includes('l'));
        const pathArg = args.slice(1).find((a) => !a.startsWith('-'));
        const target = pathArg ? resolvePath(vfs, pathArg, cwdNode.id) : cwdNode;
        if (!target) {
          appendLines([promptLine, { kind: 'error', text: `ls: ${pathArg}: No such file or directory` }]);
          return;
        }
        if (target.type === 'file') {
          appendLines([promptLine, { kind: 'output', text: target.name }]);
          return;
        }
        const children = getChildren(vfs, target.id);
        if (children.length === 0) {
          appendLines([promptLine]);
          return;
        }
        const out = showLong
          ? children
              .map((c) => {
                const perm = c.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
                const size =
                  c.type === 'folder'
                    ? '4096'.padStart(7)
                    : formatBytes((c as VFSFile).content.length).padStart(7);
                const suffix = c.type === 'folder' ? '/' : '';
                return `${perm}  ${settings.userHandle}  ${size}  ${c.name}${suffix}`;
              })
              .join('\n')
          : children.map((c) => (c.type === 'folder' ? `${c.name}/` : c.name)).join('   ');
        appendLines([promptLine, { kind: 'output', text: out }]);
        return;
      }
      case 'cd': {
        const targetArg = args[1] ?? '~';
        const target = resolvePath(vfs, targetArg, cwdNode.id);
        if (!target) {
          appendLines([promptLine, { kind: 'error', text: `cd: ${targetArg}: No such directory` }]);
          return;
        }
        if (target.type !== 'folder') {
          appendLines([promptLine, { kind: 'error', text: `cd: ${targetArg}: Not a directory` }]);
          return;
        }
        setCwdId(target.id);
        appendLines([promptLine]);
        return;
      }
      case 'cat': {
        if (!args[1]) {
          appendLines([promptLine, { kind: 'error', text: 'usage: cat <file>' }]);
          return;
        }
        const target = resolvePath(vfs, args[1], cwdNode.id);
        if (!target) {
          appendLines([promptLine, { kind: 'error', text: `cat: ${args[1]}: No such file` }]);
          return;
        }
        if (target.type !== 'file') {
          appendLines([promptLine, { kind: 'error', text: `cat: ${args[1]}: Is a directory` }]);
          return;
        }
        appendLines([promptLine, { kind: 'output', text: (target as VFSFile).content }]);
        return;
      }
      case 'echo': {
        appendLines([promptLine, { kind: 'output', text: args.slice(1).join(' ') }]);
        return;
      }
      case 'touch': {
        if (!args[1]) {
          appendLines([promptLine, { kind: 'error', text: 'usage: touch <filename>' }]);
          return;
        }
        const pn = getParentAndName(vfs, args[1], cwdNode.id);
        if (!pn) {
          appendLines([promptLine, { kind: 'error', text: `touch: invalid path ${args[1]}` }]);
          return;
        }
        const created = createFile(pn.parent.id, pn.name, '');
        if (!created) {
          appendLines([promptLine, { kind: 'output', text: `${pn.name} already exists` }]);
          return;
        }
        appendLines([promptLine]);
        return;
      }
      case 'mkdir': {
        if (!args[1]) {
          appendLines([promptLine, { kind: 'error', text: 'usage: mkdir <dirname>' }]);
          return;
        }
        const pn = getParentAndName(vfs, args[1], cwdNode.id);
        if (!pn) {
          appendLines([promptLine, { kind: 'error', text: `mkdir: invalid path ${args[1]}` }]);
          return;
        }
        const created = createFolder(pn.parent.id, pn.name);
        if (!created) {
          appendLines([promptLine, { kind: 'error', text: `mkdir: ${pn.name}: File exists` }]);
          return;
        }
        appendLines([promptLine]);
        return;
      }
      case 'rm': {
        if (!args[1]) {
          appendLines([promptLine, { kind: 'error', text: 'usage: rm <path>' }]);
          return;
        }
        const target = resolvePath(vfs, args[1], cwdNode.id);
        if (!target) {
          appendLines([promptLine, { kind: 'error', text: `rm: ${args[1]}: No such file or directory` }]);
          return;
        }
        const ok = moveToTrash(target.id);
        if (!ok) {
          appendLines([promptLine, { kind: 'error', text: `rm: ${args[1]}: Protected system directory` }]);
          return;
        }
        appendLines([promptLine, { kind: 'output', text: `Moved ${target.name} to Trash` }]);
        return;
      }
      case 'mv': {
        if (!args[1] || !args[2]) {
          appendLines([promptLine, { kind: 'error', text: 'usage: mv <source> <dest_dir>' }]);
          return;
        }
        const src = resolvePath(vfs, args[1], cwdNode.id);
        const dst = resolvePath(vfs, args[2], cwdNode.id);
        if (!src || !dst || dst.type !== 'folder') {
          appendLines([promptLine, { kind: 'error', text: 'mv: invalid source or destination directory' }]);
          return;
        }
        const ok = moveNode(src.id, dst.id);
        appendLines([
          promptLine,
          ok
            ? { kind: 'output', text: `Moved ${src.name} -> ${getNodePath(vfs, dst.id)}` }
            : { kind: 'error', text: 'mv: operation failed (name conflict)' },
        ]);
        return;
      }
      case 'cp': {
        if (!args[1] || !args[2]) {
          appendLines([promptLine, { kind: 'error', text: 'usage: cp <file> <dest_dir>' }]);
          return;
        }
        const src = resolvePath(vfs, args[1], cwdNode.id);
        const dst = resolvePath(vfs, args[2], cwdNode.id);
        if (!src || src.type !== 'file' || !dst || dst.type !== 'folder') {
          appendLines([promptLine, { kind: 'error', text: 'cp: source must be a file and dest must be a folder' }]);
          return;
        }
        const copied = copyNode(src.id, dst.id);
        appendLines([
          promptLine,
          copied
            ? { kind: 'output', text: `Copied to ${getNodePath(vfs, dst.id)}/${copied.name}` }
            : { kind: 'error', text: 'cp: copy failed' },
        ]);
        return;
      }
      case 'ps': {
        const header = '  PID  STATE      APP';
        const rows = windows.map(
          (w) =>
            `${String(w.pid).padStart(5)}  ${(w.isMinimized ? 'sleep' : 'running').padEnd(9)}  ${w.title}`
        );
        appendLines([promptLine, { kind: 'output', text: [header, ...rows].join('\n') }]);
        return;
      }
      case 'kill': {
        const pid = Number(args[1]);
        if (!pid) {
          appendLines([promptLine, { kind: 'error', text: 'usage: kill <pid>' }]);
          return;
        }
        const ok = killProcessByPid(pid);
        appendLines([
          promptLine,
          ok
            ? { kind: 'output', text: `Terminated process ${pid}` }
            : { kind: 'error', text: `kill: (${pid}) - No such process` },
        ]);
        return;
      }
      case 'theme': {
        const mode = args[1];
        if (mode !== 'light' && mode !== 'dark') {
          appendLines([
            promptLine,
            { kind: 'output', text: `Current theme: ${settings.theme}. Use: theme light | dark` },
          ]);
          return;
        }
        updateSettings({ theme: mode });
        appendLines([promptLine, { kind: 'output', text: `Switched OS theme to ${mode}` }]);
        return;
      }
      case 'open': {
        const target = args[1];
        if (!target) {
          appendLines([promptLine, { kind: 'error', text: 'usage: open <app|file>' }]);
          return;
        }
        const appKeys = ['files', 'terminal', 'notes', 'code', 'browser', 'monitor', 'calculator', 'settings'];
        if (appKeys.includes(target.toLowerCase())) {
          openApp(target.toLowerCase() as Parameters<typeof openApp>[0]);
          appendLines([promptLine, { kind: 'output', text: `Launched ${target}` }]);
          return;
        }
        const node = resolvePath(vfs, target, cwdNode.id);
        if (!node) {
          appendLines([promptLine, { kind: 'error', text: `open: ${target}: not found` }]);
          return;
        }
        if (node.type === 'folder') {
          openApp('files', { path: getNodePath(vfs, node.id) });
        } else {
          openFileInApp(node as VFSFile);
        }
        appendLines([promptLine, { kind: 'output', text: `Opened ${node.name}` }]);
        return;
      }
      case 'calc': {
        const expr = args.slice(1).join(' ');
        if (!expr || !/^[0-9+\-*/().%\s]+$/.test(expr)) {
          appendLines([promptLine, { kind: 'error', text: 'usage: calc <arithmetic expression>' }]);
          return;
        }
        try {
          const val = Function(`"use strict"; return (${expr});`)();
          appendLines([promptLine, { kind: 'output', text: String(val) }]);
        } catch {
          appendLines([promptLine, { kind: 'error', text: 'calc: invalid expression' }]);
        }
        return;
      }
      case 'neofetch': {
        const secs = Math.floor((Date.now() - bootTime) / 1000);
        const info = [
          `   /\\        ${settings.userHandle}@kestrel-workstation`,
          `  /  \\       -----------------------------`,
          ` / /\\ \\      OS: ${OS_VERSION}`,
          `/____\\_\\     Kernel: ${KERNEL_VERSION}`,
          `             Shell: ksh 2.4`,
          `             Uptime: ${Math.floor(secs / 60)}m ${secs % 60}s`,
          `             Theme: ${settings.theme} (${settings.accent})`,
          `             Windows: ${windows.length} active`,
        ].join('\n');
        appendLines([promptLine, { kind: 'output', text: info }]);
        return;
      }
      default: {
        appendLines([promptLine, { kind: 'error', text: `ksh: ${cmd}: command not found` }]);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length === 0) return;
      const nextIdx = Math.min(history.length - 1, historyIdx + 1);
      setHistoryIdx(nextIdx);
      setInput(history[nextIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx <= 0) {
        setHistoryIdx(-1);
        setInput('');
      } else {
        const nextIdx = historyIdx - 1;
        setHistoryIdx(nextIdx);
        setInput(history[nextIdx]);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = input.split(/\s+/);
      const last = parts[parts.length - 1] ?? '';
      if (parts.length <= 1) {
        const match = COMMAND_LIST.find((c) => c.startsWith(last));
        if (match) setInput(match + ' ');
      } else {
        const children = getChildren(vfs, cwdNode.id);
        const match = children.find((c) => c.name.toLowerCase().startsWith(last.toLowerCase()));
        if (match) {
          parts[parts.length - 1] = match.name;
          setInput(parts.join(' '));
        }
      }
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className="flex h-full flex-col bg-slate-950 p-3 font-mono-code text-xs text-slate-200 cursor-text"
    >
      <div className="flex-1 overflow-y-auto space-y-1.5 os-scroll pr-1">
        {lines.map((line) => {
          if (line.kind === 'prompt') {
            return (
              <div key={line.id} className="flex flex-wrap items-baseline gap-1.5">
                <span className="text-emerald-400 font-semibold">{settings.userHandle}@kestrel</span>
                <span className="text-slate-500">:</span>
                <span className="text-sky-400">{line.cwd}</span>
                <span className="text-slate-400">$</span>
                <span className="text-white">{line.text}</span>
              </div>
            );
          }
          if (line.kind === 'error') {
            return (
              <pre key={line.id} className="whitespace-pre-wrap text-red-400 leading-relaxed">
                {line.text}
              </pre>
            );
          }
          return (
            <pre key={line.id} className="whitespace-pre-wrap text-slate-300 leading-relaxed">
              {line.text}
            </pre>
          );
        })}

        {/* Active Prompt */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <span className="text-emerald-400 font-semibold shrink-0">{settings.userHandle}@kestrel</span>
          <span className="text-slate-500 shrink-0">:</span>
          <span className="text-sky-400 shrink-0">{displayPath}</span>
          <span className="text-slate-400 shrink-0">$</span>
          <input
            ref={inputRef}
            type="text"
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent text-white caret-emerald-400 focus:outline-none"
          />
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};
