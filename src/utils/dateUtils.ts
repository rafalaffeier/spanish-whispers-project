
/**
 * Utilidades para el manejo de fechas en la aplicación
 */

/**
 * Convierte un valor que puede ser string o Date a un objeto Date
 * @param value - Valor a convertir (string | Date)
 * @returns Objeto Date
 */
export const ensureDate = (value: string | Date | null): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
};

/**
 * Convierte un valor que puede ser string o Date a un formato de fecha específico
 * @param value - Valor a formatear (string | Date)
 * @param format - Formato deseado (por defecto: 'HH:MM')
 * @returns String formateado
 */
export const formatDateTime = (value: string | Date | null, format: 'HH:MM' | 'DD/MM/YYYY' | 'full' = 'HH:MM'): string => {
  const date = ensureDate(value);
  if (!date) return '';
  
  switch (format) {
    case 'HH:MM':
      return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    case 'DD/MM/YYYY':
      return date.toLocaleDateString('es-ES');
    case 'full':
      return date.toLocaleString('es-ES');
    default:
      return date.toString();
  }
};

/**
 * Verifica si un valor es una fecha válida
 * @param value - Valor a verificar
 * @returns true si es una fecha válida, false en caso contrario
 */
export const isValidDate = (value: any): boolean => {
  if (!value) return false;
  if (value instanceof Date) return !isNaN(value.getTime());
  
  const dateObj = new Date(value);
  return !isNaN(dateObj.getTime());
};

/**
 * Convierte un valor que puede ser string o Date a un objeto Date seguro para operaciones
 * Esta función es similar a ensureDate pero asegura que siempre devuelve una Date válida
 * @param value - Valor a convertir (string | Date)
 * @param defaultDate - Fecha por defecto si el valor es inválido (opcional)
 * @returns Objeto Date válido
 */
export const toSafeDate = (value: string | Date | null, defaultDate: Date = new Date()): Date => {
  if (!value) return defaultDate;
  if (value instanceof Date) return isNaN(value.getTime()) ? defaultDate : value;
  
  const dateObj = new Date(value);
  return isNaN(dateObj.getTime()) ? defaultDate : dateObj;
};
