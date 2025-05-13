
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Bell, 
  UserCog, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTimesheet } from '@/context/TimesheetContext';
import { clearAuth } from '@/services/apiConfig';
import { toast } from 'sonner';

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { setCurrentEmployee } = useTimesheet();
  
  const handleLogout = () => {
    // Clear authentication data
    clearAuth();
    // Reset current employee in context
    setCurrentEmployee(null);
    // Show success message
    toast.success("Sesión cerrada correctamente");
    // Navigate to login page
    navigate('/login');
  };

  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/admin', onClick: undefined },
    { title: 'Actividad', icon: Clock, path: '/admin/activity', onClick: undefined },
    { title: 'Calendario', icon: Calendar, path: '/admin/calendar', onClick: undefined },
    { title: 'Noticias', icon: Bell, path: '/admin/news', onClick: undefined },
    { title: 'Editar perfil', icon: UserCog, path: '/admin/profile', onClick: undefined },
    { title: 'Salir', icon: LogOut, path: '#', onClick: handleLogout },
  ];

  return (
    <div className="w-[220px] h-screen bg-white border-r flex flex-col">
      <div className="p-4 text-center"></div>
      <nav className="flex-1">
        <ul className="space-y-2 px-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              {item.onClick ? (
                <button
                  onClick={item.onClick}
                  className="flex w-full items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors text-gray-600 hover:bg-gray-100"
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </button>
              ) : (
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 px-4 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-[#A4CB6A]/10 text-[#A4CB6A]"
                        : "text-gray-600 hover:bg-gray-100"
                    )
                  }
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </NavLink>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;
