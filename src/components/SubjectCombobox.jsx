import React, { useState, useEffect } from 'react';
import { Plus, List } from 'lucide-react';

// Lets the user either pick from the list of subjects that already have data, or type a
// brand-new subject name. A plain <input list> + <datalist> combo is unreliable across
// browsers for discoverability (no visible dropdown affordance), so this explicitly
// switches between a <select> of existing subjects and a free-text input.
export default function SubjectCombobox({
  value,
  onChange,
  subjects = [],
  placeholder = 'Type a new subject name',
  accentClassName = 'focus:border-indigo-500',
  textClassName = '',
}) {
  const [isAddingNew, setIsAddingNew] = useState(subjects.length === 0);

  useEffect(() => {
    if (subjects.length === 0) setIsAddingNew(true);
  }, [subjects.length]);

  const baseInputClasses = `w-full bg-gray-900/50 border border-gray-600 rounded-xl py-3 px-4 text-white placeholder-gray-500 focus:outline-none ${accentClassName} transition-colors shadow-inner ${textClassName}`;

  if (isAddingNew) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseInputClasses}
        />
        {subjects.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setIsAddingNew(false);
              onChange('');
            }}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white px-3 py-3 rounded-xl bg-gray-900/50 border border-gray-600 hover:border-gray-500 transition-colors whitespace-nowrap"
          >
            <List className="w-3.5 h-3.5" /> Existing
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={baseInputClasses + ' cursor-pointer'}
      >
        <option value="">-- Select a subject --</option>
        {subjects.map((s) => (
          <option key={s} value={s}>{s}</option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => {
          setIsAddingNew(true);
          onChange('');
        }}
        className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 px-3 py-3 rounded-xl bg-gray-900/50 border border-gray-600 hover:border-indigo-500/60 transition-colors whitespace-nowrap"
      >
        <Plus className="w-3.5 h-3.5" /> New
      </button>
    </div>
  );
}
