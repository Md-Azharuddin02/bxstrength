import React, { useState } from 'react';
import { BodyStat } from '../../types';
import { VelocityAPI } from '../../services/api';
import { Scale, Plus, X, History, Activity, AlertCircle } from 'lucide-react';
import {
  cmFromFeetInches,
  cmFromInches,
  feetInchesFromCm,
  formatWeight,
  inchesFromCm,
  kgFromStoneLbs,
  stoneLbsFromKg,
} from '../../utils/bodyWeight';

type UnitSystem = 'metric' | 'imperial';

const TAPE_FIELDS = [
  { key: 'chest', label: 'Chest' },
  { key: 'waist', label: 'Waist' },
  { key: 'biceps', label: 'Biceps' },
  { key: 'thighs', label: 'Thighs' },
] as const;

const parseNum = (value: string) => parseFloat(value) || 0;
const showNum = (value: number) => (value > 0 ? String(value) : '');

const mainInputClass = 'w-full bg-gray-900 border border-gray-800 focus:border-[#E52165] text-white px-3.5 py-2.5 text-sm rounded-none outline-none font-mono';

interface BodyStatsTrackerProps {
  stats: BodyStat[];
  status: 'loading' | 'ready' | 'error';
  onStatsUpdated: () => void;
  onShowToast: (msg: string) => void;
}

