
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Bell, 
  UserCog, 
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AdminSidebar = () => {
  const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { title: 'Actividad', icon: Clock, path: '/admin/activity' },
    { title: 'Calendario', icon: Calendar, path: '/admin/calendar' },
    { title: 'Noticias', icon: Bell, path: '/admin/news' },
    { title: 'Editar perfil', icon: UserCog, path: '/admin/profile' },
    { title: 'Salir', icon: LogOut, path: '/login' },
  ];

  return (
    <div className="w-[220px] h-screen bg-white border-r flex flex-col">
      <div className="p-4 text-center"></div>
      <nav className="flex-1">
        <ul className="space-y-2 px-2">
          {menuItems.map((item, index) => (
            <li key={index}>
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
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default AdminSidebar;
