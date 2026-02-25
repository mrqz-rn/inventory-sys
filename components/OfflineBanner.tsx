// src/components/OfflineBanner.tsx
// Shows a persistent banner when offline, and a sync status indicator

import React from 'react';

interface OfflineBannerProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, isSyncing, pendingCount }) => {
  if (isOnline && !isSyncing && pendingCount === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`
        fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2
        px-4 py-2 text-sm font-semibold text-white transition-all duration-300
        ${!isOnline ? 'bg-rose-600' : isSyncing ? 'bg-amber-500' : 'bg-emerald-600'}
      `}
    >
      {!isOnline && (
        <>
          <span className="inline-block h-2 w-2 rounded-full bg-white opacity-80 animate-pulse" />
          You're offline — changes are saved locally and will sync when reconnected.
          {pendingCount > 0 && (
            <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
              {pendingCount} pending
            </span>
          )}
        </>
      )}

      {isOnline && isSyncing && (
        <>
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          Syncing {pendingCount} offline change{pendingCount !== 1 ? 's' : ''}…
        </>
      )}

      {isOnline && !isSyncing && pendingCount === 0 && (
        <>
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Back online — all changes synced!
        </>
      )}
    </div>
  );
};

export default OfflineBanner;