'use client';

import { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * Calculadora básica (4 operações + memória simples) — liberada só quando
 * `resource.settings.calculatorAllowed` vier `true` no simulado/quiz.
 * Sem acesso a nada da prova: é só aritmética, estado próprio, zerado toda
 * vez que o modal fecha e reabre.
 */

type Operator = '+' | '−' | '×' | '÷';

const MAX_DIGITS = 12;

export function CalculatorDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [display, setDisplay] = useState('0');
  const [stored, setStored] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [memory, setMemory] = useState(0);
  const [awaitingOperand, setAwaitingOperand] = useState(false);

  function reset() {
    setDisplay('0');
    setStored(null);
    setOperator(null);
    setAwaitingOperand(false);
  }

  // Fecha e reabre sempre em branco — não é pra guardar estado entre uma
  // consulta e outra durante a prova.
  useEffect(() => {
    if (!open) {
      reset();
      setMemory(0);
    }
  }, [open]);

  function inputDigit(digit: string) {
    if (awaitingOperand) {
      setDisplay(digit);
      setAwaitingOperand(false);
      return;
    }
    if (display === '0') {
      setDisplay(digit);
      return;
    }
    if (display.replace(/[-.]/g, '').length >= MAX_DIGITS) return;
    setDisplay(display + digit);
  }

  function inputDecimal() {
    if (awaitingOperand) {
      setDisplay('0.');
      setAwaitingOperand(false);
      return;
    }
    if (!display.includes('.')) setDisplay(display + '.');
  }

  function toggleSign() {
    setDisplay((d) => (d.startsWith('-') ? d.slice(1) : d === '0' ? d : `-${d}`));
  }

  function compute(a: number, b: number, op: Operator): number {
    switch (op) {
      case '+':
        return a + b;
      case '−':
        return a - b;
      case '×':
        return a * b;
      case '÷':
        return b === 0 ? NaN : a / b;
    }
  }

  function selectOperator(nextOp: Operator) {
    const current = Number(display);
    if (stored !== null && operator && !awaitingOperand) {
      const result = compute(stored, current, operator);
      setStored(result);
      setDisplay(formatResult(result));
    } else {
      setStored(current);
    }
    setOperator(nextOp);
    setAwaitingOperand(true);
  }

  function equals() {
    if (stored === null || !operator) return;
    const result = compute(stored, Number(display), operator);
    setDisplay(formatResult(result));
    setStored(null);
    setOperator(null);
    setAwaitingOperand(true);
  }

  function formatResult(value: number): string {
    if (Number.isNaN(value)) return 'Erro';
    if (!Number.isFinite(value)) return 'Erro';
    const rounded = Math.round(value * 1e9) / 1e9;
    return String(rounded);
  }

  const buttons: { label: string; onClick: () => void; variant?: 'op' | 'accent' }[] = [
    { label: 'MC', onClick: () => setMemory(0) },
    { label: 'MR', onClick: () => setDisplay(formatResult(memory)) },
    { label: 'M+', onClick: () => setMemory((m) => m + Number(display)) },
    { label: 'M−', onClick: () => setMemory((m) => m - Number(display)) },
    { label: 'C', onClick: reset },
    { label: '±', onClick: toggleSign },
    { label: '%', onClick: () => setDisplay(formatResult(Number(display) / 100)) },
    { label: '÷', onClick: () => selectOperator('÷'), variant: 'op' },
    { label: '7', onClick: () => inputDigit('7') },
    { label: '8', onClick: () => inputDigit('8') },
    { label: '9', onClick: () => inputDigit('9') },
    { label: '×', onClick: () => selectOperator('×'), variant: 'op' },
    { label: '4', onClick: () => inputDigit('4') },
    { label: '5', onClick: () => inputDigit('5') },
    { label: '6', onClick: () => inputDigit('6') },
    { label: '−', onClick: () => selectOperator('−'), variant: 'op' },
    { label: '1', onClick: () => inputDigit('1') },
    { label: '2', onClick: () => inputDigit('2') },
    { label: '3', onClick: () => inputDigit('3') },
    { label: '+', onClick: () => selectOperator('+'), variant: 'op' },
    { label: '0', onClick: () => inputDigit('0') },
    { label: ',', onClick: inputDecimal },
    { label: '=', onClick: equals, variant: 'accent' },
  ];

  return (
    <Dialog open={open} onClose={onClose} title="Calculadora" className="md:max-w-[300px]">
      <div className="space-y-3">
        <div className="bg-surface-2 rounded-xl px-4 py-5 text-right">
          {memory !== 0 && <p className="text-subtle text-xs">M</p>}
          <p className="truncate text-3xl font-semibold tabular-nums">{display}</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {buttons.map((btn) => (
            <button
              key={btn.label}
              type="button"
              onClick={btn.onClick}
              className={cn(
                'h-12 rounded-lg text-base font-semibold tabular-nums',
                btn.variant === 'accent'
                  ? 'bg-brand text-brand-fg'
                  : btn.variant === 'op'
                    ? 'bg-brand-soft text-brand-text'
                    : 'bg-surface-2 hover:bg-border-strong/30 text-text',
              )}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
