'use client'

import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig } from 'axios'
import { env } from '@/lib/env'
import { toBackendLocale } from '@/lib/i18n'
import { useAppStore } from '@/stores/app-store'
import { useAuthStore } from '@/stores/authStore'
import type { ApiEnvelope } from '@/types'

interface ApiError extends Error {
  status?: number
  code?: string
  details?: unknown
}

class APIClient {
  private client: AxiosInstance
  private isRefreshing = false
  private queue: Array<() => void> = []

  constructor() {
    this.client = axios.create({
      baseURL: `${env.NEXT_PUBLIC_API_URL}/v1`,
      timeout: 30_000,
      withCredentials: true,
    })
    this.setupInterceptors()
  }

  private setupInterceptors() {
    this.client.interceptors.request.use((config) => {
      const token = useAuthStore.getState().accessToken
      const language = useAppStore.getState().language

      config.headers = config.headers || {}
      config.headers['Accept-Language'] = toBackendLocale(language)
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      return config
    })

    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiEnvelope<{ accessToken: string | null }>>) => {
        const originalRequest = error.config as AxiosRequestConfig & {
          _retry?: boolean
        }

        if (error.response?.status === 401 && !originalRequest?._retry) {
          if (this.isRefreshing) {
            return new Promise((resolve) => {
              this.queue.push(() => resolve(this.client(originalRequest)))
            })
          }

          originalRequest._retry = true
          this.isRefreshing = true

          try {
            const nextToken = await this.refreshToken()
            if (!nextToken) {
              throw new Error('Missing access token')
            }
            this.queue.forEach((resume) => resume())
            this.queue = []
            return this.client(originalRequest)
          } catch (refreshError) {
            useAuthStore.getState().clearSession()
            if (typeof window !== 'undefined') {
              const returnTo = encodeURIComponent(window.location.pathname)
              window.location.href = `/login?returnTo=${returnTo}`
            }
            return Promise.reject(this.normalizeError(refreshError))
          } finally {
            this.isRefreshing = false
          }
        }

        return Promise.reject(this.normalizeError(error))
      },
    )
  }

  private async refreshToken() {
    const response = await this.client.post<ApiEnvelope<{ accessToken: string | null }>>(
      '/auth/refresh',
    )

    const accessToken = response.data.data.accessToken
    if (accessToken) {
      const user = useAuthStore.getState().user
      if (user) {
        useAuthStore.getState().setSession({ accessToken, user })
      }
    }
    return accessToken
  }

  private normalizeError(error: unknown): ApiError {
    if (axios.isAxiosError(error)) {
      const apiError = new Error(
        error.response?.data?.message ||
          (error.response?.data as { data?: { message?: string } })?.data
            ?.message ||
          error.message ||
          'Request failed',
      ) as ApiError
      apiError.status = error.response?.status
      apiError.code =
        (error.response?.data as { data?: { code?: string } })?.data?.code ||
        (error.response?.data as { code?: string })?.code
      apiError.details = error.response?.data
      return apiError
    }

    if (error instanceof Error) {
      return error as ApiError
    }

    return new Error('Unknown API error') as ApiError
  }

  async get<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.get<ApiEnvelope<T>>(url, config)
    return response.data.data
  }

  async post<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) {
    const response = await this.client.post<ApiEnvelope<T>>(url, body, config)
    return response.data.data
  }

  async patch<T, B = unknown>(url: string, body?: B, config?: AxiosRequestConfig) {
    const response = await this.client.patch<ApiEnvelope<T>>(url, body, config)
    return response.data.data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig) {
    const response = await this.client.delete<ApiEnvelope<T>>(url, config)
    return response.data.data
  }
}

export const apiClient = new APIClient()
