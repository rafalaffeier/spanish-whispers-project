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
        console.log('[TimesheetContext] Initializing data');
        
        // Verificar si hay un token válido en localStorage
        const token = localStorage.getItem('authToken');
        console.log('[TimesheetContext] LocalStorage authToken:', token);

        if (!token) {
          console.log('[TimesheetContext] No auth token found');
          setCurrentEmployee(null);
          setLoading(false);
          return;
        }

        // Intentar cargar el empleado actual desde localStorage
        const savedEmployee = localStorage.getItem('currentEmployee');
        console.log('[TimesheetContext] LocalStorage currentEmployee:', savedEmployee);

        if (savedEmployee) {
          try {
            const employee = JSON.parse(savedEmployee);
            // 🚩 VERIFICAR QUE userId (token) está presente
            console.log('[TimesheetContext] Found employee:', employee);

            setCurrentEmployee(employee);

            // Cargar datos de empleados solo si es empleador
            if (employee && employee.id) {
              await loadEmployeeData(employee.id);
            }
          } catch (e) {
            console.error('[TimesheetContext] Error parsing currentEmployee from localStorage:', e);
            localStorage.removeItem('currentEmployee');
            localStorage.removeItem('authToken');
            setCurrentEmployee(null);
          }
        } else {
          localStorage.removeItem('authToken');
          setCurrentEmployee(null);
        }
      } catch (error) {
        console.error('[TimesheetContext] Error initializing data:', error);
        toast({
          title: "Error de conexión",
          description: "No se pudieron cargar los datos. Por favor, inténtalo de nuevo.",
          variant: "destructive"
        });
        localStorage.removeItem('currentEmployee');
        localStorage.removeItem('authToken');
        setCurrentEmployee(null);
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    api.initializeAuth();
  }, []);

  // Función para actualizar el empleado actual
  const updateCurrentEmployee = (employee: Employee | null) => {
    console.log('[TimesheetContext] Updating current employee:', employee);
    if (employee) {
      // No modificar ni inventar employeeId aquí
      localStorage.setItem('currentEmployee', JSON.stringify(employee));
      setCurrentEmployee(employee);
      if (employee.id) {
        loadEmployeeData(employee.id);
      }
    } else {
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
      console.log('[TimesheetContext] Loading data for employee:', employeeId);
      setLoading(true);

      // Cargar timesheets del empleado usando el id correcto
      const employeeTimesheets = await api.getTimesheetsByEmployee(employeeId);
      console.log('[TimesheetContext] Loaded timesheets:', employeeTimesheets);
      setTimesheets(employeeTimesheets);

      if (currentEmployee?.role === 'empleador') {
        const allEmployees = await api.getEmployees();
        setEmployees(allEmployees);
      } else {
        if (currentEmployee) {
          setEmployees([currentEmployee]);
        }
      }
    } catch (error) {
      console.error("[TimesheetContext] Error loading employee data:", error);
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
