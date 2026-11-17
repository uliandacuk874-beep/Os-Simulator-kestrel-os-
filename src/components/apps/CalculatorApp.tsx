import React, { useEffect, useState } from 'react';
import { Delete } from 'lucide-react';

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [previous, setPrevious] = useState<number | null>(null);
  const [operator, setOperator] = useState<'+' | '-' | '*' | '/' | null>(null);
  const [resetNext, setResetNext] = useState(false);
  const [tape, setTape] = useState<string[]>([]);

  const inputDigit = (digit: string) => {
    if (resetNext) {
      setDisplay(digit === '.' ? '0.' : digit);
      setResetNext(false);
      return;
    }
    if (digit === '.' && display.includes('.')) return;
    setDisplay((prev) => (prev === '0' && digit !== '.' ? digit : prev + digit));
  };

  const compute = (a: number, b: number, op: '+' | '-' | '*' | '/'): number => {
    switch (op) {
      case '+':
        return a + b;
      case '-':
        return a - b;
      case '*':
        return a * b;
      case '/':
        return b === 0 ? NaN : a / b;
    }
  };

  const handleOperator = (nextOp: '+' | '-' | '*' | '/') => {
    const currentVal = parseFloat(display);
    if (previous === null) {
      setPrevious(currentVal);
    } else if (operator && !resetNext) {
      const result = compute(previous, currentVal, operator);
      setPrevious(result);
      setDisplay(Number.isNaN(result) ? 'Error' : String(Number(result.toFixed(10))));
    }
    setOperator(nextOp);
    setResetNext(true);
  };

  const handleEquals = () => {
    if (previous === null || !operator) return;
    const currentVal = parseFloat(display);
    const result = compute(previous, currentVal, operator);
    const formatted = Number.isNaN(result) ? 'Error' : String(Number(result.toFixed(10)));
    setTape((prev) => [`${previous} ${operator} ${currentVal} = ${formatted}`, ...prev].slice(0, 6));
    setDisplay(formatted);
    setPrevious(null);
    setOperator(null);
    setResetNext(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevious(null);
    setOperator(null);
    setResetNext(false);
  };

  const handleBackspace = () => {
    if (resetNext) return;
    setDisplay((prev) => (prev.length <= 1 ? '0' : prev.slice(0, -1)));
  };

  const handlePercent = () => {
    setDisplay((prev) => String(parseFloat(prev) / 100));
  };

  const handleSign = () => {
    setDisplay((prev) => (prev === '0' ? '0' : prev.startsWith('-') ? prev.slice(1) : '-' + prev));
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (/^[0-9.]$/.test(e.key)) inputDigit(e.key);
      else if (e.key === '+' || e.key === '-' || e.key === '*' || e.key === '/') handleOperator(e.key);
      else if (e.key === 'Enter' || e.key === '=') handleEquals();
      else if (e.key === 'Backspace') handleBackspace();
      else if (e.key === 'Escape') handleClear();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const btnBase =
    'flex h-12 items-center justify-center rounded-xl text-sm font-semibold transition-colors active:scale-95';
  const numBtn = `${btnBase} bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700`;
  const fnBtn = `${btnBase} bg-slate-200/80 text-slate-700 hover:bg-slate-300 dark:bg-slate-700/70 dark:text-slate-200 dark:hover:bg-slate-700`;
  const opBtn = (op: string) =>
    `${btnBase} ${
      operator === op && resetNext
        ? 'bg-amber-600 text-white'
        : 'bg-amber-500 text-white hover:bg-amber-600'
    }`;

  return (
    <div className="flex h-full flex-col bg-white p-4 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      {/* History Tape */}
      <div className="h-14 overflow-y-auto text-right font-mono-code text-[11px] text-slate-400 space-y-0.5 os-scroll">
        {tape.map((entry, idx) => (
          <div key={idx} className="truncate">
            {entry}
          </div>
        ))}
      </div>

      {/* Main Display */}
      <div className="my-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-right dark:border-slate-800 dark:bg-slate-950">
        <div className="h-4 font-mono-code text-[11px] text-slate-400 tabular-nums">
          {previous !== null && operator ? `${previous} ${operator}` : ''}
        </div>
        <div className="truncate font-mono-code text-3xl font-semibold tabular-nums tracking-tight">
          {display}
        </div>
      </div>

      {/* Keypad */}
      <div className="mt-2 grid flex-1 grid-cols-4 gap-2">
        <button type="button" onClick={handleClear} className={fnBtn}>
          AC
        </button>
        <button type="button" onClick={handleSign} className={fnBtn}>
          +/-
        </button>
        <button type="button" onClick={handlePercent} className={fnBtn}>
          %
        </button>
        <button type="button" onClick={() => handleOperator('/')} className={opBtn('/')}>
          ÷
        </button>

        {['7', '8', '9'].map((d) => (
          <button key={d} type="button" onClick={() => inputDigit(d)} className={numBtn}>
            {d}
          </button>
        ))}
        <button type="button" onClick={() => handleOperator('*')} className={opBtn('*')}>
          ×
        </button>

        {['4', '5', '6'].map((d) => (
          <button key={d} type="button" onClick={() => inputDigit(d)} className={numBtn}>
            {d}
          </button>
        ))}
        <button type="button" onClick={() => handleOperator('-')} className={opBtn('-')}>
          -
        </button>

        {['1', '2', '3'].map((d) => (
          <button key={d} type="button" onClick={() => inputDigit(d)} className={numBtn}>
            {d}
          </button>
        ))}
        <button type="button" onClick={() => handleOperator('+')} className={opBtn('+')}>
          +
        </button>

        <button type="button" onClick={() => inputDigit('0')} className={numBtn}>
          0
        </button>
        <button type="button" onClick={() => inputDigit('.')} className={numBtn}>
          .
        </button>
        <button type="button" onClick={handleBackspace} className={fnBtn} aria-label="Backspace">
          <Delete className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleEquals}
          className={`${btnBase} bg-blue-600 text-white hover:bg-blue-700`}
        >
          =
        </button>
      </div>
    </div>
  );
};
