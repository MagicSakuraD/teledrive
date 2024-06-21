import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  // Or a custom loading skeleton component
  return (
    <div className="flex items-center space-x-4 min-h-screen w-full flex-col">
      <Skeleton className="w-4/5 rounded-lg h-4/5" />

      <Skeleton className="h-4 w-4/5 " />
    </div>
  );
}
