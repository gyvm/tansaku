interface ErrorBannerProps {
  message: string | null;
}

export function ErrorBanner({ message }: ErrorBannerProps) {
  if (!message) return null;

  return (
    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3">
      <div className="flex items-start gap-2">
        <span className="text-base flex-shrink-0" aria-hidden="true">⚠️</span>
        <p className="text-xs text-red-600 flex-1">{message}</p>
      </div>
    </div>
  );
}
