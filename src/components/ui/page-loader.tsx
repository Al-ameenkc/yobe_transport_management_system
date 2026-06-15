import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

interface PageLoaderProps {
  message?: string;
  className?: string;
  fullScreen?: boolean;
}

export function PageLoader({
  message = "Loading...",
  className,
  fullScreen = false,
}: PageLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-slate-600",
        fullScreen ? "min-h-[60vh]" : "py-16",
        className
      )}
    >
      <Spinner size="lg" />
      <p className="animate-pulse text-sm font-medium">{message}</p>
    </div>
  );
}
