
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { TimesheetProvider } from "@/context/TimesheetContext";
import Login from "./pages/Login";
import Register from "./pages/Register"; 
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminDashboard from "./pages/AdminDashboard";
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
              <Route path="/employee" element={<EmployeeDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TimesheetProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
