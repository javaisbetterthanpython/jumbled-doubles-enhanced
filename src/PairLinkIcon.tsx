import clsx from "clsx";

export function PairLinkIcon({
  partnerName,
  className,
}: {
  partnerName?: string;
  className?: string;
}) {
  const icon = (
    <svg
      className="h-3.5 w-3.5 shrink-0"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );

  if (!partnerName) {
    return <span className={clsx("inline-flex items-center", className)}>{icon}</span>;
  }

  return (
    <span
      className={clsx("inline-flex items-center", className)}
      aria-label={`Fixed pair with ${partnerName}`}
      title={`Fixed pair with ${partnerName}`}
    >
      {icon}
    </span>
  );
}
