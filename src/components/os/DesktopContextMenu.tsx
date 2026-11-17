import React from 'react';
import { FilePlus, FolderPlus, Image, RefreshCw, Settings, Terminal } from 'lucide-react';
import { useOS } from '../../os/OSContext';

interface DesktopContextMenuProps {
  position: { x: number; y: number } | null;
  onClose: () => void;
}

export const DesktopContextMenu: React.FC<DesktopContextMenuProps> = ({ position, onClose }) => {
  const { createFile, createFolder, openApp, openFileInApp, pushNotification } = useOS();

  if (!position) return null;

  const safeX = Math.min(position.x, window.innerWidth - 220);
  const safeY = Math.min(position.y, window.innerHeight - 250);

  return (
    <div
      style={{ left: safeX, top: safeY }}
      onMouseDown={(e) => e.stopPropagation()}
      className="fixed z-50 w-52 rounded-xl border border-slate-200 bg-white/95 p-1.5 text-xs font-medium text-slate-800 shadow-2xl backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/95 dark:text-slate-100"
    >
      <button
        type="button"
        onClick={() => {
          const name = `Folder-${Math.floor(Math.random() * 90 + 10)}`;
          createFolder('desktop', name);
          pushNotification('Folder Created', `Created ${name} on Desktop`, 'files');
          onClose();
        }}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <FolderPlus className="h-3.5 w-3.5 text-slate-500" />
        <span>New Desktop Folder</span>
      </button>

      <button
        type="button"
        onClick={() => {
          const name = `Note-${Math.floor(Math.random() * 90 + 10)}.md`;
          const file = createFile('desktop', name, `# ${name.replace('.md', '')}\n\n`);
          if (file) openFileInApp(file);
          onClose();
        }}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <FilePlus className="h-3.5 w-3.5 text-slate-500" />
        <span>New Note on Desktop</span>
      </button>

      <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" />

      <button
        type="button"
        onClick={() => {
          openApp('terminal');
          onClose();
        }}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Terminal className="h-3.5 w-3.5 text-slate-500" />
        <span>Open Terminal</span>
      </button>

      <button
        type="button"
        onClick={() => {
          openApp('files', { path: '/home/claire/Desktop' });
          onClose();
        }}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <RefreshCw className="h-3.5 w-3.5 text-slate-500" />
        <span>Inspect Desktop in Files</span>
      </button>

      <div className="my-1 h-px bg-slate-200 dark:bg-slate-800" />

      <button
        type="button"
        onClick={() => {
          openApp('settings', { path: 'wallpaper' });
          onClose();
        }}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Image className="h-3.5 w-3.5 text-slate-500" />
        <span>Change Wallpaper</span>
      </button>

      <button
        type="button"
        onClick={() => {
          openApp('settings');
          onClose();
        }}
        className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Settings className="h-3.5 w-3.5 text-slate-500" />
        <span>System Settings</span>
      </button>
    </div>
  );
};
