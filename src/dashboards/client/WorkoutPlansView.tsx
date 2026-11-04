import React, { useState } from 'react';
import { WorkoutProgram, ExerciseItem } from '../../types';
import { Dumbbell, CheckCircle2, Circle, Flame, Activity, Clock, Target, ShieldCheck } from 'lucide-react';

interface WorkoutPlansViewProps {
  programs: WorkoutProgram[];
  onShowToast: (msg: string) => void;
}

export const WorkoutPlansView: React.FC<WorkoutPlansViewProps> = ({ programs, onShowToast }) => {
  const [activeProgIndex, setActiveProgIndex] = useState(0);
  const [exerciseState, setExerciseState] = useState<Record<string, boolean>>({});

  const publishedPrograms = (programs || []).filter(p => p.isPublishedToClient !== false);

  if (!publishedPrograms || publishedPrograms.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-[#111111] border border-gray-800 p-6">
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-white" />
            MY WORKOUT PROGRAMMES & ROUTINES
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Personalised exercise routines assigned by your BxStrength head coach.
          </p>
        </div>
        <div className="bg-[#111111] border border-gray-800 p-12 text-center space-y-3 rounded-xl">
          <Dumbbell className="w-10 h-10 text-gray-600 mx-auto" />
          <h3 className="text-sm font-black uppercase text-white tracking-wider">NO WORKOUT PROGRAMME PUBLISHED YET</h3>
          <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
            Your personal BxStrength coach is finalising your customised workout protocol. Once reviewed and published, it will automatically appear here.
          </p>
        </div>
      </div>
    );
  }

  const currentProg = publishedPrograms[activeProgIndex] || publishedPrograms[0];

  const toggleExercise = (exId: string, exName: string) => {
    const nextState = !exerciseState[exId];
    setExerciseState({ ...exerciseState, [exId]: nextState });
    if (nextState) {
      onShowToast(`Completed exercise: ${exName}! Keep crushing it 🔥`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#111111] border border-gray-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-white" />
            MY WORKOUT PROGRAMMES & ROUTINES
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Personalised exercise routines assigned by your BxStrength head coach.
          </p>
        </div>

        {publishedPrograms.length > 1 && (
          <div className="flex items-center gap-2">
            {publishedPrograms.map((prog, idx) => (
              <button
                key={prog.id}
                onClick={() => setActiveProgIndex(idx)}
                className={`px-3 py-1.5 text-xs font-bold uppercase transition-all rounded ${
                  activeProgIndex === idx
                    ? 'bg-white text-black'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                Programme #{idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {currentProg ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Routine Details */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-[#111111] border border-gray-800 p-6 rounded-lg">
              <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    {currentProg.level} LEVEL ROUTINE
                  </span>
                  <h3 className="text-xl font-black uppercase text-white mt-0.5">{currentProg.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{currentProg.description}</p>
                </div>

                <div className="bg-gray-900 border border-gray-800 px-4 py-2.5 text-center rounded">
                  <span className="block text-[9px] uppercase font-bold text-gray-400">DURATION</span>
                  <span className="text-sm font-black text-white">{currentProg.durationWeeks} WEEKS</span>
                </div>
              </div>

              {/* Exercise Checklist */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-300 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  EXERCISES CHECKLIST & INSTRUCTIONS
                </h4>

                {currentProg.exercises.map((ex: ExerciseItem, idx: number) => {
                  const isDone = exerciseState[ex.id] ?? ex.isCompleted ?? false;
                  return (
                    <div
                      key={ex.id}
                      onClick={() => toggleExercise(ex.id, ex.name)}
                      className={`p-4 border transition-all cursor-pointer flex items-center justify-between rounded ${
                        isDone
                          ? 'bg-emerald-950/30 border-emerald-800/80 text-gray-300'
                          : 'bg-gray-900/80 border-gray-800 hover:border-gray-700 text-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button className="mt-0.5 text-gray-400 hover:text-emerald-400">
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <Circle className="w-5 h-5 text-gray-600" />
                          )}
                        </button>
                        <div>
                          <span className={`text-sm font-bold uppercase block ${isDone ? 'line-through text-gray-400' : 'text-white'}`}>
                            {idx + 1}. {ex.name}
                          </span>
                          <p className="text-xs text-gray-400 mt-0.5">
                            Target: <span className="text-pink-400 font-semibold">{ex.targetMuscle}</span>
                            {ex.notes && ` • Note: ${ex.notes}`}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-white bg-black px-2.5 py-1 border border-gray-800 rounded">
                          {ex.sets} sets × {ex.reps}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Coach & Session Stats */}
          <div className="space-y-6">
            <div className="bg-[#111111] border border-gray-800 p-6 rounded-lg">
              <h3 className="text-sm font-black uppercase tracking-wider text-white mb-3 border-b border-gray-800 pb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                ASSIGNMENT ATTRIBUTION
              </h3>
              <div className="space-y-2 text-xs">
                <div className="bg-amber-950/30 border border-amber-800/40 p-2.5 rounded">
                  <span className="text-[10px] text-amber-400 uppercase font-bold block">ASSIGNER</span>
                  <span className="text-white font-bold">{currentProg.assignedBy || 'Shaban Faridi'}</span>
                  <span className="text-amber-200/70 text-[10px] block">({currentProg.assignedByRole || 'Head Coach'})</span>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-2.5 rounded">
                  <span className="text-[10px] text-gray-400 uppercase font-bold block">DESIGNATED COACH</span>
                  <span className="text-emerald-400 font-bold">{currentProg.assignedCoachName || currentProg.createdBy || 'BxStrength Coach'}</span>
                </div>

                <div className="flex justify-between text-gray-400 text-[11px] pt-1 border-t border-gray-800">
                  <span>Assigned Date:</span>
                  <span className="font-mono text-white">{new Date(currentProg.assignedAt || currentProg.createdAt).toLocaleDateString()}</span>
                </div>

                {currentProg.publishedToClientAt && (
                  <div className="flex justify-between text-gray-400 text-[11px]">
                    <span>Published Date:</span>
                    <span className="font-mono text-emerald-400">{new Date(currentProg.publishedToClientAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-[#111111] border border-gray-800 p-6 text-center">
              <Flame className="w-10 h-10 text-orange-500 mx-auto mb-2 animate-bounce" />
              <h4 className="text-base font-black uppercase text-white">READY TO CRUSH IT?</h4>
              <p className="text-xs text-gray-400 mt-1 mb-4">
                Mark completed exercises as you progress through each set in the gym.
              </p>
              <button
                onClick={() => onShowToast('Workout session started! Timer running.')}
                className="w-full bg-[#E52165] text-white text-xs font-black tracking-widest py-3 uppercase shadow-md shadow-pink-500/20"
              >
                START WORKOUT TIMER
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#111111] border border-gray-800 p-8 text-center text-xs text-gray-400">
          No assigned workout routines found.
        </div>
      )}
    </div>
  );
};
