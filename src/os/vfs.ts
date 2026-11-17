import { VFSFile, VFSFolder, VFSNode, VFSState } from './types';

export const VFS_STORAGE_KEY = 'kestrel_vfs_v1';

const now = Date.now();

export function createInitialVFS(): VFSState {
  const nodes: Record<string, VFSNode> = {};

  const addFolder = (id: string, name: string, parentId: string | null): VFSFolder => {
    const folder: VFSFolder = {
      id,
      name,
      type: 'folder',
      parentId,
      createdAt: now - 3600_000,
      updatedAt: now - 3600_000,
    };
    nodes[id] = folder;
    return folder;
  };

  const addFile = (
    id: string,
    name: string,
    parentId: string,
    mimeType: string,
    content: string,
    imageSrc?: string
  ): VFSFile => {
    const file: VFSFile = {
      id,
      name,
      type: 'file',
      parentId,
      mimeType,
      content,
      imageSrc,
      createdAt: now - 1800_000,
      updatedAt: now - 1800_000,
    };
    nodes[id] = file;
    return file;
  };

  addFolder('root', '', null);
  addFolder('home', 'home', 'root');
  addFolder('claire', 'claire', 'home');
  addFolder('desktop', 'Desktop', 'claire');
  addFolder('documents', 'Documents', 'claire');
  addFolder('projects', 'Projects', 'claire');
  addFolder('pictures', 'Pictures', 'claire');
  addFolder('trash', 'Trash', 'claire');
  addFolder('etc', 'etc', 'root');
  addFolder('var', 'var', 'root');
  addFolder('log', 'log', 'var');

  addFile(
    'file-welcome',
    'Welcome.md',
    'documents',
    'text/markdown',
    `# Welcome to Kestrel OS

Kestrel OS is a self-contained desktop environment running a persistent virtual file system in your browser.

## Things to try

1. **Terminal** — Run \`ls\`, \`cd Projects\`, \`cat fibonacci.js\`, \`neofetch\`, or \`ps\`.
2. **Code Studio** — Open \`Projects/fibonacci.js\` or \`Projects/clock-widget.html\` and run them live.
3. **Files & Notes** — Create folders, edit Markdown notes, and move files to Trash.
4. **System Monitor** — Inspect active window processes, end a task, or run a CPU workload.
5. **Quick Launcher** — Press \`Ctrl + K\` (or \`Cmd + K\`) anywhere to search apps and files.
`
  );

  addFile(
    'file-architecture',
    'Architecture.txt',
    'documents',
    'text/plain',
    `KESTREL WORKSTATION ARCHITECTURE NOTES
--------------------------------------
Kernel:      kestrel-kernel 6.8.4-workstation
Shell:       ksh (Kestrel POSIX-lite Shell)
Storage:     LocalStorage-backed Virtual File System
Display:     Compositor with drag, 8-edge resize, and half-screen snap
`
  );

  addFile(
    'file-todo',
    'Sprint-Checklist.md',
    'desktop',
    'text/markdown',
    `# Workstation Checklist

- [x] Verify window compositor snap zones
- [x] Test VFS persistence across Terminal and Files
- [ ] Try running \`clock-widget.html\` inside Code Studio
- [ ] Switch wallpaper in Settings or Image Viewer
`
  );

  addFile(
    'file-fib',
    'fibonacci.js',
    'projects',
    'application/javascript',
    `// Execute this script directly in Code Studio!
function fibonacciSequence(count) {
  const seq = [0, 1];
  for (let i = 2; i < count; i++) {
    seq.push(seq[i - 1] + seq[i - 2]);
  }
  return seq.slice(0, count);
}

const result = fibonacciSequence(12);
console.log('First 12 Fibonacci numbers:', result.join(', '));
console.log('Sum:', result.reduce((acc, n) => acc + n, 0));
`
  );

  addFile(
    'file-widget',
    'clock-widget.html',
    'projects',
    'text/html',
    `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: grid;
      place-items: center;
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #f8fafc;
    }
    .card {
      padding: 28px 36px;
      border: 1px solid #334155;
      border-radius: 12px;
      background: #1e293b;
      text-align: center;
    }
    .time {
      font-size: 40px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      letter-spacing: -0.02em;
    }
    .sub {
      margin-top: 6px;
      font-size: 13px;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="time" id="clock">--:--:--</div>
    <div class="sub">Kestrel Sandbox Live Render</div>
  </div>
  <script>
    function tick() {
      document.getElementById('clock').textContent = new Date().toLocaleTimeString();
    }
    tick();
    setInterval(tick, 1000);
  </script>
</body>
</html>`
  );

  addFile(
    'file-pic-1',
    'Nordic-Dusk.jpg',
    'pictures',
    'image/jpeg',
    'High-resolution architectural landscape wallpaper.',
    '/src/assets/images/wallpaper_nordic_dusk_1794931627699.jpg'
  );

  addFile(
    'file-pic-2',
    'Studio-Waves.jpg',
    'pictures',
    'image/jpeg',
    'Minimalist obsidian topographic sculpture wallpaper.',
    '/src/assets/images/wallpaper_studio_waves_1794931627544.jpg'
  );

  addFile(
    'file-pic-3',
    'Desert-Horizon.jpg',
    'pictures',
    'image/jpeg',
    'Warm sunlit sandstone dunes wallpaper.',
    '/src/assets/images/wallpaper_desert_horizon_1794931627842.jpg'
  );

  addFile(
    'file-sysconf',
    'system.conf',
    'etc',
    'text/plain',
    `hostname=kestrel-workstation
user=claire
shell=/bin/ksh
compositor=kestrel-wm
theme_sync=enabled
`
  );

  addFile(
    'file-bootlog',
    'boot.log',
    'log',
    'text/plain',
    `[0.000] kestrel-kernel 6.8.4 initializing memory map
[0.142] vfs: mounted localstorage block device at /
[0.318] wm: compositor surface ready (60Hz)
[0.512] net: virtual interface eth0 online
[0.740] session: user 'claire' ready
`
  );

  return { rootId: 'root', nodes };
}

