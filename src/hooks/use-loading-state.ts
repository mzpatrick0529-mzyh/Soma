import { useState, useEffect } from "react";

interface UseLoadingStateOptions {
  initialLoading?: boolean;
  autoTimeout?: number;
}

export const useLoadingState = (options: UseLoadingStateOptions = {}) => {
  const { initialLoading = true, autoTimeout } = options;
  const [isLoading, setIsLoading] = useState(initialLoading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (autoTimeout && isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, autoTimeout);
      
      return () => clearTimeout(timer);
    }
  }, [isLoading, autoTimeout]);

  const startLoading = () => {
    setIsLoading(true);
    setError(null);
  };

  const stopLoading = () => {
    setIsLoading(false);
  };

  const setLoadingError = (errorMessage: string) => {
    setIsLoading(false);
    setError(errorMessage);
  };

  return {
    isLoading,
    error,
    startLoading,
    stopLoading,
    setLoadingError,
  };
};