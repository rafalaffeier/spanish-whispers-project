
import React, { createContext, useContext, useState, useEffect } from 'react';
import { TimesheetEntry, Employee } from '@/types/timesheet';
import * as api from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface TimesheetContextType {
  employees: Employee[];
  timesheets: TimesheetEntry[];
  currentEmployee: Employee | null;
  setCurrentEmployee: (employee: Employee | null) => void;
  updateTimesheet: (timesheet: TimesheetEntry) => void;
  getCurrentTimesheet: () => TimesheetEntry | undefined;
  loading: boolean;
  refreshData: () => Promise<void>;
}

const TimesheetContext = createContext<TimesheetContextType | undefined>(undefined);

export const TimesheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Cargar datos al iniciar
  useEffect(() => {
    const initializeData = async () => {
      try {
        setLoading(true);
        
        // Verificar si hay un token válido en localStorage
        const token = localStorage.getItem('authToken');
        if (!token) {
          // Sin token, no hay empleado autenticado
          setCurrentEmployee(null);
          setLoading(false);
          return;
        }
        
        // Intentar cargar el empleado actual desde localStorage
        const savedEmployee = localStorage.getItem('currentEmployee');
        if (savedEmployee) {
          try {
            const employee = JSON.parse(savedEmployee);
            setCurrentEmployee(employee);
            
            // Si tenemos un empleado, cargar sus datos
            if (employee && employee.id) {
              await loadEmployeeData(employee.id);
            }
          } catch (e) {
            console.error('Error parsing currentEmployee from localStorage:', e);
            // Si hay un error al parsear, limpiar todo
            localStorage.removeItem('currentEmployee');
            localStorage.removeItem('authToken');
            setCurrentEmployee(null);
          }
        } else {
          // Si hay token pero no hay empleado, limpiar el token
          localStorage.removeItem('authToken');
          setCurrentEmployee(null);
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        toast({
          title: "Error de conexión",
          description: "No se pudieron cargar los datos. Por favor, inténtalo de nuevo.",
          variant: "destructive"
        });
        // En caso de error, mejor limpiar el estado de autenticación
        localStorage.removeItem('currentEmployee');
        localStorage.removeItem('authToken');
        setCurrentEmployee(null);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    // Initialize auth token from localStorage
    api.initializeAuth();
  }, []);

  // Función para actualizar el empleado actual
  const updateCurrentEmployee = (employee: Employee | null) => {
    if (employee) {
      localStorage.setItem('currentEmployee', JSON.stringify(employee));
      setCurrentEmployee(employee);
      // Cuando cambia el empleado, cargar sus datos
      if (employee.id) {
        loadEmployeeData(employee.id);
      }
    } else {
      // Si se está cerrando sesión, limpiar todo
      localStorage.removeItem('currentEmployee');
      localStorage.removeItem('authToken');
      setCurrentEmployee(null);
      setTimesheets([]);
      setEmployees([]);
    }
  };

  // Función para cargar datos del empleado
  const loadEmployeeData = async (employeeId: string) => {
    try {
      setLoading(true);
      
      // Cargar timesheets del empleado
      const employeeTimesheets = await api.getTimesheetsByEmployee(employeeId);
      setTimesheets(employeeTimesheets);
      
      // También podríamos cargar otros empleados si el usuario actual es empleador
      if (currentEmployee?.role === 'empleador') {
        const allEmployees = await api.getEmployees();
        setEmployees(allEmployees);
      } else {
        // Si no es empleador, solo mostrar el empleado actual
        if (currentEmployee) {
          setEmployees([currentEmployee]);
        }
      }
    } catch (error) {
      console.error("Error loading employee data:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTimesheet = async (timesheet: TimesheetEntry) => {
    try {
      // Actualizar en el backend
      if (timesheet.id) {
        await api.updateTimesheet(timesheet.id, timesheet);
      }
      
      // Actualizar en el estado local
      setTimesheets(prevTimesheets => {
        const index = prevTimesheets.findIndex(t => t.id === timesheet.id);
        if (index >= 0) {
          const updated = [...prevTimesheets];
          updated[index] = timesheet;
          return updated;
        } else {
          return [...prevTimesheets, timesheet];
        }
      });
    } catch (error) {
      console.error("Error updating timesheet:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el registro de jornada.",
        variant: "destructive"
      });
    }
  };

  const getCurrentTimesheet = () => {
    if (!currentEmployee) return undefined;
    
    const today = new Date().toISOString().split('T')[0];
    return timesheets.find(t => 
      t.employeeId === currentEmployee.id && 
      t.date === today
    );
  };

  const refreshData = async () => {
    if (currentEmployee?.id) {
      await loadEmployeeData(currentEmployee.id);
    }
  };

  const value = {
    employees,
    timesheets,
    currentEmployee,
    setCurrentEmployee: updateCurrentEmployee,
    updateTimesheet,
    getCurrentTimesheet,
    loading,
    refreshData
  };

  return (
    <TimesheetContext.Provider value={value}>
      {children}
    </TimesheetContext.Provider>
  );
};

export const useTimesheet = () => {
  const context = useContext(TimesheetContext);
  if (context === undefined) {
    throw new Error('useTimesheet must be used within a TimesheetProvider');
  }
  return context;
};
