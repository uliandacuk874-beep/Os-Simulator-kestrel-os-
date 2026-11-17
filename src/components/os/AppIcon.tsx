import React from 'react';
import {
  Activity,
  Calculator,
  Code2,
  FileText,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  Settings,
  Terminal,
} from 'lucide-react';
import { AppId } from '../../os/types';

interface AppIconProps {
  appId: AppId;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

const ICON_CONFIG: Record<
  AppId,
  {
    Icon: React.ComponentType<{ className?: string }>;
    bg: string;
    fg: string;
  }
> = {
  files: {
    Icon: FolderOpen,
    bg: 'bg-sky-600 dark:bg-sky-500',
    fg: 'text-white',
  },
  terminal: {
    Icon: Terminal,
    bg: 'bg-slate-900 dark:bg-slate-800 border border-slate-700',
    fg: 'text-emerald-400',
  },
  notes: {
    Icon: FileText,
    bg: 'bg-amber-500 dark:bg-amber-600',
    fg: 'text-white',
  },
  code: {
    Icon: Code2,
    bg: 'bg-indigo-600 dark:bg-indigo-500',
    fg: 'text-white',
  },
  browser: {
    Icon: Globe,
    bg: 'bg-blue-600 dark:bg-blue-500',
    fg: 'text-white',
  },
  monitor: {
    Icon: Activity,
    bg: 'bg-emerald-600 dark:bg-emerald-500',
    fg: 'text-white',
  },
  calculator: {
    Icon: Calculator,
    bg: 'bg-zinc-800 dark:bg-zinc-700',
    fg: 'text-amber-300',
  },
  viewer: {
    Icon: ImageIcon,
    bg: 'bg-rose-600 dark:bg-rose-500',
    fg: 'text-white',
  },
  settings: {
    Icon: Settings,
    bg: 'bg-slate-600 dark:bg-slate-600',
    fg: 'text-white',
  },
};

export const AppIcon: React.FC<AppIconProps> = ({ appId, size = 'md' }) => {
  const cfg = ICON_CONFIG[appId];
  const Icon = cfg.Icon;

  if (size === 'xs') {
    return (
      <span
        className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${cfg.bg} ${cfg.fg}`}
      >
        <Icon className="h-3 w-3" />
      </span>
    );
  }

  if (size === 'sm') {
    return (
      <span
        className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm ${cfg.bg} ${cfg.fg}`}
      >
        <Icon className="h-4 w-4" />
      </span>
    );
  }

  if (size === 'lg') {
    return (
      <span
        className={`inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-md ${cfg.bg} ${cfg.fg}`}
      >
        <Icon className="h-6 w-6" />
      </span>
    );
  }

  return (
    <span
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-md ${cfg.bg} ${cfg.fg}`}
    >
      <Icon className="h-5 w-5" />
    </span>
  );
};
