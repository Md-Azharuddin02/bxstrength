import React, { useState } from 'react';
import { BodyStat } from '../../types';
import { VelocityAPI } from '../../services/api';
import { Scale, Plus, History, Activity, AlertCircle } from 'lucide-react';

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
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form fields
  const [weightKg, setWeightKg] = useState<string>('');
  const [heightCm, setHeightCm] = useState<string>('');
  const [bodyFat, setBodyFat] = useState<string>('');
  const [chestCm, setChestCm] = useState<string>('');
  const [waistCm, setWaistCm] = useState<string>('');
  const [bicepsCm, setBicepsCm] = useState<string>('');
  const [thighsCm, setThighsCm] = useState<string>('');

  // Preview BMI calculation
  const weightNum = parseFloat(weightKg) || 0;
  const heightM = (parseFloat(heightCm) || 0) / 100;
  const calculatedBmi = heightM > 0 ? Number((weightNum / (heightM * heightM)).toFixed(1)) : 0;

  let bmiCat = 'Normal';
  let bmiColor = 'text-emerald-400';
  let bmiBg = 'bg-emerald-950/60 border-emerald-800';

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
    if (!weightNum || !heightM) {
      onShowToast('Please enter valid weight and height values.');
      return;
    }

    setIsSaving(true);
    try {
      const saved = await VelocityAPI.addBodyStat({
        weightKg: weightNum,
        heightCm: parseFloat(heightCm),
        bodyFatPercentage: parseFloat(bodyFat) || undefined,
        chestCm: parseFloat(chestCm) || undefined,
        waistCm: parseFloat(waistCm) || undefined,
        bicepsCm: parseFloat(bicepsCm) || undefined,
        thighsCm: parseFloat(thighsCm) || undefined
      });

      onShowToast(`Logged weight ${saved.weightKg}kg with BMI ${saved.bmi}!`);
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
          <Plus className="w-4 h-4" />
          <span>{showAddForm ? 'CANCEL FORM' : 'LOG NEW WEIGHT'}</span>
        </button>
      </div>

      {/* Interactive Log Form */}
      {showAddForm && (
        <div className="bg-[#111111] border border-zinc-700 p-6 animate-in slide-in-from-top-4 duration-200">
          <h3 className="text-sm font-black uppercase tracking-wider text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            RECORD DAILY BODY COMPOSITION LOG
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Body Weight (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-[#E52165] text-white px-3.5 py-2.5 text-sm rounded-none outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1">
                  Height (cm) *
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 focus:border-[#E52165] text-white px-3.5 py-2.5 text-sm rounded-none outline-none font-mono"
                  required
                />
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
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Chest (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={chestCm}
                  onChange={(e) => setChestCm(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-xs rounded-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Waist (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-xs rounded-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Biceps (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={bicepsCm}
                  onChange={(e) => setBicepsCm(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-xs rounded-none font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                  Thighs (cm)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={thighsCm}
                  onChange={(e) => setThighsCm(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 text-white px-3 py-2 text-xs rounded-none font-mono"
                />
              </div>
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
          HISTORICAL BODY COMPOSITION LOGS
        </h3>

        {stats.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-400">
            {status === 'loading' && 'Loading your body stats...'}
            {status === 'error' && 'Your body stats could not be loaded.'}
            {status === 'ready' && 'No body stat entries recorded yet. Click "Log New Weight" above to get started.'}
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
