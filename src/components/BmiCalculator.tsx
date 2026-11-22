import React, { useState, useId } from 'react';
import { Calculator, Info, CheckCircle2, AlertCircle, Dumbbell, Activity } from 'lucide-react';
import { Select } from './ui/Select';

export const BmiCalculator: React.FC = () => {
  const [age, setAge] = useState<string>('25');
  const [weight, setWeight] = useState<string>('70');
  const [height, setHeight] = useState<string>('175');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [unitSystem, setUnitSystem] = useState<'metric' | 'imperial'>('metric');
  
  const [bmiResult, setBmiResult] = useState<{
    bmi: number;
    status: string;
    color: string;
    recommendation: string;
  } | null>(null);

  const [showExplanationModal, setShowExplanationModal] = useState(false);

  const ageInputId = useId();
  const weightInputId = useId();
  const heightInputId = useId();
  const genderInputId = useId();

  const calculateBmi = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const w = parseFloat(weight);
    const h = parseFloat(height);

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;

    let bmiValue = 0;
    if (unitSystem === 'metric') {
      // weight (kg) / [height (m)]^2
      const heightInMeters = h / 100;
      bmiValue = w / (heightInMeters * heightInMeters);
    } else {
      // 703 * weight (lbs) / [height (in)]^2
      bmiValue = (703 * w) / (h * h);
    }

    const roundedBmi = parseFloat(bmiValue.toFixed(1));

    let status = 'Normal weight';
    let color = 'text-emerald-500';
    let recommendation = 'Great job! Maintain your physique with Cycling & General Conditioning.';

    if (roundedBmi < 18.5) {
      status = 'Underweight';
      color = 'text-amber-500';
      recommendation = 'We recommend our Tone Muscle & Progressive Strength Training classes.';
    } else if (roundedBmi >= 18.5 && roundedBmi < 25) {
      status = 'Normal weight';
      color = 'text-emerald-500';
      recommendation = 'Optimal score! Keep up your fitness with Cycling Training & Meditation.';
    } else if (roundedBmi >= 25 && roundedBmi < 30) {
      status = 'Overweight';
      color = 'text-orange-500';
      recommendation = 'Focus on high calorie-burn classes: Boxing Power & CrossFit Blast.';
    } else {
      status = 'Obese';
      color = 'text-rose-600';
      recommendation = 'Start with low-impact Personal Training & Cardio Conditioning.';
    }

    setBmiResult({ bmi: roundedBmi, status, color, recommendation });
  };

  return (
    <section className="py-20 bg-[#F8F9FA] relative overflow-hidden border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Calculator Form */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <span className="text-xs font-black tracking-widest text-[#E52165] uppercase">
                HEALTH METRICS
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight mt-1">
                CALCULATE YOUR BMI
              </h2>
              <div className="w-12 h-1 bg-[#E52165] mt-2"></div>
            </div>

            <p className="text-gray-500 text-xs sm:text-sm font-normal leading-relaxed max-w-xl">
              Use our real-time BMI calculator to assess your current body composition baseline. Head Coach Shahban uses these key metrics to tailor custom training protocols and nutritional macro targets for maximum results.
            </p>

            {/* Units Toggle */}
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs font-extrabold uppercase text-gray-700">Unit System:</span>
              <div className="inline-flex rounded border border-gray-300 p-0.5 bg-white text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setUnitSystem('metric'); setHeight('175'); setWeight('70'); }}
                  className={`px-3 py-1 uppercase ${unitSystem === 'metric' ? 'bg-[#E52165] text-white' : 'text-gray-600'}`}
                >
                  Metric (kg / cm)
                </button>
                <button
                  type="button"
                  onClick={() => { setUnitSystem('imperial'); setHeight('69'); setWeight('154'); }}
                  className={`px-3 py-1 uppercase ${unitSystem === 'imperial' ? 'bg-[#E52165] text-white' : 'text-gray-600'}`}
                >
                  Imperial (lbs / in)
                </button>
              </div>
            </div>

            {/* Inputs Grid matching screenshot input slots */}
            <form onSubmit={calculateBmi} className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Age */}
                <div>
                  <label htmlFor={ageInputId} className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                    YOUR AGE
                  </label>
                  <input
                    id={ageInputId}
                    type="number"
                    min="10"
                    max="100"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#E52165]"
                    placeholder="Age"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label htmlFor={weightInputId} className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                    YOUR WEIGHT ({unitSystem === 'metric' ? 'KG' : 'LBS'})
                  </label>
                  <input
                    id={weightInputId}
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#E52165]"
                    placeholder="Weight"
                  />
                </div>

                {/* Height */}
                <div>
                  <label htmlFor={heightInputId} className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                    YOUR HEIGHT ({unitSystem === 'metric' ? 'CM' : 'INCHES'})
                  </label>
                  <input
                    id={heightInputId}
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#E52165]"
                    placeholder="Height"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gender */}
                <div>
                  <label htmlFor={genderInputId} className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                    YOUR GENDER
                  </label>
                  <Select
                    id={genderInputId}
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Male' | 'Female')}
                    className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-bold text-gray-900 focus:outline-none focus:border-[#E52165]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </Select>
                </div>

                {/* Dynamic Calculated BMI Field */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-gray-700 mb-1">
                    YOUR BMI IS
                  </label>
                  <div className="w-full bg-white border border-gray-300 px-4 py-3 text-xs font-black text-gray-900 flex items-center justify-between">
                    <span>{bmiResult ? bmiResult.bmi : '—'}</span>
                    {bmiResult && (
                      <span className={`text-[11px] uppercase font-bold ${bmiResult.color}`}>
                        {bmiResult.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="w-full sm:w-auto bg-[#E52165] hover:bg-[#c41551] text-white font-extrabold text-xs tracking-widest uppercase px-8 py-4 transition-all shadow-md shadow-pink-500/20 min-h-[44px] flex items-center justify-center"
                  id="btn-calculate-bmi"
                >
                  CALCULATE NOW
                </button>

                <button
                  type="button"
                  onClick={() => setShowExplanationModal(true)}
                  className="w-full sm:w-auto bg-gray-900 hover:bg-black text-white font-extrabold text-xs tracking-widest uppercase px-6 py-4 transition-all flex items-center justify-center gap-1.5 min-h-[44px]"
                >
                  <Info className="w-4 h-4 text-[#E52165]" /> WHAT IS BMI
                </button>
              </div>
            </form>

            {/* Calculated Recommendation Box */}
            {bmiResult && (
              <div className="bg-white border-l-4 border-[#E52165] p-4 shadow-sm text-xs space-y-1 animate-in fade-in">
                <p className="font-extrabold text-gray-900 uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#E52165]" />
                  Result Analysis: <span className={bmiResult.color}>{bmiResult.bmi} ({bmiResult.status})</span>
                </p>
                <p className="text-gray-600 font-medium">
                  {bmiResult.recommendation}
                </p>
              </div>
            )}

          </div>

          {/* Right Athlete Push-up Illustration */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800"
                alt="Pushup Athlete BMI"
                className="w-full max-w-md h-[320px] sm:h-[380px] object-cover object-center shadow-lg border border-gray-200"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-black/75 backdrop-blur-md p-3 text-white text-xs border border-white/20">
                <p className="font-black uppercase text-[#E52165]">PRO FITNESS TRACKING</p>
                <p className="text-[11px] text-gray-300">Target your ideal strength to weight ratio with personalized training.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Explanation Modal */}
      {showExplanationModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-0 sm:p-4">
          <div className="bg-white max-w-lg w-full h-full sm:h-auto sm:max-h-[90vh] p-4 sm:p-6 rounded-none sm:rounded-xl shadow-2xl border-0 sm:border border-gray-200 animate-in zoom-in-95 overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-black uppercase text-gray-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[#E52165]" /> Body Mass Index (BMI) Guide
              </h3>
              <button 
                onClick={() => setShowExplanationModal(false)}
                className="text-gray-400 hover:text-gray-700 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-gray-600 leading-relaxed">
              <p>
                <strong>Body Mass Index (BMI)</strong> is a simple calculation using a person’s height and weight. 
                The formula is <code>BMI = kg/m²</code> where kg is a person’s weight in kilograms and m² is their height in metres squared.
              </p>

              <div className="space-y-1.5 pt-2">
                <p className="font-bold text-gray-900 uppercase">Standard Health Ranges:</p>
                <div className="flex justify-between p-2 bg-gray-50 border-l-2 border-amber-400 font-mono">
                  <span>Below 18.5</span> <span className="font-bold text-amber-600">Underweight</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 border-l-2 border-emerald-500 font-mono">
                  <span>18.5 – 24.9</span> <span className="font-bold text-emerald-600">Normal / Healthy</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 border-l-2 border-orange-500 font-mono">
                  <span>25.0 – 29.9</span> <span className="font-bold text-orange-600">Overweight</span>
                </div>
                <div className="flex justify-between p-2 bg-gray-50 border-l-2 border-rose-600 font-mono">
                  <span>30.0 or Higher</span> <span className="font-bold text-rose-600">Obese</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowExplanationModal(false)}
                className="bg-[#E52165] text-white font-extrabold text-xs px-6 py-2.5 uppercase tracking-wider"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
