export default function LoadingSpinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  return (
    <div className={`${sizeClass} border-2 border-[var(--color-border)] border-t-[var(--color-gold)] rounded-full animate-spin`} />
  );
}
