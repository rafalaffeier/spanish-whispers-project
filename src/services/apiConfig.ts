
// API configuration for environment management
const API_PRODUCTION_URL = 'https://aplium.com/apphora/api';
const API_DEVELOPMENT_URL = '/api'; // Simplificado para desarrollo

// Determinate if we're in development mode
export const isDevelopment = () => {
  return import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.includes('lovable');
};

// Get the base URL for API requests
export const API_BASE_URL = isDevelopment() ? API_DEVELOPMENT_URL : API_PRODUCTION_URL;

// Auth token management
export const setAuthToken = (token: string) => {
  localStorage.setItem('authToken', token);
  console.log('[API Config] Auth token set');
};

export const getAuthToken = (): string | null => {
  const token = localStorage.getItem('authToken');
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

// Alias para clearAuthData para mantener compatibilidad con api.ts
export const clearAuth = clearAuthData;

// Initialize auth - can be called at app startup
export const initializeAuth = () => {
  console.log('[API Config] Initializing auth');
  
  // Verificar si hay un token válido
  const token = getAuthToken();
  if (token) {
    console.log('[API Config] Found existing auth token');
    
    // Verificar si hay un usuario asociado con el token
    const employee = localStorage.getItem('currentEmployee');
    if (!employee) {
      console.log('[API Config] Token exists but no employee data, clearing auth');
      clearAuth();
    }
  } else {
    // Si no hay token, asegurarse de que no haya datos de empleado
    if (localStorage.getItem('currentEmployee')) {
      console.log('[API Config] Employee data without token, clearing employee data');
      localStorage.removeItem('currentEmployee');
    }
    console.log('[API Config] No existing auth token found');
  }
};
