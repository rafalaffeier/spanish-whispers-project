
// Servicio de API central - Re-exporta todos los servicios
import { initializeAuth, setAuthToken, clearAuth } from './apiConfig';
import { login, register, requestPasswordReset, confirmPasswordReset } from './authService';
import { getEmployees, getEmployee, updateEmployee } from './employeeService';
import { verifyCompanyByNif, getCompanies } from './companyService';
import { 
  getTimesheets, 
  getTimesheetsByEmployee, 
  getTodayTimesheet, 
  startTimesheet, 
  pauseTimesheet, 
  resumeTimesheet, 
  endTimesheet, 
  getTimesheet, 
  updateTimesheet 
} from './timesheetService';

// Inicializar autenticación al cargar
initializeAuth();

// Re-exportar todas las funciones
export {
  // Configuración y autenticación
  initializeAuth,
  setAuthToken,
  clearAuth,
  
  // Autenticación y registro
  login,
  register,
  requestPasswordReset,
  confirmPasswordReset,
  
  // Empleados
  getEmployees,
  getEmployee,
  updateEmployee,
  
  // Empresas
  verifyCompanyByNif,
  getCompanies,
  
  // Jornadas
  getTimesheets,
  getTimesheetsByEmployee,
  getTodayTimesheet,
  startTimesheet,
  pauseTimesheet,
  resumeTimesheet,
  endTimesheet,
  getTimesheet,
  updateTimesheet
};
