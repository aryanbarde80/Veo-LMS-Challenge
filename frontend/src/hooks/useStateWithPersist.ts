import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for state management with localStorage persistence
 */
export function useStateWithPersist<T>(
  initialValue: T,
  key: string,
  options: {
    serialize?: (value: T) => string;
    deserialize?: (value: string) => T;
    onError?: (error: Error) => void;
  } = {}
) {
  const {
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onError,
  } = options;

  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? deserialize(item) : initialValue;
    } catch (error) {
      onError?.(error as Error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const newValue = value instanceof Function ? value(state) : value;
        setState(newValue);
        localStorage.setItem(key, serialize(newValue));
      } catch (error) {
        onError?.(error as Error);
      }
    },
    [key, serialize, state, onError]
  );

  const removeValue = useCallback(() => {
    try {
      setState(initialValue);
      localStorage.removeItem(key);
    } catch (error) {
      onError?.(error as Error);
    }
  }, [key, initialValue, onError]);

  return [state, setValue, removeValue] as const;
}

/**
 * Custom hook for managing form state
 */
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  onSubmit?: (values: T) => void | Promise<void>,
  onError?: (errors: Record<string, string>) => void
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value, type } = e.target;
      const newValue =
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

      setValues(prev => ({
        ...prev,
        [name]: newValue,
      }));

      if (touched[name]) {
        validateField(name, newValue);
      }
    },
    [touched]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name } = e.target;
      setTouched(prev => ({
        ...prev,
        [name]: true,
      }));
      validateField(name, values[name]);
    },
    [values]
  );

  const validateField = useCallback((name: string, value: any) => {
    // Basic validation - can be extended
    setErrors(prev => ({
      ...prev,
      [name]: value ? '' : `${name} is required`,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        await onSubmit?.(values);
      } catch (error) {
        onError?.(errors);
      } finally {
        setIsSubmitting(false);
      }
    },
    [values, onSubmit, onError, errors]
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    setValues,
    errors,
    touched,
    isSubmitting,
    handleChange,
    handleBlur,
    handleSubmit,
    resetForm,
  };
}

/**
 * Custom hook for async operations with loading state
 */
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);

    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error as E);
      setStatus('error');
      throw error;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
}

/**
 * Custom hook for debounced values
 */
export function useDebounce<T>(value: T, delay: number = 500) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Custom hook for previous value
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = React.useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

export default useStateWithPersist;
