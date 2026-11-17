import React, { useState } from 'react';
import { Check, Image as ImageIcon, ZoomIn, ZoomOut } from 'lucide-react';
import { WALLPAPERS } from '../../os/constants';
import { useOS } from '../../os/OSContext';
import { OSWindow, VFSFile } from '../../os/types';

interface ImageViewerAppProps {
  win: OSWindow;
}

export const ImageViewerApp: React.FC<ImageViewerAppProps> = ({ win }) => {
  const { vfs, updateSettings, pushNotification } = useOS();
  const [zoom, setZoom] = useState(1);
  const [applied, setApplied] = useState(false);

  const imageFiles = Object.values(vfs.nodes).filter(
    (n): n is VFSFile => n.type === 'file' && Boolean(n.imageSrc)
  );

  const [selectedId, setSelectedId] = useState<string>(
    win.payload?.fileId ?? imageFiles[0]?.id ?? ''
  );

  const activeFile = selectedId ? (vfs.nodes[selectedId] as VFSFile | undefined) : undefined;

  const handleSetWallpaper = () => {
    if (!activeFile?.imageSrc) return;
    const match = WALLPAPERS.find((w) => w.src === activeFile.imageSrc);
    if (match) {
      updateSettings({ wallpaperId: match.id });
      setApplied(true);
      pushNotification('Wallpaper Updated', `Applied ${match.name}`, 'settings');
      setTimeout(() => setApplied(false), 2000);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <ImageIcon className="h-4 w-4 text-rose-400 shrink-0" />
          <span className="truncate font-semibold">{activeFile?.name ?? 'No Image'}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))))}
            className="rounded-md p-1.5 text-slate-300 hover:bg-slate-800"
            title="Zoom out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="w-12 text-center font-mono-code tabular-nums">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.25).toFixed(2))))}
            className="rounded-md p-1.5 text-slate-300 hover:bg-slate-800"
            title="Zoom in"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          {activeFile?.imageSrc && WALLPAPERS.some((w) => w.src === activeFile.imageSrc) && (
            <button
              type="button"
              onClick={handleSetWallpaper}
              className="ml-2 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700"
            >
              {applied && <Check className="h-3.5 w-3.5" />}
              <span>{applied ? 'Applied' : 'Set as Wallpaper'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Viewport */}
      <div className="flex flex-1 items-center justify-center overflow-auto p-6 os-scroll">
        {activeFile?.imageSrc ? (
          <img
            src={activeFile.imageSrc}
            alt={activeFile.name}
            referrerPolicy="no-referrer"
            style={{ transform: `scale(${zoom})` }}
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl transition-transform duration-150"
          />
        ) : (
          <p className="text-sm text-slate-500">Select an image from Pictures to inspect.</p>
        )}
      </div>

      {/* Filmstrip */}
      {imageFiles.length > 1 && (
        <div className="flex items-center justify-center gap-2 border-t border-slate-800 bg-slate-900/90 p-2">
          {imageFiles.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => {
                setSelectedId(img.id);
                setZoom(1);
              }}
              className={`h-11 w-16 overflow-hidden rounded-md border-2 transition-all ${
                img.id === activeFile?.id
                  ? 'border-blue-500 opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={img.imageSrc}
                alt={img.name}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
