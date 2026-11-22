import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';

type Opt = { value: string; label: React.ReactNode; disabled: boolean };

// Drop-in replacement for <select> (single-select only): same props, <option> children,
// and onChange receives an event-like object with target.value.
type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'defaultValue'> & {
  value?: string | number;
  onChange?: (e: { target: { value: string; name?: string }; currentTarget: { value: string; name?: string } }) => void;
};

const collect = (children: React.ReactNode, out: Opt[] = []): Opt[] => {
  React.Children.forEach(children, (c) => {
    if (!React.isValidElement(c)) return;
    const el = c as React.ReactElement<any>;
    if (el.type === 'option') {
      const label = el.props.children;
      out.push({
        value: String(el.props.value ?? (typeof label === 'string' ? label : '')),
        label,
        disabled: Boolean(el.props.disabled),
      });
    } else if (el.props?.children) collect(el.props.children, out);
  });
  return out;
};

export const Select: React.FC<SelectProps> = ({ value, onChange, children, className = '', disabled, name, id, required, title }) => {
  const options = useMemo(() => collect(children), [children]);
  const current = String(value ?? '');
  const selected = options.find((o) => o.value === current);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number; maxH: number }>({ left: 0, width: 0, maxH: 256 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const below = window.innerHeight - r.bottom - 12;
    const above = r.top - 12;
    const up = below < 180 && above > below;
    setPos({
      left: r.left,
      width: r.width,
      maxH: Math.min(288, up ? above : below),
      ...(up ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 }),
    });
  };

  useLayoutEffect(() => { if (open) place(); }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e.type === 'scroll' && listRef.current?.contains(e.target as Node)) return;
      if (e.type === 'mousedown' && (listRef.current?.contains(e.target as Node) || btnRef.current?.contains(e.target as Node))) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', close);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', close);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  useEffect(() => {
    if (open) listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [open, active]);

  const openMenu = () => {
    setActive(Math.max(0, options.findIndex((o) => o.value === current)));
    setOpen(true);
  };

  const choose = (o: Opt) => {
    if (o.disabled) return;
    const ev = { target: { value: o.value, name }, currentTarget: { value: o.value, name } };
    onChange?.(ev);
    setOpen(false);
    btnRef.current?.focus();
  };

  const step = (dir: 1 | -1) => {
    let i = active;
    for (let n = 0; n < options.length; n++) {
      i = (i + dir + options.length) % options.length;
      if (!options[i].disabled) { setActive(i); return; }
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openMenu(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); step(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (options[active]) choose(options[active]); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'Tab') setOpen(false);
  };

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        id={id}
        title={title}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-required={required}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
        // caller classes style the box; layout classes below keep text and chevron aligned
        className={`${className} flex items-center justify-between gap-2 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className={`truncate ${selected ? '' : 'opacity-60'}`}>{selected ? selected.label : (options[0]?.label ?? '')}</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-zinc-400 transition-transform duration-150 ${open ? 'rotate-180 text-[#CCFF00]' : ''}`} />
      </button>
      {open && createPortal(
        <ul
          ref={listRef}
          role="listbox"
          style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxH, zIndex: 9999 }}
          className="overflow-y-auto rounded-xl border border-zinc-700 bg-[#141416] p-1 shadow-2xl shadow-black/60 animate-in fade-in zoom-in-95 duration-100"
        >
          {options.map((o, i) => {
            const isSel = o.value === current;
            return (
              <li
                key={`${o.value}-${i}`}
                role="option"
                aria-selected={isSel}
                aria-disabled={o.disabled}
                data-active={i === active}
                onMouseEnter={() => !o.disabled && setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(o)}
                className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-xs font-semibold normal-case tracking-normal text-left ${
                  o.disabled ? 'text-zinc-600 cursor-not-allowed'
                  : isSel ? 'bg-[#CCFF00]/10 text-[#CCFF00] cursor-pointer'
                  : i === active ? 'bg-zinc-800 text-white cursor-pointer'
                  : 'text-zinc-300 cursor-pointer'
                }`}
              >
                <span className="truncate">{o.label}</span>
                {isSel && <Check className="w-3.5 h-3.5 shrink-0" />}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </>
  );
};
