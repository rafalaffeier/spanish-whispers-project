
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTimesheet } from '@/context/TimesheetContext';
import AdminSidebar from '@/components/AdminSidebar';
import { Clock } from 'lucide-react';

const AdminActivity = () => {
  const { timesheets, employees } = useTimesheet();
  const navigate = useNavigate();
  
  // Obtener la actividad reciente (últimos 10 registros)
  const recentActivity = [...timesheets]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header superior con título */}
        <header className="bg-[#A4CB6A] text-white py-1 px-4 text-center">
          <h1 className="text-lg font-semibold">APLIUM APLICACIONES TELEMATICAS SL</h1>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Actividad Reciente</h1>
            <p className="text-gray-600">Registros de actividad de los empleados</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Clock className="mr-2 text-[#A4CB6A]" />
              Registros Recientes
            </h2>
            
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => {
                  const employee = employees.find(e => e.id === activity.employeeId);
                  const startTime = activity.startTime ? new Date(activity.startTime).toLocaleTimeString() : 'No registrado';
                  const endTime = activity.endTime ? new Date(activity.endTime).toLocaleTimeString() : 'En progreso';
                  
                  return (
                    <div key={index} className="border-b pb-3 last:border-0">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">{employee?.name || 'Empleado desconocido'}</p>
                          <p className="text-sm text-gray-500">
                            {new Date(activity.date).toLocaleDateString()} • {startTime} - {endTime}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-1 rounded text-xs ${
                            activity.status === 'finished' ? 'bg-green-100 text-green-800' : 
                            activity.status === 'active' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {activity.status === 'finished' ? 'Completado' : 
                             activity.status === 'active' ? 'En progreso' : 'Pausado'}
                          </span>
                        </div>
                      </div>
                      {activity.pauseTime.length > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                          {activity.pauseTime.length} pausas registradas
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-4 text-gray-500">
                No hay actividad reciente para mostrar
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminActivity;
