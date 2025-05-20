import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTimesheet } from '@/context/TimesheetContext';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Download, Users } from 'lucide-react';
import DebugPanel from '@/components/debug/DebugPanel';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '@/components/ui/select';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { employees, timesheets, currentEmployee } = useTimesheet();
  const [selectedView, setSelectedView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [debugData, setDebugData] = useState<Record<string, any>>({});
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | 'all'>('all');

  // Función de logging para depuración
  const addLog = (message: string) => {
    console.log(`[AdminDashboard] ${message}`);
    setDebugData(prev => ({
      ...prev,
      lastAction: message,
      timestamp: new Date().toISOString()
    }));
  };
  
  // Verificar autenticación al montar
  useEffect(() => {
    addLog("Component mounted");
    
    const token = localStorage.getItem('authToken');
    const employeeData = localStorage.getItem('currentEmployee');
    
    if (!token || !employeeData) {
      addLog("No authentication found, redirecting to login");
      navigate('/login', { replace: true });
      return;
    }
    
    try {
      const parsedEmployee = JSON.parse(employeeData);
      if (!parsedEmployee.isCompany && parsedEmployee.role !== 'empleador') {
        addLog("User is not admin/employer, redirecting");
        navigate('/employee', { replace: true });
      } else {
        addLog(`Admin authenticated: ${parsedEmployee.name}`);
      }
      
      // Actualizar datos de depuración
      setDebugData(prev => ({
        ...prev,
        currentEmployee: parsedEmployee,
        authState: 'active'
      }));
    } catch (error) {
      addLog(`Error parsing employee data: ${error instanceof Error ? error.message : String(error)}`);
      navigate('/login', { replace: true });
    }
  }, [navigate]);
  
  // Obtener fecha actual formateada
  const today = new Date();
  const formattedDate = format(today, "d 'de' MMMM 'de' yyyy", { locale: es });

  // Filtrar jornadas para empleado seleccionado
  const filteredTimesheets = selectedEmployeeId === 'all'
    ? timesheets
    : timesheets.filter(ts => ts.employeeId === selectedEmployeeId);

  // Filtrar jornadas de hoy
  const todayTimesheets = filteredTimesheets.filter(timesheet => 
    timesheet.date === format(today, 'yyyy-MM-dd')
  );
  
  // Calcular total de horas trabajadas hoy
  const totalHoursWorked = todayTimesheets.reduce((total, timesheet) => {
    if (timesheet.startTime && timesheet.endTime) {
      const start = new Date(timesheet.startTime);
      const end = new Date(timesheet.endTime);
      const diffHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      return total + diffHours;
    }
    return total;
  }, 0);
  
  // Formatear horas trabajadas como hh:mm
  const formattedHours = Math.floor(totalHoursWorked);
  const formattedMinutes = Math.round((totalHoursWorked - formattedHours) * 60);
  const hoursDisplay = `${formattedHours}h ${formattedMinutes}m`;
  
  // Contar empleados activos (con jornada iniciada hoy)
  const activeEmployees = selectedEmployeeId === 'all'
    ? todayTimesheets.filter(ts => ts.status === 'active' || ts.status === 'paused').length
    : (todayTimesheets.some(ts => ts.status === 'active' || ts.status === 'paused') ? 1 : 0);

  // Contar total de pausas de hoy
  const totalPauses = todayTimesheets.reduce((total, timesheet) => {
    return total + (timesheet.pauses?.length || 0);
  }, 0);

  useEffect(() => {
    // Actualizar datos de depuración cuando cambien los datos
    setDebugData(prev => ({
      ...prev,
      employeesCount: employees.length,
      timesheetsCount: timesheets.length,
      todayTimesheets: todayTimesheets.length,
      activeEmployees,
      selectedEmployeeId,
    }));
    
    addLog(`Data loaded: ${employees.length} employees, ${timesheets.length} timesheets, Filtered by: ${selectedEmployeeId}`);
  }, [employees, timesheets, todayTimesheets.length, activeEmployees, selectedEmployeeId]);

  // Obtener datos del usuario actual
  const empresaDivision = currentEmployee?.division; // Asumimos que "division" agrupa a la empresa

  // Obtener NIF de la empresa del administrador actual
  const empresaNif = currentEmployee?.companyNif || null;

  // Filtrar empleados sólo por mismo companyNif, usando la nueva propiedad
  const filteredEmployees = employees.filter(emp =>
    !emp.isCompany && emp.companyNif === empresaNif
  );

  // Obtener nombre del empleado seleccionado (para cabecera)
  const selectedEmployee = selectedEmployeeId === 'all'
    ? null
    : employees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="mx-auto px-4 py-6 md:px-8 flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">{formattedDate}</p>
            </div>
            {/* Dropdown de empleados */}
            <div className="mt-4 md:mt-0 min-w-[250px]">
              <Select
                value={selectedEmployeeId}
                onValueChange={(value) => setSelectedEmployeeId(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar empleado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los empleados</SelectItem>
                  {/* Mostrar solo los empleados de la empresa por NIF */}
                  {filteredEmployees.map(emp => (
                    <SelectItem value={emp.id} key={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </header>
        
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          {/* Título de datos específicos si se seleccionó un empleado */}
          {selectedEmployee && (
            <div className="mb-6">
              <span className="text-lg text-gray-600">Empleado seleccionado: </span>
              <span className="font-bold">{selectedEmployee.name}</span>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Resumen de actividad</h2>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  addLog("Exportando datos a CSV");
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
            </div>
          </div>
          
          {/* Estadísticas principales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-blue-500" />
                    Total horas trabajadas
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{hoursDisplay}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-amber-500" />
                    Total pausas
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{totalPauses}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-green-500" />
                    Empleados activos
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeEmployees}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Filtros de visualización */}
          <div className="mb-8">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle>Filtros de visualización</CardTitle>
                <CardDescription>
                  Selecciona cómo quieres ver los datos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2">
                  <Button 
                    variant={selectedView === 'daily' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedView('daily');
                      addLog("Vista cambiada a diaria");
                    }}
                  >
                    Hoy
                  </Button>
                  <Button 
                    variant={selectedView === 'weekly' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedView('weekly');
                      addLog("Vista cambiada a semanal");
                    }}
                  >
                    Semanales
                  </Button>
                  <Button 
                    variant={selectedView === 'monthly' ? 'default' : 'outline'}
                    onClick={() => {
                      setSelectedView('monthly');
                      addLog("Vista cambiada a mensual");
                    }}
                  >
                    Mensuales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
      
      {/* Panel de depuración */}
      <DebugPanel 
        title="Admin Dashboard Debug" 
        data={debugData} 
      />
    </div>
  );
};

export default AdminDashboard;

// El archivo es largo; considera refactorizarlo en componentes más pequeños.
