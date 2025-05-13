
import React, { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTimesheet } from '@/context/TimesheetContext';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Download, Users } from 'lucide-react';
import EmployeesActivityMap from '@/components/maps/EmployeesActivityMap';

const AdminDashboard = () => {
  const { employees, timesheets } = useTimesheet();
  const [selectedView, setSelectedView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  // Obtener fecha actual formateada
  const today = new Date();
  const formattedDate = format(today, "d 'de' MMMM 'de' yyyy", { locale: es });
  
  // Filtrar jornadas de hoy
  const todayTimesheets = timesheets.filter(timesheet => 
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
  const activeEmployees = todayTimesheets.filter(ts => 
    ts.status === 'active' || ts.status === 'paused'
  ).length;

  // Contar total de pausas de hoy
  const totalPauses = todayTimesheets.reduce((total, timesheet) => {
    return total + (timesheet.pauses?.length || 0);
  }, 0);

  return (
    <div className="flex h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="mx-auto px-4 py-6 md:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">{formattedDate}</p>
          </div>
        </header>
        
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold">Resumen de actividad</h2>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
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
          
          {/* Mapa de actividad de empleados */}
          <div className="mb-8">
            <EmployeesActivityMap 
              employees={employees} 
              title="Localización de empleados"
            />
          </div>
          
          {/* Sección para más contenido */}
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
                    onClick={() => setSelectedView('daily')}
                  >
                    Hoy
                  </Button>
                  <Button 
                    variant={selectedView === 'weekly' ? 'default' : 'outline'}
                    onClick={() => setSelectedView('weekly')}
                  >
                    Semanales
                  </Button>
                  <Button 
                    variant={selectedView === 'monthly' ? 'default' : 'outline'}
                    onClick={() => setSelectedView('monthly')}
                  >
                    Mensuales
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
