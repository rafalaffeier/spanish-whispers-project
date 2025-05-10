
// Configuración básica de la API

// Detectar si estamos en modo desarrollo (en Lovable) o en producción
const isDevelopment = window.location.hostname.includes('lovableproject.com');

// URL base de la API (actualizada para usar HTTPS y manejar entorno de desarrollo)
export const API_BASE_URL = isDevelopment 
  ? '/apphora/api' // URL relativa para desarrollo (evita problemas CORS)
  : 'https://aplium.com/apphora/api'; // URL absoluta con HTTPS para producción

// Token de autenticación
let authToken: string | null = null;

// Función para inicializar el token desde localStorage
export const initializeAuth = () => {
  const storedToken = localStorage.getItem('authToken');
  if (storedToken) {
    authToken = storedToken;
  }
};

// Ejecutar al cargar
initializeAuth();

// Función para configurar el token de autenticación
export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('authToken', token);
};

// Función para limpiar la autenticación
export const clearAuth = () => {
  authToken = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentEmployee');
};

// Getter para el token de autenticación
export const getAuthToken = () => authToken;