export const BodyStatsTracker: React.FC<BodyStatsTrackerProps> = ({
  stats,
  status,
  onStatsUpdated,
  onShowToast
}) => {
  const [showAddForm, setShowAddForm] = useState(status === 'ready' && stats.length === 0);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('metric');
  const [weightKg, setWeightKg] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [stone, setStone] = useState<string>('');
  const [pounds, setPounds] = useState<string>('');
  const [feet, setFeet] = useState<string>('');
  const [inches, setInches] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [tape, setTape] = useState({ chest: '', waist: '', biceps: '', thighs: '' });

  const isImperial = unitSystem === 'imperial';

  // Stats are always stored in metric, whichever units the form is showing
  const weightNum = isImperial ? kgFromStoneLbs(parseNum(stone), parseNum(pounds)) : parseNum(weightKg);
  const heightNum = isImperial ? cmFromFeetInches(parseNum(feet), parseNum(inches)) : parseNum(heightCm);
  const tapeCm = (value: string) => (isImperial ? cmFromInches(parseNum(value)) : parseNum(value)) || undefined;

  // Convert what's typed so a value is never reinterpreted in the new unit
  const switchUnits = (next: UnitSystem) => {
    if (next === unitSystem) return;
    if (next === 'imperial') {
      const { st, lbs } = stoneLbsFromKg(weightNum);
      const { ft, inches: inchesPart } = feetInchesFromCm(heightNum);
      setStone(showNum(st));
      setPounds(showNum(lbs));
      setFeet(showNum(ft));
      setInches(showNum(inchesPart));
    } else {
      setWeightKg(showNum(weightNum));
      setHeightCm(showNum(heightNum));
    }
    const convertTape = (value: string) => showNum(next === 'imperial' ? inchesFromCm(parseNum(value)) : cmFromInches(parseNum(value)));
    setTape({
      chest: convertTape(tape.chest),
      waist: convertTape(tape.waist),
      biceps: convertTape(tape.biceps),
      thighs: convertTape(tape.thighs),
    });
    setUnitSystem(next);
  };

  // Preview BMI calculation
  const heightM = heightNum / 100;
  const calculatedBmi = heightM > 0 ? Number((weightNum / (heightM * heightM)).toFixed(1)) : 0;

  let bmiCat = '--';
  let bmiColor = 'text-gray-400';
  let bmiBg = 'bg-gray-900/60 border-gray-800';

  if (calculatedBmi > 0) {
    if (calculatedBmi < 18.5) {
      bmiCat = 'Underweight';
      bmiColor = 'text-amber-400';
      bmiBg = 'bg-amber-950/60 border-amber-800';
    } else if (calculatedBmi >= 18.5 && calculatedBmi <= 24.9) {
      bmiCat = 'Normal Weight';
      bmiColor = 'text-emerald-400';
      bmiBg = 'bg-emerald-950/60 border-emerald-800';
    } else if (calculatedBmi >= 25.0 && calculatedBmi <= 29.9) {
      bmiCat = 'Overweight';
      bmiColor = 'text-orange-400';
      bmiBg = 'bg-orange-950/60 border-orange-800';
    } else {
      bmiCat = 'Obese';
      bmiColor = 'text-red-400';
      bmiBg = 'bg-red-950/60 border-red-800';
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedBmi <= 0) {
      onShowToast('Please enter valid weight and height values.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await VelocityAPI.addBodyStat({
        weightKg: weightNum,
        heightCm: heightNum,
        bodyFatPercentage: parseFloat(bodyFat) || undefined,
        chestCm: tapeCm(tape.chest),
        waistCm: tapeCm(tape.waist),
        bicepsCm: tapeCm(tape.biceps),
        thighsCm: tapeCm(tape.thighs)
      });

      onShowToast(`Logged weight ${formatWeight(saved.weightKg, isImperial ? 'st' : 'kg')} with BMI ${saved.bmi}!`);
      setShowAddForm(false);
      onStatsUpdated();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to log stats');
    } finally {
      setIsSaving(false);
    }
  };

  const latest = stats.length > 0 ? stats[stats.length - 1] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111111] border border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Scale className="w-5 h-5 text-white" />
            BODY METRICS & BMI TRACKER
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Track body weight, calculated Body Mass Index (BMI), body fat %, and tape measurements.
          </p>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-white hover:bg-zinc-200 text-black text-xs font-black tracking-widest px-5 py-3 uppercase transition-all shadow-md flex items-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? 'CANCEL FORM' : 'LOG NEW WEIGHT'}</span>
        </button>
      </div>

      {/* Interactive Log Form */}
      {showAddForm && (
        <div className="bg-[#111111] border border-zinc-700 p-6 animate-in slide-in-from-top-4 duration-200">
          <div className="mb-4 border-b border-gray-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                LOG TODAY'S MEASUREMENTS
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Keep track of your weight, BMI, body fat, and measurements as you progress.
              </p>
            </div>

            <div className="flex self-start sm:self-auto border border-gray-700 text-[10px] font-bold shrink-0" role="group" aria-label="Measurement units">
              {([['metric', 'Metric: kg / cm'], ['imperial', 'Imperial: st / lbs / inches']] as const).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => switchUnits(value)}
                  aria-pressed={unitSystem === value}
                  className={`px-3 py-2 cursor-pointer transition-colors ${unitSystem === value ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  {isImperial ? 'Body Weight (st / lbs) *' : 'Body Weight (kg) *'}
                </label>
                {isImperial ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="st"
                      aria-label="Weight in stone"
                      value={stone}
                      onChange={(e) => setStone(e.target.value)}
                      className={mainInputClass}
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      max="13.9"
                      step="0.1"
                      placeholder="lbs"
                      aria-label="Additional pounds"
                      value={pounds}
                      onChange={(e) => setPounds(e.target.value)}
                      className={mainInputClass}
                    />
                  </div>
                ) : (
                  <input
                    type="number"
                    step="0.1"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className={mainInputClass}
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  {isImperial ? 'Height (ft / inches) *' : 'Height (cm) *'}
                </label>
                {isImperial ? (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="ft"
                      aria-label="Height in feet"
                      value={feet}
                      onChange={(e) => setFeet(e.target.value)}
                      className={mainInputClass}
                      required
                    />
                    <input
                      type="number"
                      min="0"
                      max="11.9"
                      step="0.1"
                      placeholder="in"
                      aria-label="Additional inches"
                      value={inches}
                      onChange={(e) => setInches(e.target.value)}
                      className={mainInputClass}
                    />
                  </div>
                ) : (
                  <input
                    type="number"
                    step="0.1"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className={mainInputClass}
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Body Fat % (Optional)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bodyFat}
                  onChange={(e) => setBodyFat(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-[#E52165] text-white px-3.5 py-2.5 text-sm rounded-none outline-none font-mono"
                />
              </div>
            </div>

            {/* Realtime Live BMI Calculation Preview */}
            <div className={`p-4 border ${bmiBg} flex items-center justify-between`}>
              <div className="flex items-center gap-3">
                <Activity className={`w-6 h-6 ${bmiColor}`} />
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    REALTIME AUTO-CALCULATED BMI
                  </span>
                  <div className="text-xl font-black text-white font-mono">
                    {calculatedBmi > 0 ? calculatedBmi : '--'}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-gray-400 block uppercase">WHO Category</span>
                <span className={`text-sm font-black uppercase ${bmiColor}`}>{bmiCat}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {TAPE_FIELDS.map(({ key, label }) => (
                <div key={key}>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                    {label} ({isImperial ? 'inches' : 'cm'})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={tape[key]}
                    onChange={(e) => setTape({ ...tape, [key]: e.target.value })}
                    className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-xs rounded-none font-mono"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="bg-[#E52165] hover:bg-[#c41551] disabled:opacity-50 text-white text-xs font-black tracking-widest px-6 py-3 uppercase transition-all"
            >
              {isSaving ? 'SAVING...' : 'SAVE BODY STAT ENTRY'}
            </button>
          </form>
        </div>
      )}

      {/* Latest Summary & Health Ranges */}
      {latest && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#111111] border border-gray-800 p-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              LATEST LOGGED WEIGHT
            </span>
            <div className="text-3xl font-black text-white font-mono">{latest.weightKg} kg</div>
            <p className="text-xs text-gray-400 mt-1">Logged on {latest.date}</p>
          </div>

          <div className="bg-[#111111] border border-gray-800 p-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              BODY MASS INDEX (BMI)
            </span>
            <div className="text-3xl font-black text-[#E52165] font-mono">{latest.bmi}</div>
            <p className="text-xs text-emerald-400 font-semibold mt-1">Category: {latest.bmiCategory}</p>
          </div>

          <div className="bg-[#111111] border border-gray-800 p-5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              ESTIMATED BODY FAT %
            </span>
            <div className="text-3xl font-black text-white font-mono">
              {latest.bodyFatPercentage ? `${latest.bodyFatPercentage}%` : 'N/A'}
            </div>
            <p className="text-xs text-gray-400 mt-1">Target range: 12% - 18%</p>
          </div>
        </div>
      )}

      {/* Historical Table */}
      <div className="bg-[#111111] border border-gray-800 p-6">
        <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
          <History className="w-4 h-4 text-[#E52165]" />
          MEASUREMENT HISTORY
        </h3>

        {stats.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            {status === 'loading' && 'Loading your body stats...'}
            {status === 'error' && 'Your body stats could not be loaded.'}
            {status === 'ready' && (showAddForm
              ? 'No body stat entries recorded yet. Complete the form above to log your first entry.'
              : 'No body stat entries recorded yet. Select "Log New Weight" above to log your first entry.')}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-800 text-gray-400 uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Weight (kg)</th>
                  <th className="py-3 px-4">Height (cm)</th>
                  <th className="py-3 px-4">Calculated BMI</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Body Fat %</th>
                  <th className="py-3 px-4">Waist (cm)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-gray-200">
                {stats.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-900/50 transition-colors">
                    <td className="py-3 px-4 font-mono">{s.date}</td>
                    <td className="py-3 px-4 font-bold text-white font-mono">{s.weightKg} kg</td>
                    <td className="py-3 px-4 font-mono">{s.heightCm} cm</td>
                    <td className="py-3 px-4 font-bold text-[#E52165] font-mono">{s.bmi}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-gray-800 text-emerald-400 font-bold uppercase text-[10px] border border-gray-700">
                        {s.bmiCategory}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono">{s.bodyFatPercentage ? `${s.bodyFatPercentage}%` : '-'}</td>
                    <td className="py-3 px-4 font-mono">{s.waistCm ? `${s.waistCm} cm` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
