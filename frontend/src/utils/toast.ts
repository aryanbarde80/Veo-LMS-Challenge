import toast from 'react-hot-toast';

export const showSuccess = (message: string, duration = 4000) => {
  toast.success(message, {
    duration,
    style: {
      background: '#1A1A2E',
      color: '#fff',
      border: '1px solid #00FF88',
      borderRadius: '12px',
    },
    iconTheme: {
      primary: '#00FF88',
      secondary: '#1A1A2E',
    },
  });
};

export const showError = (message: string, duration = 5000) => {
  toast.error(message, {
    duration,
    style: {
      background: '#1A1A2E',
      color: '#fff',
      border: '1px solid #FF6B35',
      borderRadius: '12px',
    },
    iconTheme: {
      primary: '#FF6B35',
      secondary: '#1A1A2E',
    },
  });
};

export const showInfo = (message: string, duration = 4000) => {
  toast(message, {
    duration,
    style: {
      background: '#1A1A2E',
      color: '#fff',
      border: '1px solid #00D4FF',
      borderRadius: '12px',
    },
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message, {
    style: {
      background: '#1A1A2E',
      color: '#fff',
      border: '1px solid #6C47FF',
      borderRadius: '12px',
    },
  });
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

export const updateToast = (
  toastId: string,
  options: {
    message?: string;
    type?: 'success' | 'error' | 'loading';
  }
) => {
  const { message, type } = options;

  if (type === 'success') {
    toast.success(message || 'Success!', {
      id: toastId,
      duration: 4000,
    });
  } else if (type === 'error') {
    toast.error(message || 'Error!', {
      id: toastId,
      duration: 5000,
    });
  }
};
