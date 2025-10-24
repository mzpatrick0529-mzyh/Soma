import { useEffect, useRef, useState, useCallback } from "react";

interface UseInfiniteScrollOptions<T> {
  initialData?: T[];
  loadMore: (page: number) => Promise<T[]>;
  pageSize?: number;
  threshold?: number;
  enabled?: boolean;
}

export const useInfiniteScroll = <T>({
  initialData = [],
  loadMore,
  pageSize = 10,
  threshold = 100,
  enabled = true,
}: UseInfiniteScrollOptions<T>) => {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const observerRef = useRef<IntersectionObserver>();
  const loadingRef = useRef<HTMLDivElement>(null);

  const loadNextPage = useCallback(async () => {
    if (!enabled || loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await loadMore(page);
      
      if (newData.length === 0) {
        setHasMore(false);
      } else {
        setData(prev => [...prev, ...newData]);
        setPage(prev => prev + 1);
        
        // If returned data is less than page size, indicates last page
        if (newData.length < pageSize) {
          setHasMore(false);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [enabled, loading, hasMore, loadMore, page, pageSize]);

  const reset = useCallback(() => {
    setData(initialData);
    setPage(1);
    setHasMore(true);
    setError(null);
    setLoading(false);
  }, [initialData]);

  const refresh = useCallback(async () => {
    setData([]);
    setPage(1);
    setHasMore(true);
    setError(null);
    
    if (enabled) {
      await loadNextPage();
    }
  }, [enabled, loadNextPage]);

  // Intersection Observer setup
  useEffect(() => {
    if (!enabled || !loadingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && !loading) {
          loadNextPage();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1,
      }
    );

    observerRef.current = observer;
    observer.observe(loadingRef.current);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enabled, hasMore, loading, loadNextPage, threshold]);

  // Initial loading
  useEffect(() => {
    if (enabled && data.length === 0 && hasMore) {
      loadNextPage();
    }
  }, [enabled, data.length, hasMore, loadNextPage]);

  return {
    data,
    loading,
    hasMore,
    error,
    loadingRef,
    loadNextPage,
    reset,
    refresh,
  };
};