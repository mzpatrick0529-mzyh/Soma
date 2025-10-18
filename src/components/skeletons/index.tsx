import { Skeleton } from "@/components/ui/skeleton";

export const ChatListSkeleton = () => {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="flex items-center gap-3 p-3 rounded-lg">
          <Skeleton variant="avatar" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 w-3/4" />
          </div>
          {Math.random() > 0.5 && (
            <Skeleton className="h-5 w-5 rounded-full" />
          )}
        </div>
      ))}
    </div>
  );
};

export const MarketplaceCardSkeleton = () => {
  return (
    <div className="glass-effect rounded-2xl p-4 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-6 w-12" />
      </div>
      
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-4/5" />
      
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-12" />
        </div>
        <Skeleton variant="button" />
      </div>
    </div>
  );
};

export const MarketplaceGridSkeleton = ({ count = 6 }: { count?: number }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <MarketplaceCardSkeleton key={index} />
      ))}
    </div>
  );
};