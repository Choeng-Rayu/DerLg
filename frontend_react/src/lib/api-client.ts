import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';

class APIClient {
  private client = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    timeout: 30000,
    withCredentials: true,
  });

  private isRefreshing = false;
  private refreshSubscribers: Array<() => void> = [];

  constructor() {
    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        config.headers['Accept-Language'] = localStorage.getItem('i18nextLng') || 'en';
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.refreshSubscribers.push(() => {
                resolve(this.client(originalRequest));
              });
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            await this.client.post('/auth/refresh');
            this.isRefreshing = false;
            this.refreshSubscribers.forEach((cb) => cb());
            this.refreshSubscribers = [];
            return this.client(originalRequest);
          } catch {
            this.isRefreshing = false;
            this.refreshSubscribers = [];
            window.location.href = '/login';
            return Promise.reject(error);
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      const data = error.response.data as { message?: string } | undefined;
      return new Error(data?.message || 'An error occurred');
    } else if (error.request) {
      return new Error('Network error. Please check your connection.');
    }
    return new Error(error.message);
  }

  get<T>(url: string, config?: object) {
    return this.client.get<T>(url, config);
  }
  post<T>(url: string, data?: unknown, config?: object) {
    return this.client.post<T>(url, data, config);
  }
  put<T>(url: string, data?: unknown, config?: object) {
    return this.client.put<T>(url, data, config);
  }
  patch<T>(url: string, data?: unknown, config?: object) {
    return this.client.patch<T>(url, data, config);
  }
  delete<T>(url: string, config?: object) {
    return this.client.delete<T>(url, config);
  }
}

export const api = new APIClient();
