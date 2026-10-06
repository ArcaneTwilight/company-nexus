interface ToastBannerProps {
  message: string;
}

export function ToastBanner({ message }: ToastBannerProps) {
  return (
    <div className="rounded-xl border border-emerald-600/25 dark:border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-800 dark:text-emerald-200">
      {message}
    </div>
  );
}
