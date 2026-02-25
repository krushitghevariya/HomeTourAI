import { withRetry, withTimeout, RetryConfig } from '../middleware';
import {
  ApiError,
  AuthenticationError,
  NetworkError,
  ValidationError,
  RateLimitError,
} from '../errors';
import type { RequestConfig } from '../types';

export class HttpClient {
  private baseUrl: string;
  private defaultTimeout: number = 30000;
  private defaultRetryConfig: Partial<RetryConfig> = {
    maxAttempts: 3,
    initialDelayMs: 100,
    backoffMultiplier: 2,
  };

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private getHeaders(config?: RequestConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (config?.headers) {
      Object.assign(headers, config.headers);
    }

    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      let errorData: any = {};

      if (isJson) {
        try {
          errorData = await response.json();
        } catch {
          errorData = { message: response.statusText };
        }
      } else {
        errorData = { message: response.statusText };
      }

      switch (response.status) {
        case 401:
          throw new AuthenticationError(
            errorData.message || 'Authentication failed',
            errorData
          );
        case 429:
          throw new RateLimitError(
            response.headers.get('retry-after')
              ? parseInt(response.headers.get('retry-after')!)
              : undefined
          );
        case 400:
          throw new ValidationError(
            errorData.message || 'Validation failed',
            errorData
          );
        default:
          throw new ApiError(
            errorData.code || 'API_ERROR',
            response.status,
            errorData.message || response.statusText,
            errorData
          );
      }
    }

    if (!isJson) {
      return (await response.text()) as T;
    }

    return response.json();
  }

  private buildUrl(endpoint: string, params?: Record<string, unknown>): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  async get<T = unknown>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<T> {
    const url = this.buildUrl(endpoint, config?.params);
    const headers = this.getHeaders(config);
    const timeout = config?.timeout || this.defaultTimeout;
    const retryConfig = config?.retries
      ? { ...this.defaultRetryConfig, maxAttempts: config.retries }
      : this.defaultRetryConfig;

    return withRetry(
      () =>
        withTimeout(
          fetch(url, {
            method: 'GET',
            headers,
            credentials: 'include',
          }),
          timeout
        ).then((response) => this.handleResponse<T>(response)),
      retryConfig
    );
  }

  async post<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.getHeaders(config);
    const timeout = config?.timeout || this.defaultTimeout;
    const retryConfig = config?.retries
      ? { ...this.defaultRetryConfig, maxAttempts: config.retries }
      : this.defaultRetryConfig;

    return withRetry(
      () =>
        withTimeout(
          fetch(url, {
            method: 'POST',
            headers,
            body: data ? JSON.stringify(data) : undefined,
            credentials: 'include',
          }),
          timeout
        ).then((response) => this.handleResponse<T>(response)),
      retryConfig
    );
  }

  async put<T = unknown>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.getHeaders(config);
    const timeout = config?.timeout || this.defaultTimeout;
    const retryConfig = config?.retries
      ? { ...this.defaultRetryConfig, maxAttempts: config.retries }
      : this.defaultRetryConfig;

    return withRetry(
      () =>
        withTimeout(
          fetch(url, {
            method: 'PUT',
            headers,
            body: data ? JSON.stringify(data) : undefined,
            credentials: 'include',
          }),
          timeout
        ).then((response) => this.handleResponse<T>(response)),
      retryConfig
    );
  }

  async delete<T = unknown>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const headers = this.getHeaders(config);
    const timeout = config?.timeout || this.defaultTimeout;
    const retryConfig = config?.retries
      ? { ...this.defaultRetryConfig, maxAttempts: config.retries }
      : this.defaultRetryConfig;

    return withRetry(
      () =>
        withTimeout(
          fetch(url, {
            method: 'DELETE',
            headers,
            credentials: 'include',
          }),
          timeout
        ).then((response) => this.handleResponse<T>(response)),
      retryConfig
    );
  }

  async uploadFile<T = unknown>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, unknown>,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        if (value !== undefined) {
          formData.append(key, String(value));
        }
      });
    }

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            resolve(JSON.parse(xhr.responseText));
          } catch {
            resolve(xhr.responseText as T);
          }
        } else {
          try {
            const error = JSON.parse(xhr.responseText);
            reject(
              new ApiError(
                error.code || 'UPLOAD_ERROR',
                xhr.status,
                error.message || 'Upload failed',
                error
              )
            );
          } catch {
            reject(
              new NetworkError(
                `Upload failed with status ${xhr.status}`,
                { status: xhr.status }
              )
            );
          }
        }
      });

      xhr.addEventListener('error', () => {
        reject(new NetworkError('Network error during upload'));
      });

      xhr.addEventListener('abort', () => {
        reject(new ApiError('UPLOAD_CANCELLED', 0, 'Upload cancelled'));
      });

      xhr.open('POST', url);
      xhr.withCredentials = true;
      xhr.send(formData);
    });
  }
}
