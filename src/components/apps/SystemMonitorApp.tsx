import React, { useEffect, useMemo, useState } from 'react';
import { Cpu, Flame, HardDrive, MemoryStick, XOctagon } from 'lucide-react';
import { APP_REGISTRY } from '../../os/constants';
import { useOS } from '../../os/OSContext';
import { computeVFSBytes, formatBytes } from '../../os/vfs';
import { AppIcon } from '../os/AppIcon';

export const SystemMonitorApp: React.FC = () => {
  const {
    windows,
    vfs,
    killProcessByPid,
    cpuStressActive,
    setCpuStressActive,
    pushNotification,
  } = useOS();

  const [selectedPid, setSelectedPid] = useState<number | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>(() =>
    Array.from({ length: 24 }, () => 12 + Math.round(Math.random() * 8))
  );

  useEffect(() => {
    const id = setInterval(() => {
      setCpuHistory((prev) => {
        const base = 6 + windows.length * 2.4 + (cpuStressActive ? 62 : 0);
        const jitter = (Math.random() - 0.5) * 8;
        const nextVal = Math.max(3, Math.min(98, Math.round(base + jitter)));
        return [...prev.slice(1), nextVal];
      });
    }, 900);
    return () => clearInterval(id);
  }, [windows.length, cpuStressActive]);

  const currentCpu = cpuHistory[cpuHistory.length - 1] ?? 12;
  const totalRamMB = 16384;
  const usedRamMB = useMemo(() => {
    const kernelBase = 1480;
    const appMem = windows.reduce((acc, w) => {
      const perApp = w.appId === 'browser' ? 420 : w.appId === 'code' ? 310 : 145;
      return acc + perApp;
    }, 0);
    return kernelBase + appMem + (cpuStressActive ? 1240 : 0);
  }, [windows, cpuStressActive]);

  const vfsBytes = useMemo(() => computeVFSBytes(vfs), [vfs]);
  const storageLimitBytes = 64 * 1024 * 1024;
  const storagePct = Math.min(100, (vfsBytes / storageLimitBytes) * 100);

  // Build SVG polyline path for CPU history
  const svgPoints = useMemo(() => {
    const w = 420;
    const h = 90;
    return cpuHistory
      .map((val, idx) => {
        const x = (idx / (cpuHistory.length - 1)) * w;
        const y = h - (val / 100) * (h - 10) - 5;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [cpuHistory]);

  const areaPath = useMemo(() => {
    if (!svgPoints) return '';
    return `M 0,90 L ${svgPoints.split(' ').join(' L ')} L 420,90 Z`;
  }, [svgPoints]);

  const handleKillSelected = () => {
    if (!selectedPid) return;
    const target = windows.find((w) => w.pid === selectedPid);
    const ok = killProcessByPid(selectedPid);
    if (ok && target) {
      pushNotification('Process Terminated', `Stopped ${target.title} (PID ${selectedPid})`, 'monitor');
      setSelectedPid(null);
    }
  };

  return (
    <div className="flex h-full flex-col bg-white text-slate-800 dark:bg-slate-900 dark:text-slate-100">
      {/* Top KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-slate-200 p-4 dark:border-slate-800">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <Cpu className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              CPU Utilization
            </span>
            <span className="font-mono-code font-semibold text-slate-900 dark:text-white tabular-nums">
              {currentCpu}%
            </span>
          </div>
          <svg viewBox="0 0 420 90" className="mt-2 h-14 w-full overflow-visible">
            <path d={areaPath} fill="rgba(37, 99, 235, 0.14)" />
            <polyline
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinejoin="round"
              points={svgPoints}
            />
          </svg>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <MemoryStick className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              Memory
            </span>
            <span className="font-mono-code font-semibold text-slate-900 dark:text-white tabular-nums">
              {(usedRamMB / 1024).toFixed(1)} / 16 GB
            </span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${Math.round((usedRamMB / totalRamMB) * 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            <span>Kernel: 1.48 GB</span>
            <span>Apps: {((usedRamMB - 1480) / 1024).toFixed(2)} GB</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 font-medium">
              <HardDrive className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              Virtual Disk (VFS)
            </span>
            <span className="font-mono-code font-semibold text-slate-900 dark:text-white tabular-nums">
              {formatBytes(vfsBytes)}
            </span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-amber-500"
              style={{ width: `${Math.max(2, storagePct)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
            <span>{Object.keys(vfs.nodes).length} VFS nodes</span>
            <span>64 MB quota</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2.5 text-xs dark:border-slate-800">
        <span className="font-display font-semibold text-slate-700 dark:text-slate-200">
          Active Processes ({windows.length + 1})
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCpuStressActive((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 font-medium transition-colors ${
              cpuStressActive
                ? 'border-amber-500 bg-amber-500/15 text-amber-700 dark:text-amber-300'
                : 'border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            <span>{cpuStressActive ? 'Stop Stress Test' : 'Simulate CPU Load'}</span>
          </button>

          <button
            type="button"
            disabled={!selectedPid}
            onClick={handleKillSelected}
            className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1.5 font-medium text-white hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            <XOctagon className="h-3.5 w-3.5" />
            <span>End Process</span>
          </button>
        </div>
      </div>

      {/* Process Table */}
      <div className="flex-1 overflow-y-auto px-4 py-2 os-scroll">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-[11px] font-semibold text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="py-2">Process</th>
              <th className="py-2 text-right">PID</th>
              <th className="py-2">State</th>
              <th className="py-2 text-right">CPU</th>
              <th className="py-2 text-right">Memory</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {/* Kernel daemon */}
            <tr className="text-slate-600 dark:text-slate-300">
              <td className="py-2.5 font-medium">kestrel-compositor</td>
              <td className="py-2.5 text-right font-mono-code tabular-nums">1</td>
              <td className="py-2.5 text-emerald-600 dark:text-emerald-400">System</td>
              <td className="py-2.5 text-right font-mono-code tabular-nums">
                {cpuStressActive ? '64.2%' : '1.8%'}
              </td>
              <td className="py-2.5 text-right font-mono-code tabular-nums">148 MB</td>
            </tr>

            {windows.map((w) => {
              const def = APP_REGISTRY[w.appId];
              const isSelected = selectedPid === w.pid;
              const mem = w.appId === 'browser' ? 420 : w.appId === 'code' ? 310 : 145;
              const cpu = w.isMinimized ? '0.2%' : w.appId === 'monitor' ? '2.4%' : '1.1%';
              return (
                <tr
                  key={w.id}
                  onClick={() => setSelectedPid(w.pid)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <td className="flex items-center gap-2 py-2.5 font-medium">
                    <AppIcon appId={w.appId} size="xs" />
                    <span>{def.name}</span>
                  </td>
                  <td className="py-2.5 text-right font-mono-code tabular-nums text-slate-500">
                    {w.pid}
                  </td>
                  <td className="py-2.5 text-slate-500 dark:text-slate-400">
                    {w.isMinimized ? 'Suspended' : 'Running'}
                  </td>
                  <td className="py-2.5 text-right font-mono-code tabular-nums">{cpu}</td>
                  <td className="py-2.5 text-right font-mono-code tabular-nums">{mem} MB</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
