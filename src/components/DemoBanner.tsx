import { useDemoMode } from '../hooks/useDemoMode';

export default function DemoBanner() {
  const { isDemo, toggleDemo } = useDemoMode();
  if (!isDemo) return null;

  return (
    <div className="demo-banner">
      <span>Demo Mode — Showing fake data</span>
      <button
        onClick={toggleDemo}
        className="ml-2 px-2 py-0.5 rounded bg-[var(--color-gold)] text-white text-xs font-semibold"
      >
        Exit Demo
      </button>
    </div>
  );
}
