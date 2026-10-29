import React, { useState, useEffect } from 'react';

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  placeholder: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', placeholder: '7911 123456' },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', placeholder: '98765 43210' }
];

// Splits a stored value like "+44 7911123456" into country + number
const parsePhone = (raw: string): { country: CountryOption | null; national: string } => {
  const v = (raw || '').trim();
  for (const c of COUNTRIES) {
    if (v.startsWith(c.dialCode)) {
      return { country: c, national: v.slice(c.dialCode.length).trim() };
    }
  }
  // Legacy numbers saved as 91XXXXXXXXXX without "+"
  if (/^91\d{10}$/.test(v)) {
    return { country: COUNTRIES[1], national: v.slice(2) };
  }
  return { country: null, national: v };
};

interface PhoneInputProps {
  value: string; // full value including country code, e.g. "+44 7911123456"
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
  inputClassName = ''
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryOption>(
    () => parsePhone(value).country || COUNTRIES[0]
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Keep the flag/code in sync when the value arrives later (e.g. profile loads)
  useEffect(() => {
    const parsed = parsePhone(value);
    if (parsed.country && parsed.country.code !== selectedCountry.code) {
      setSelectedCountry(parsed.country);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const { national } = parsePhone(value);

  const emit = (country: CountryOption, num: string) => {
    const cleaned = num.trim();
    onChange(cleaned ? `${country.dialCode} ${cleaned}` : '');
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative flex items-center">
        {/* Country selector */}
        <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 px-2 py-1 rounded text-xs font-mono font-bold text-white shadow-sm transition-colors cursor-pointer select-none"
            title="Select Country Code"
          >
            <span className="text-sm leading-none">{selectedCountry.flag}</span>
            <span className="text-[11px] text-zinc-200 font-bold">{selectedCountry.dialCode}</span>
            <span className="text-[9px] text-zinc-400 ml-0.5">▼</span>
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-[#18181b] border border-zinc-700 rounded-lg shadow-2xl overflow-hidden z-30">
              {COUNTRIES.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setSelectedCountry(c);
                    setIsOpen(false);
                    if (national) emit(c, national);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold transition-colors cursor-pointer text-left ${
                    selectedCountry.code === c.code
                      ? 'bg-[#CCFF00]/15 text-[#CCFF00]'
                      : 'text-zinc-200 hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-base leading-none">{c.flag}</span>
                  <div className="flex flex-col">
                    <span>{c.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">{c.dialCode}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Number field: shows only the number, code is added on output */}
        <input
          type="tel"
          inputMode="tel"
          required={required}
          value={national}
          onChange={(e) => emit(selectedCountry, e.target.value)}
          onBlur={() => {
            // UK: "07911..." becomes "+44 7911..." (drop the leading 0)
            if (selectedCountry.code === 'GB' && national.startsWith('0')) {
              emit(selectedCountry, national.replace(/^0+/, ''));
            }
          }}
          placeholder={selectedCountry.placeholder}
          className={
            inputClassName ||
            'w-full bg-[#121214] border border-zinc-700 rounded-lg pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#CCFF00] transition-colors'
          }
          style={{ paddingLeft: '96px' }}
        />
      </div>
    </div>
  );
};