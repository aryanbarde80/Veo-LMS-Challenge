import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, any>;
}

class ApiClient {
  private instance: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
    this.instance = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor for authentication
    this.instance.interceptors.request.use((config) => {
      const { token } = useAuthStore.getState();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        if (error.response?.status === 401) {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T = any>(endpoint: string, params?: Record<string, any>) {
    try {
      const response = await this.instance.get<ApiResponse<T>>(endpoint, {
        params,
      });
      return {
        success: response.data.success,
        data: response.data.data as T,
        status: response.status,
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async post<T = any>(endpoint: string, data?: any) {
    try {
      const response = await this.instance.post<ApiResponse<T>>(endpoint, data);
      return {
        success: response.data.success,
        data: response.data.data as T,
        status: response.status,
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async put<T = any>(endpoint: string, data?: any) {
    try {
      const response = await this.instance.put<ApiResponse<T>>(endpoint, data);
      return {
        success: response.data.success,
        data: response.data.data as T,
        status: response.status,
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async delete<T = any>(endpoint: string) {
    try {
      const response = await this.instance.delete<ApiResponse<T>>(endpoint);
      return {
        success: response.data.success,
        data: response.data.data as T,
        status: response.status,
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  async uploadFile<T = any>(endpoint: string, file: File, data?: Record<string, any>) {
    try {
      const formData = new FormData();
      formData.append('file', file);

      if (data) {
        Object.entries(data).forEach(([key, value]) => {
          formData.append(key, String(value));
        });
      }

      const response = await this.instance.post<ApiResponse<T>>(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return {
        success: response.data.success,
        data: response.data.data as T,
        status: response.status,
      };
    } catch (error) {
      return this.handleError<T>(error);
    }
  }

  private handleError<T>(error: any) {
    const axiosError = error as AxiosError<ApiResponse>;
    const errorMessage =
      axiosError.response?.data?.error ||
      axiosError.message ||
      'An error occurred';

    return {
      success: false,
      error: errorMessage,
      errors: axiosError.response?.data?.errors,
      status: axiosError.response?.status || 500,
      data: null as T,
    };
  }
}

export const apiClient = new ApiClient();

// Specific API service methods
export const authAPI = {
  signup: (data: any) => apiClient.post('/auth/signup', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  refreshToken: (refreshToken: string) =>
    apiClient.post('/auth/refresh', { refreshToken }),
};

export const courseAPI = {
  getAll: (params?: any) => apiClient.get('/courses', params),
  getById: (id: string) => apiClient.get(`/courses/${id}`),
  create: (data: any) => apiClient.post('/courses', data),
  update: (id: string, data: any) => apiClient.put(`/courses/${id}`, data),
  delete: (id: string) => apiClient.delete(`/courses/${id}`),
};

export const pdfAPI = {
  upload: (file: File, data: any) =>
    apiClient.uploadFile('/pdfs/upload', file, data),
  getByCourse: (courseId: string) =>
    apiClient.get(`/pdfs/course/${courseId}`),
  getById: (pdfId: string) => apiClient.get(`/pdfs/${pdfId}`),
  getAnalytics: (pdfId: string) =>
    apiClient.get(`/pdfs/${pdfId}/analytics`),
  trackView: (pdfId: string, data: any) =>
    apiClient.post(`/pdfs/${pdfId}/view`, data),
  delete: (pdfId: string) => apiClient.delete(`/pdfs/${pdfId}`),
};

export const enrollmentAPI = {
  getMyEnrollments: () => apiClient.get('/enrollments/my'),
  enroll: (courseId: string) =>
    apiClient.post('/enrollments', { courseId }),
  getProgress: (courseId: string) =>
    apiClient.get(`/enrollments/${courseId}/progress`),
};

export const adminAPI = {
  getDashboard: () => apiClient.get('/admin/dashboard'),
  getStats: () => apiClient.get('/admin/stats'),
  getSeed: () => apiClient.get('/admin/seed'),
};
