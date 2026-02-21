interface FilterChipsProps {
  options: string[];
  selected: string;
  onChange: (value: string) => void;
}

export default function FilterChips({ options, selected, onChange }: FilterChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {options.map(opt => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`
            flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all
            ${selected === opt
              ? 'bg-[var(--color-navy)] text-white'
              : 'bg-white border border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-navy)]'
            }
          `}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
