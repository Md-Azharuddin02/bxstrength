import React from 'react';

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  placeholder: string;
}

// UK only: BxStrength does not provide services outside the UK
export const COUNTRIES: CountryOption[] = [
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', placeholder: '7911 123456 or 07911 123456' },
];

interface PhoneInputProps {
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
  inputClassName = ''
}) => {
  const selectedCountry = COUNTRIES[0];

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-zinc-300">
          {label} {required && '*'}
        </label>
      )}
      <div className="relative flex items-center">
        {/* Fixed UK country code */}
        <div
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 flex items-center gap-1 bg-zinc-900 border border-zinc-700/80 px-2 py-1 rounded text-xs font-mono font-bold text-white shadow-sm select-none"
          title={selectedCountry.name}
        >
          <span className="text-sm leading-none" aria-hidden="true">{selectedCountry.flag}</span>
          <span className="text-[11px] text-zinc-200 font-bold">{selectedCountry.dialCode}</span>
        </div>

        {/* Input Field */}
        <input
          type="tel"
          inputMode="tel"
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={selectedCountry.placeholder}
          className={
            inputClassName ||
            "w-full bg-[#121214] border border-zinc-700 rounded-lg pl-[84px] pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#CCFF00] transition-colors"
          }
        />
      </div>
    </div>
  );
};
