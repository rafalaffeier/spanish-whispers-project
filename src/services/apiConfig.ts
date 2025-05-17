
  
// API configuration for environment management
const API_PRODUCTION_URL = 'https://aplium.com/apphora/api';
// const API_DEVELOPMENT_URL = '/api'; // Simplificado para desarrollo

// --- Cambiar aquí: siempre usar producción ---
export const API_BASE_URL = API_PRODUCTION_URL;
// ---

// El resto del archivo sigue igual:
export const isDevelopment = () => {
  return import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('lovable');
};

// Auth token management
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
  console.log('[API Config] Auth token set:', token.substring(0, 5) + '...');
};

export const getAuthToken = (): string | null => {
  const token = localStorage.getItem('authToken');
  if (token) {
    console.log('[API Config] Retrieved auth token:', token.substring(0, 5) + '...');
  } else {
    console.log('[API Config] No auth token found in localStorage');
  }
  return token;
};

export const removeAuthToken = () => {
  localStorage.removeItem('authToken');
  console.log('[API Config] Auth token removed');
};

export const clearAuthData = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentEmployee');
  console.log('[API Config] All auth data cleared');
};

export const clearAuth = clearAuthData;

export const initializeAuth = () => {
  console.log('[API Config] Initializing auth');
  
  const token = getAuthToken();
  if (token) {
    console.log('[API Config] Found existing auth token');
    const employee = localStorage.getItem('currentEmployee');
    if (!employee) {
      console.log('[API Config] Token exists but no employee data, clearing auth');
      clearAuth();
    } else {
      try {
        const employeeData = JSON.parse(employee);
        console.log('[API Config] Found employee data:', employeeData);
        if (!employeeData.id || !employeeData.name || !employeeData.role) {
          console.log('[API Config] Invalid employee data format, clearing auth');
          clearAuth();
        }
      } catch (e) {
        console.error('[API Config] Error parsing employee data, clearing auth');
        clearAuth();
      }
    }
  } else {
    if (localStorage.getItem('currentEmployee')) {
      console.log('[API Config] Employee data without token, clearing employee data');
      localStorage.removeItem('currentEmployee');
    }
    console.log('[API Config] No existing auth token found');
  }
};