export function loadVFS(): VFSState {
  try {
    const raw = localStorage.getItem(VFS_STORAGE_KEY);
    if (!raw) return createInitialVFS();
    const parsed = JSON.parse(raw) as VFSState;
    if (!parsed || !parsed.rootId || !parsed.nodes || !parsed.nodes[parsed.rootId]) {
      return createInitialVFS();
    }
    return parsed;
  } catch {
    return createInitialVFS();
  }
}

export function saveVFS(state: VFSState): void {
  try {
    localStorage.setItem(VFS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage quota errors gracefully
  }
}

export function getChildren(vfs: VFSState, folderId: string): VFSNode[] {
  return Object.values(vfs.nodes)
    .filter((n) => n.parentId === folderId)
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
}

export function getNodePath(vfs: VFSState, nodeId: string): string {
  if (nodeId === vfs.rootId) return '/';
  const parts: string[] = [];
  let curr: VFSNode | undefined = vfs.nodes[nodeId];
  let guard = 0;
  while (curr && curr.id !== vfs.rootId && guard < 64) {
    parts.unshift(curr.name);
    curr = curr.parentId ? vfs.nodes[curr.parentId] : undefined;
    guard++;
  }
  return '/' + parts.join('/');
}

export function resolvePath(vfs: VFSState, inputPath: string, cwdId = 'claire'): VFSNode | null {
  const trimmed = inputPath.trim();
  if (!trimmed || trimmed === '/') return vfs.nodes[vfs.rootId];

  const expanded = trimmed.startsWith('~')
    ? '/home/claire' + trimmed.slice(1)
    : trimmed;

  const isAbsolute = expanded.startsWith('/');
  let current: VFSNode | undefined = isAbsolute ? vfs.nodes[vfs.rootId] : vfs.nodes[cwdId];
  if (!current) return null;

  const segments = expanded.split('/').filter(Boolean);
  for (const seg of segments) {
    if (seg === '.') continue;
    if (seg === '..') {
      if (current.parentId && vfs.nodes[current.parentId]) {
        current = vfs.nodes[current.parentId];
      }
      continue;
    }
    if (current.type !== 'folder') return null;
    const next = Object.values(vfs.nodes).find(
      (n) => n.parentId === current!.id && n.name === seg
    );
    if (!next) return null;
    current = next;
  }
  return current;
}

export function getParentAndName(
  vfs: VFSState,
  targetPath: string,
  cwdId = 'claire'
): { parent: VFSFolder; name: string } | null {
  const trimmed = targetPath.trim().replace(/\/+$/, '');
  if (!trimmed) return null;
  const lastSlash = trimmed.lastIndexOf('/');
  if (lastSlash === -1) {
    const parent = vfs.nodes[cwdId];
    if (!parent || parent.type !== 'folder') return null;
    return { parent, name: trimmed };
  }
  const parentPath = lastSlash === 0 ? '/' : trimmed.slice(0, lastSlash);
  const name = trimmed.slice(lastSlash + 1);
  if (!name || name === '.' || name === '..') return null;
  const parentNode = resolvePath(vfs, parentPath, cwdId);
  if (!parentNode || parentNode.type !== 'folder') return null;
  return { parent: parentNode, name };
}

export function computeVFSBytes(vfs: VFSState): number {
  return Object.values(vfs.nodes).reduce((acc, node) => {
    if (node.type === 'file') {
      return acc + node.content.length + (node.imageSrc ? 185_000 : 0);
    }
    return acc + 64;
  }, 0);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function inferMimeType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.md')) return 'text/markdown';
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) return 'application/javascript';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) return 'text/typescript';
  if (lower.endsWith('.html') || lower.endsWith('.htm')) return 'text/html';
  if (lower.endsWith('.css')) return 'text/css';
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) return 'image/jpeg';
  return 'text/plain';
}
