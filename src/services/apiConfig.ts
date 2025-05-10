
// Configuración básica de la API

// Detectar si estamos en modo desarrollo (en Lovable) o en producción
const isDevelopment = window.location.hostname.includes('lovableproject.com');

// URL base de la API (actualizada para manejar correctamente las rutas en desarrollo y producción)
export const API_BASE_URL = isDevelopment 
  ? `${window.location.origin}/apphora/api` // URL relativa que funcione correctamente en desarrollo
  : 'https://aplium.com/apphora/api'; // URL absoluta con HTTPS para producción

// Imprimir información de depuración sobre la URL base de la API
console.log("[API CONFIG] Hostname:", window.location.hostname);
console.log("[API CONFIG] Es desarrollo:", isDevelopment);
console.log("[API CONFIG] API Base URL:", API_BASE_URL);
console.log("[API CONFIG] URL completa actual:", window.location.href);
console.log("[API CONFIG] Path:", window.location.pathname);
console.log("[API CONFIG] Origin:", window.location.origin);
console.log("[API CONFIG] Protocol:", window.location.protocol);

// Token de autenticación
let authToken: string | null = null;

// Función para inicializar el token desde localStorage
export const initializeAuth = () => {
  const storedToken = localStorage.getItem('authToken');
  if (storedToken) {
    authToken = storedToken;
    console.log("[API CONFIG] Token recuperado desde localStorage");
  } else {
    console.log("[API CONFIG] No se encontró token en localStorage");
  }
};

// Ejecutar al cargar
initializeAuth();

// Función para configurar el token de autenticación
export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem('authToken', token);
  console.log("[API CONFIG] Token actualizado y guardado en localStorage");
};

// Función para limpiar la autenticación
export const clearAuth = () => {
  authToken = null;
  localStorage.removeItem('authToken');
  localStorage.removeItem('currentEmployee');
  console.log("[API CONFIG] Autenticación limpiada");
};

// Getter para el token de autenticación
export const getAuthToken = () => authToken;
