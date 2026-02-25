import { TimeoutError } from '../errors';

export const withTimeout = async <T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> => {
  let timeoutId: NodeJS.Timeout | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(
      () => reject(new TimeoutError(`Operation timed out after ${timeoutMs}ms`)),
      timeoutMs
    );
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const withTimeoutConfig = async <T>(
  promise: Promise<T>,
  config: { default?: number; short?: number; long?: number } = {}
): Promise<T> => {
  const defaultTimeout = config.default || 30000;
  return withTimeout(promise, defaultTimeout);
};
