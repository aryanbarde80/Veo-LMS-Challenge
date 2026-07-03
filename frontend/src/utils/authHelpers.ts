import { useAuthStore } from '../store/authStore';
import { STORAGE_KEYS, VALIDATION } from '../constants';

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    errors.push(
      `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters long`
    );
  }

  if (!VALIDATION.PASSWORD_REGEX.test(password)) {
    errors.push('Password must contain at least one uppercase letter and one number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export const validateEmail = (email: string): boolean => {
  return VALIDATION.EMAIL_REGEX.test(email);
};

export const validateName = (name: string): boolean => {
  return (
    name.length >= VALIDATION.NAME_MIN_LENGTH &&
    name.length <= VALIDATION.NAME_MAX_LENGTH
  );
};

export const validateSignupForm = (data: {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
}): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  if (!validateName(data.name)) {
    errors.name = `Name must be between ${VALIDATION.NAME_MIN_LENGTH} and ${VALIDATION.NAME_MAX_LENGTH} characters`;
  }

  if (!validateEmail(data.email)) {
    errors.email = 'Invalid email address';
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors.join('; ');
  }

  if (data.confirmPassword && data.password !== data.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateLoginForm = (data: {
  email: string;
  password: string;
}): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  if (!validateEmail(data.email)) {
    errors.email = 'Invalid email address';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
};

export const setAuthToken = (token: string) => {
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
};

export const setRefreshToken = (token: string) => {
  localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const clearAuthTokens = () => {
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.USER);
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    const decoded = JSON.parse(atob(parts[1]));
    const expiry = decoded.exp * 1000; // Convert to milliseconds
    return Date.now() >= expiry;
  } catch {
    return true;
  }
};

export const getTokenExpiry = (token: string): Date | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(atob(parts[1]));
    return new Date(decoded.exp * 1000);
  } catch {
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) return false;
  return !isTokenExpired(token);
};

export const canPerformAction = (
  requiredRole?: 'admin' | 'instructor' | 'student'
): boolean => {
  const { user } = useAuthStore.getState();

  if (!user) return false;
  if (!requiredRole) return true;

  // Role hierarchy: admin > instructor > student
  const roleHierarchy = {
    admin: 3,
    instructor: 2,
    student: 1,
  };

  const userRoleLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole];

  return userRoleLevel >= requiredLevel;
};

export const formatAuthError = (error: string): string => {
  const errorMap: Record<string, string> = {
    'Email already registered': 'This email is already in use. Please try another.',
    'Invalid credentials': 'Email or password is incorrect.',
    'User not found': 'No account found with this email.',
    'Unauthorized': 'You are not authorized to perform this action.',
    'Token expired': 'Your session has expired. Please log in again.',
    'Network error': 'Network error. Please check your connection.',
  };

  return errorMap[error] || error || 'An error occurred during authentication.';
};

export const shouldRefreshToken = (token: string): boolean => {
  const expiry = getTokenExpiry(token);
  if (!expiry) return false;

  const now = new Date();
  const minutesUntilExpiry = (expiry.getTime() - now.getTime()) / (1000 * 60);

  // Refresh if less than 5 minutes until expiry
  return minutesUntilExpiry < 5;
};
