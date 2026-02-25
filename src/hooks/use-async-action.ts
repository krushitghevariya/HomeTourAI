import { useState, useCallback, useRef, useEffect } from 'react';
import { ApiError, getUserFriendlyMessage } from '../api/errors';

export interface AsyncActionState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | Error | null;
  errorMessage: string;
}

export interface AsyncActionOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  showErrorMessage?: boolean;
}

export const useAsyncAction = <T,>(
  options: AsyncActionOptions = {}
) => {
  const [state, setState] = useState<AsyncActionState<T>>({
    data: null,
    loading: false,
    error: null,
    errorMessage: '',
  });

  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (action: () => Promise<T>): Promise<T | null> => {
      setState({
        data: null,
        loading: true,
        error: null,
        errorMessage: '',
      });

      try {
        const result = await action();

        if (isMountedRef.current) {
          setState({
            data: result,
            loading: false,
            error: null,
            errorMessage: '',
          });
        }

        options.onSuccess?.();
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        const errorMessage =
          options.showErrorMessage !== false
            ? getUserFriendlyMessage(err)
            : '';

        if (isMountedRef.current) {
          setState({
            data: null,
            loading: false,
            error: err,
            errorMessage,
          });
        }

        options.onError?.(err);
        return null;
      }
    },
    [options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      errorMessage: '',
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};
