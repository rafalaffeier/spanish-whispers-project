
import React, { createContext, useContext, useState, useEffect } from 'react';
import { TimesheetEntry, Employee } from '@/types/timesheet';

// Datos de ejemplo
const demoEmployees: Employee[] = [
  { id: '1', name: 'Juan Pérez', role: 'Técnico' },
  { id: '2', name: 'María García', role: 'Administrativo' },
  { id: '3', name: 'Carlos Rodríguez', role: 'Supervisor' },
];

const demoTimesheets: TimesheetEntry[] = [];

interface TimesheetContextType {
  employees: Employee[];
  timesheets: TimesheetEntry[];
  currentEmployee: Employee | null;
  setCurrentEmployee: (employee: Employee | null) => void;
  updateTimesheet: (timesheet: TimesheetEntry) => void;
  getCurrentTimesheet: () => TimesheetEntry | undefined;
}

const TimesheetContext = createContext<TimesheetContextType | undefined>(undefined);

export const TimesheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [employees] = useState<Employee[]>(demoEmployees);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>(demoTimesheets);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);

  // Cargar datos del localStorage al iniciar
  useEffect(() => {
    const savedTimesheets = localStorage.getItem('timesheets');
    if (savedTimesheets) {
      try {
        setTimesheets(JSON.parse(savedTimesheets));
      } catch (e) {
        console.error('Error loading timesheets from localStorage:', e);
      }
    }
    
    const savedEmployee = localStorage.getItem('currentEmployee');
    if (savedEmployee) {
      try {
        setCurrentEmployee(JSON.parse(savedEmployee));
      } catch (e) {
        console.error('Error loading current employee from localStorage:', e);
      }
    }
  }, []);

  // Guardar datos en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem('timesheets', JSON.stringify(timesheets));
  }, [timesheets]);

  useEffect(() => {
    if (currentEmployee) {
      localStorage.setItem('currentEmployee', JSON.stringify(currentEmployee));
    }
  }, [currentEmployee]);

  const updateTimesheet = (timesheet: TimesheetEntry) => {
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
  };

  const getCurrentTimesheet = () => {
    if (!currentEmployee) return undefined;
    
    const today = new Date().toISOString().split('T')[0];
    return timesheets.find(t => 
      t.employeeId === currentEmployee.id && 
      t.date === today
    );
  };

  const value = {
    employees,
    timesheets,
    currentEmployee,
    setCurrentEmployee,
    updateTimesheet,
    getCurrentTimesheet
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
