import { useState, useCallback } from 'react';
import axios, { AxiosError } from 'axios';
import { useAuthStore } from '../store/authStore';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, any>;
}

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  showError?: boolean;
}

export const useApi = (baseUrl = '/api') => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  const request = useCallback(
    async <T,>(
      method: 'get' | 'post' | 'put' | 'delete',
      endpoint: string,
      data?: any,
      options?: UseApiOptions
    ): Promise<T | null> => {
      setLoading(true);
      setError(null);

      try {
        const url = `${baseUrl}${endpoint}`;
        const config = {
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
            'Content-Type': 'application/json',
          },
        };

        let response;
        switch (method) {
          case 'get':
            response = await axios.get<ApiResponse<T>>(url, config);
            break;
          case 'post':
            response = await axios.post<ApiResponse<T>>(url, data, config);
            break;
          case 'put':
            response = await axios.put<ApiResponse<T>>(url, data, config);
            break;
          case 'delete':
            response = await axios.delete<ApiResponse<T>>(url, config);
            break;
        }

        if (!response.data.success) {
          const errorMessage = response.data.error || 'An error occurred';
          setError(errorMessage);
          options?.onError?.(errorMessage);
          return null;
        }

        options?.onSuccess?.(response.data.data);
        return response.data.data || null;
      } catch (err) {
        const axiosError = err as AxiosError<ApiResponse>;
        const errorMessage = axiosError.response?.data?.error || 'Network error';

        setError(errorMessage);
        if (options?.showError !== false) {
          options?.onError?.(errorMessage);
        }

        return null;
      } finally {
        setLoading(false);
      }
    },
    [token, baseUrl]
  );

  return {
    get: <T,>(endpoint: string, options?: UseApiOptions) =>
      request<T>('get', endpoint, undefined, options),
    post: <T,>(endpoint: string, data?: any, options?: UseApiOptions) =>
      request<T>('post', endpoint, data, options),
    put: <T,>(endpoint: string, data?: any, options?: UseApiOptions) =>
      request<T>('put', endpoint, data, options),
    delete: <T,>(endpoint: string, options?: UseApiOptions) =>
      request<T>('delete', endpoint, undefined, options),
    loading,
    error,
    clearError: () => setError(null),
  };
};

export const useQuery = <T,>(endpoint: string, enabled = true) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    const result = await api.get<T>(endpoint);
    if (result) {
      setData(result);
    }
  }, [endpoint, enabled, api]);

  React.useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

export const useMutation = <T, D = any>(
  method: 'post' | 'put' | 'delete',
  baseEndpoint: string
) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const api = useApi();

  const mutate = useCallback(
    async (data?: D, endpoint?: string) => {
      setLoading(true);
      setError(null);

      const finalEndpoint = endpoint || baseEndpoint;
      let result: T | null = null;

      switch (method) {
        case 'post':
          result = await api.post<T>(finalEndpoint, data);
          break;
        case 'put':
          result = await api.put<T>(finalEndpoint, data);
          break;
        case 'delete':
          result = await api.delete<T>(finalEndpoint);
          break;
      }

      setLoading(false);
      return result;
    },
    [api, method, baseEndpoint]
  );

  return { mutate, loading, error };
};

import React from 'react';
