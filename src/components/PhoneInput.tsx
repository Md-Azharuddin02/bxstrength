import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  type CountryCode,
} from 'libphonenumber-js';

export interface CountryOption {
  code: CountryCode;
  name: string;
  flag: string;
  dialCode: string;
}

// Markets we lead with; everything else follows alphabetically. UK first, India second.
const PINNED: CountryCode[] = ['GB', 'IN'];

// Regional-indicator flag emoji from an ISO country code (e.g. "GB" -> 🇬🇧).
const flagOf = (code: string): string =>
  code.replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));

const regionNames =
  typeof Intl !== 'undefined' && 'DisplayNames' in Intl
    ? new Intl.DisplayNames(['en'], { type: 'region' })
    : null;

// Full country list, built from libphonenumber-js so it stays in sync with what we can validate.
export const COUNTRIES: CountryOption[] = (() => {
  const all = getCountries().map((code) => ({
    code,
    name: regionNames?.of(code) ?? code,
    flag: flagOf(code),
    dialCode: '+' + getCountryCallingCode(code),
  }));
  const pinned = PINNED.map((c) => all.find((x) => x.code === c)).filter(Boolean) as CountryOption[];
  const rest = all
    .filter((x) => !PINNED.includes(x.code))
    .sort((a, b) => a.name.localeCompare(b.name));
  return [...pinned, ...rest];
})();

const byCode = (code: CountryCode): CountryOption =>
  COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];

const sameDialCode = (a: CountryCode, b: CountryCode): boolean =>
  getCountryCallingCode(a) === getCountryCallingCode(b);

// Infer the market from a bare national number (no country code). Only switches when the completed
// number is a valid mobile for exactly one of our pinned markets — so an Indian number auto-selects
// India. Numbers valid for both (e.g. UK/India 7-prefix) stay on the current selection.
const detectMarket = (digits: string, current: CountryCode): CountryCode => {
  if (digits.length < 7) return current;
  const matches = PINNED.filter((c) => {
    try {
      return isValidPhoneNumber(digits, c);
    } catch {
      return false;
    }
  });
  return matches.length === 1 ? matches[0] : current;
};

interface PhoneInputProps {
  /** Stored value is E.164 (e.g. "+919876543210") — carries both country and number. */
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  label = 'Mobile Phone Number',
  required = false,
  className = '',
  inputClassName = '',
}) => {
  const [country, setCountry] = useState<CountryCode>('GB');
  // What the input shows: the NATIONAL number only (no dial code — that lives in the badge).
  const [national, setNational] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapRef = useRef<HTMLDivElement>(null);
  // The last E.164 we emitted, so an external value change can be told apart from our own.
  const lastEmitted = useRef('');

  // Emit E.164 upward and keep the national display in sync, for a given national input + country.
  const emit = (nationalInput: string, forCountry: CountryCode) => {
    const formatter = new AsYouType(forCountry);
    const display = formatter.input(nationalInput);
    setNational(display);
    const e164 = formatter.getNumberValue() || '';
    lastEmitted.current = e164;
    onChange(e164);
  };

  // Sync from an externally-set value (e.g. loading a saved profile). Skips our own emissions.
  useEffect(() => {
    if (value === lastEmitted.current) return;
    if (!value) {
      setNational('');
      return;
    }
    const parsed = parsePhoneNumberFromString(value);
    if (parsed) {
      const c = parsed.country ?? country;
      if (!sameDialCode(c, country)) setCountry(c);
      setNational(new AsYouType(c).input(parsed.nationalNumber));
      lastEmitted.current = value;
    } else {
      setNational(value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Close the dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = byCode(country);

  const handleInput = (raw: string) => {
    // If the user pastes/types a full international number, adopt its country and keep only the
    // national part in the field (so the dial code never appears in the input).
    if (raw.trim().startsWith('+')) {
      const formatter = new AsYouType();
      formatter.input(raw.trim());
      const detected = formatter.getCountry() ?? country;
      const e164 = formatter.getNumberValue();
      const parsed = e164 ? parsePhoneNumberFromString(e164) : null;
      if (!sameDialCode(detected, country)) setCountry(detected);
      emit(parsed?.nationalNumber ?? raw.replace(/[^\d]/g, ''), detected);
      return;
    }
    // National entry: once the number is complete, infer the market (UK vs India) and switch.
    const target = detectMarket(raw.replace(/\D/g, ''), country);
    if (target !== country) setCountry(target);
    emit(raw, target);
  };

  const pickCountry = (code: CountryCode) => {
    setCountry(code);
    setOpen(false);
    setSearch('');
    emit(national.replace(/\D/g, ''), code);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dialCode.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [search]);

  return (
    <div className={`space-y-1.5 ${className}`} ref={wrapRef}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative flex items-center">
        {/* Country selector (flag + dial code) */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={`Country: ${selected.name}`}
          aria-expanded={open}
          className="absolute left-1.5 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 bg-zinc-900 border border-zinc-700/80 pl-2 pr-1.5 py-1.5 rounded text-xs font-mono font-bold text-white shadow-sm hover:border-zinc-600 transition-colors cursor-pointer"
        >
          <span className="text-sm leading-none" aria-hidden="true">{selected.flag}</span>
          <span className="text-[11px] text-zinc-200">{selected.dialCode}</span>
          <ChevronDown className="w-3 h-3 text-zinc-400" />
        </button>

        <input
          type="tel"
          inputMode="tel"
          required={required}
          value={national}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="Mobile number"
          className={
            inputClassName ||
            'w-full bg-[#121214] border border-zinc-700 rounded-lg pl-[104px] pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#CCFF00] transition-colors'
          }
        />

        {open && (
          <div className="absolute left-0 top-full mt-1 z-30 w-full max-w-xs rounded-lg bg-[#0e1319] border border-zinc-700 shadow-xl overflow-hidden">
            <div className="flex items-center gap-2 px-2.5 py-2 border-b border-zinc-800">
              <Search className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country or code"
                className="w-full bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
            <ul className="max-h-56 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-3 py-2 text-xs text-zinc-500">No match</li>
              )}
              {filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => pickCountry(c.code)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors ${
                      c.code === country ? 'bg-[#CCFF00]/10 text-white' : 'text-zinc-300 hover:bg-zinc-800'
                    }`}
                  >
                    <span className="text-sm leading-none" aria-hidden="true">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-zinc-500 font-mono">{c.dialCode}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
