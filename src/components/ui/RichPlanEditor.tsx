import React, { useRef, useState, useEffect } from 'react';
import { Bold, Italic, Heading2, Heading3, List, ListOrdered, Sparkles, Eye, Code, FileText } from 'lucide-react';

interface RichPlanEditorProps {
  value: string;
  onChange: (html: string) => void;
  type?: 'workout' | 'diet';
  placeholder?: string;
}

export const RichPlanEditor: React.FC<RichPlanEditorProps> = ({
  value,
  onChange,
  type = 'workout',
  placeholder = 'Write custom plan details here...'
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<'visual' | 'code' | 'preview'>('visual');
  const [htmlCode, setHtmlCode] = useState(value);

  // Sync internal state with prop value
  useEffect(() => {
    setHtmlCode(value);
    if (editorRef.current && editorRef.current.innerHTML !== value && activeTab === 'visual') {
      editorRef.current.innerHTML = value || '';
    }
  }, [value, activeTab]);

  const handleInput = () => {
    if (editorRef.current) {
      const newHtml = editorRef.current.innerHTML;
      setHtmlCode(newHtml);
      onChange(newHtml);
    }
  };

  const executeCommand = (command: string, arg: string | undefined = undefined) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, arg);
      handleInput();
    }
  };

  const insertTemplate = () => {
    const template = type === 'workout'
      ? `<h3>WEEK 1 ROUTINE OVERVIEW</h3>
<p><strong>Goal:</strong> Strength & Core Conditioning (Focus on controlled tempo & posture)</p>

<h4>DAY 1: CHEST, SHOULDERS & TRICEPS</h4>
<ul>
  <li><strong>Barbell Bench Press:</strong> 4 sets x 8-10 reps (Rest 90s)</li>
  <li><strong>Incline Dumbbell Press:</strong> 3 sets x 10-12 reps</li>
  <li><strong>Dumbbell Lateral Raises:</strong> 4 sets x 15 reps</li>
  <li><strong>Tricep Cable Pushdowns:</strong> 3 sets x 12 reps</li>
</ul>

<h4>DAY 2: BACK & BICEPS</h4>
<ul>
  <li><strong>Barbell Bent-Over Rows:</strong> 4 sets x 8-10 reps</li>
  <li><strong>Lat Pulldowns:</strong> 3 sets x 10-12 reps</li>
  <li><strong>Seated Cable Rows:</strong> 3 sets x 12 reps</li>
  <li><strong>Dumbbell Incline Curls:</strong> 3 sets x 12 reps</li>
</ul>

<h4>DAY 3: LEGS & CORE</h4>
<ul>
  <li><strong>Barbell Back Squats:</strong> 4 sets x 8-10 reps</li>
  <li><strong>Romanian Deadlifts:</strong> 3 sets x 10 reps</li>
  <li><strong>Leg Press:</strong> 3 sets x 12 reps</li>
  <li><strong>Plank Holds / Hanging Knee Raises:</strong> 3 sets x 45s</li>
</ul>`
      : `<h3>DAILY NUTRITION PROTOCOL</h3>
<p><strong>Target:</strong> High Protein Deficit (1800 kcal | 150g Protein | 40g Fats | 160g Carbs)</p>

<h4>MEAL 1: BREAKFAST (8:30 AM)</h4>
<ul>
  <li>3 Whole Eggs + 2 Egg Whites scrambled with spinach</li>
  <li>1 Slice 100% whole grain sourdough toast</li>
  <li>Black Coffee or Green Tea (No sugar)</li>
</ul>

<h4>MEAL 2: MID-DAY SNACK (12:00 PM)</h4>
<ul>
  <li>1 Scoop Whey Protein Isolate in water or almond milk</li>
  <li>1 Handful raw almonds (20g) or 1 green apple</li>
</ul>

<h4>MEAL 3: LUNCH (2:00 PM)</h4>
<ul>
  <li>150g Grilled Chicken Breast or Low-fat Paneer / Tofu</li>
  <li>1 Cup Steamed Brown Rice or 2 Multigrain Roti</li>
  <li>Fresh green salad (cucumber, tomatoes, lemon dressing)</li>
</ul>

<h4>MEAL 4: DINNER (8:00 PM)</h4>
<ul>
  <li>150g Grilled Fish / Chicken Breast / Yellow Dal (Lentils)</li>
  <li>1 Bowl stir-fried vegetables (Broccoli, bell peppers, zucchini)</li>
</ul>
<p><strong>Daily Hydration:</strong> Minimum 3.5 Litres of water throughout the day.</p>`;

    if (editorRef.current) {
      editorRef.current.innerHTML = template;
      handleInput();
    } else {
      setHtmlCode(template);
      onChange(template);
    }
  };

  return (
    <div className="border border-zinc-700 bg-zinc-900 rounded-lg overflow-hidden flex flex-col">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 p-2 bg-zinc-950 border-b border-zinc-800 text-xs">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            className="p-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded transition"
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            className="p-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded transition"
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h3>')}
            className="p-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded transition font-bold"
            title="Heading 3"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('formatBlock', '<h4>')}
            className="p-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded transition font-bold"
            title="Heading 4"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>
          <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            className="p-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded transition"
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            className="p-1.5 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded transition"
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-zinc-800 mx-1" />
          <button
            type="button"
            onClick={insertTemplate}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded text-[11px] font-semibold transition"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Load Template</span>
          </button>
        </div>

        {/* Mode Toggles */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${
              activeTab === 'visual'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <FileText className="w-3 h-3" />
            Visual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('code')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${
              activeTab === 'code'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code className="w-3 h-3" />
            HTML
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition ${
              activeTab === 'preview'
                ? 'bg-zinc-800 text-white font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="p-3 min-h-[220px] max-h-[420px] overflow-y-auto text-sm text-zinc-200">
        {activeTab === 'visual' && (
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onBlur={handleInput}
            className="focus:outline-none min-h-[200px] prose prose-invert prose-sm max-w-none [&_h3]:text-amber-400 [&_h3]:font-black [&_h3]:text-base [&_h3]:mb-2 [&_h4]:text-white [&_h4]:font-bold [&_h4]:text-sm [&_h4]:mt-3 [&_h4]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_li]:text-zinc-300"
            dangerouslySetInnerHTML={{ __html: value || '' }}
          />
        )}

        {activeTab === 'code' && (
          <textarea
            value={htmlCode}
            onChange={(e) => {
              setHtmlCode(e.target.value);
              onChange(e.target.value);
            }}
            rows={10}
            className="w-full h-full min-h-[200px] bg-transparent font-mono text-xs text-zinc-200 border-0 focus:outline-none resize-y"
            placeholder={placeholder}
          />
        )}

        {activeTab === 'preview' && (
          <div
            className="prose prose-invert prose-sm max-w-none [&_h3]:text-amber-400 [&_h3]:font-black [&_h3]:text-base [&_h3]:mb-2 [&_h4]:text-white [&_h4]:font-bold [&_h4]:text-sm [&_h4]:mt-3 [&_h4]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_li]:text-zinc-300 bg-zinc-950/60 p-4 rounded border border-zinc-800"
            dangerouslySetInnerHTML={{ __html: htmlCode || '<p class="text-zinc-500 italic">No content written yet.</p>' }}
          />
        )}
      </div>
    </div>
  );
};
