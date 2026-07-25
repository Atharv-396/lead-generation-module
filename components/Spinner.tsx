interface SpinnerProps {
  className?: string;
  label?: string;
}

export default function Spinner({
  className = 'h-5 w-5',
  label = 'Loading...',
}: SpinnerProps) {
  return (
    <span
      role="status"
      aria-busy="true"
      aria-label={label}
      className="inline-flex items-center justify-center"
    >
      <span
        className={`block animate-spin rounded-full border-4 border-current border-t-transparent ${className}`}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
