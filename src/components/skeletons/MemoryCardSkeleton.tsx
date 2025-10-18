import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export const MemoryCardSkeleton = () => {
  return (
    <Card className="overflow-hidden hover-lift border-border/50">
      <div className="p-4">
        {/* Header with avatar and user info */}
        <div className="flex items-center gap-3 mb-3">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        
        {/* Content text */}
        <div className="space-y-2 mb-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        
        {/* Image placeholder */}
        <Skeleton variant="card" className="mb-3" />
        
        {/* Actions bar */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-6" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-6" />
          </div>
          <div className="ml-auto">
            <Skeleton className="h-5 w-5" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export const MemoryCardListSkeleton = ({ count = 3 }: { count?: number }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <MemoryCardSkeleton key={index} />
      ))}
    </div>
  );
};