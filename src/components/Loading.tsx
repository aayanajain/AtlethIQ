// src/components/Loading.tsx
//
// Consistent loading spinner/indicator used across the app.
// Provides visual feedback during async operations.

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  text?: string;
  fullScreen?: boolean;
}

export function Loading({ size = "md", text, fullScreen = false }: LoadingProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-teal-500 border-t-transparent`}
      />
      {text && <p className="text-sm text-white/50">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050505]">
        {spinner}
      </div>
    );
  }

  return spinner;
}

// Skeleton loader for content placeholders
export function SkeletonLoader({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/[0.04] ${className}`}
    />
  );
}

// Loading overlay for modal/partial page loads
export function LoadingOverlay({ text }: { text?: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Loading size="lg" text={text} />
    </div>
  );
}
