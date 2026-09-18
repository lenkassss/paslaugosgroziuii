/** Official PaslaugosGrožiui brand mark — glossy lips. */
export function LipsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" className={className} fill="none" aria-hidden="true">
      {/* upper lip with cupid's bow */}
      <path
        d="M2 10.2c3.2-4.6 6.4-6.9 9.1-6.9 2.1 0 3.6 1.1 4.9 2.6 1.3-1.5 2.8-2.6 4.9-2.6 2.7 0 5.9 2.3 9.1 6.9-4.3 1.1-9.1 1.7-14 1.7S6.3 11.3 2 10.2Z"
        fill="currentColor"
      />
      {/* lower lip */}
      <path
        d="M2 10.2c4.3 1.1 9.1 1.7 14 1.7s9.7-.6 14-1.7c-1.4 6.6-7.2 11.3-14 11.3S3.4 16.8 2 10.2Z"
        fill="currentColor"
        opacity="0.82"
      />
      {/* soft gloss highlight */}
      <path d="M11 15.6c3.3.9 6.7.9 10 0-1.6 1.7-3.3 2.5-5 2.5s-3.4-.8-5-2.5Z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}
