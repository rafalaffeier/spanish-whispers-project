
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TimesheetProvider } from "@/context/TimesheetContext";
import Login from "./pages/Login";
import Register from "./pages/Register"; 
import PasswordReset from "./pages/PasswordReset"; 
import PasswordResetConfirm from "./pages/PasswordResetConfirm"; 
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AdminActivity from "./pages/admin/AdminActivity";
import AdminCalendar from "./pages/admin/AdminCalendar";
import AdminNews from "./pages/admin/AdminNews";
import AdminProfile from "./pages/admin/AdminProfile";
import NotFound from "./pages/NotFound";

// Estilo mejorado con tema personalizado
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Definir base path para la aplicación
const BASE_PATH = '/apphora';

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <TimesheetProvider>
        <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
          <Toaster />
          <Sonner position="top-right" closeButton={true} />
          <BrowserRouter basename={BASE_PATH}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} /> 
              <Route path="/password-reset" element={<PasswordReset />} />
              <Route path="/password-reset-confirm" element={<PasswordResetConfirm />} />
              <Route path="/employee" element={<EmployeeDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/activity" element={<AdminActivity />} />
              <Route path="/admin/calendar" element={<AdminCalendar />} />
              <Route path="/admin/news" element={<AdminNews />} />
              <Route path="/admin/profile" element={<AdminProfile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TimesheetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
