
import { useLocation, Link, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  // Para la vista previa, redirigir automáticamente a login
  if (location.pathname === "/") {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-800 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-6">Oops! Página no encontrada</p>
        <p className="text-md text-gray-500 mb-6">Ruta actual: {location.pathname}</p>
        <Button asChild>
          <Link to="/login" className="px-6 py-3">
            Ir a la página de inicio de sesión
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
