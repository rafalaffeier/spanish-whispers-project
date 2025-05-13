
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { API_BASE_URL } from '@/services/apiConfig';

interface DebugPanelProps {
  data?: Record<string, any>;
  title?: string;
  showApiUrl?: boolean;
  showLogs?: boolean;
}

const DebugPanel = ({ 
  data = {}, 
  title = "Debug Mode", 
  showApiUrl = true,
  showLogs = true 
}: DebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [dbStatus, setDbStatus] = useState<string | null>(null);
  
  // Obtener información de la API
  const apiUrl = API_BASE_URL || import.meta.env.VITE_API_URL || window.location.origin + '/api';
  const apiUrlVisible = showApiUrl ? apiUrl : "[hidden]";
  
  // Función para añadir logs
  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
    console.log(`[DEBUG] ${message}`);
  };
  
  // Función para probar la conexión a la API
  const testApiConnection = async () => {
    try {
      addLog("Probando conexión a la API...");
      const response = await fetch(`${apiUrl}/health`);
      const text = await response.text();
      
      try {
        const json = JSON.parse(text);
        addLog(`Respuesta de la API: ${JSON.stringify(json)} (Status: ${response.status})`);
        
        if (json.status === 'ok') {
          setDbStatus('Conectado');
          addLog('Conexión a la base de datos: OK');
        } else {
          setDbStatus('Error');
          addLog('La API responde pero el estado no es OK');
        }
      } catch (e) {
        addLog(`Respuesta de la API no es JSON válido: ${text} (Status: ${response.status})`);
        setDbStatus('Error');
      }
    } catch (error) {
      addLog(`Error de conexión: ${error instanceof Error ? error.message : String(error)}`);
      setDbStatus('Sin conexión');
    }
  };
  
  // Verificar base de datos explícitamente
  const checkDatabase = async () => {
    try {
      addLog("Verificando conexión a base de datos...");
      const response = await fetch(`${apiUrl}/health?check_db=1`);
      
      if (!response.ok) {
        setDbStatus('Error');
        addLog(`Error al verificar BD: ${response.status} ${response.statusText}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.database === 'ok') {
        setDbStatus('Conectado');
        addLog('Base de datos conectada correctamente');
      } else {
        setDbStatus('Error');
        addLog(`Problema con la base de datos: ${data.message || 'Error desconocido'}`);
      }
    } catch (error) {
      setDbStatus('Error');
      addLog(`Error al verificar BD: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // Verificar auth
  const checkAuth = () => {
    const token = localStorage.getItem('authToken');
    const employee = localStorage.getItem('currentEmployee');
    
    if (token) {
      addLog(`Token encontrado: ${token.substring(0, 10)}...`);
      
      if (employee) {
        try {
          const employeeData = JSON.parse(employee);
          addLog(`Usuario autenticado: ${employeeData.name || employeeData.email}`);
          addLog(`Rol: ${employeeData.isCompany ? 'Empleador' : 'Empleado'}`);
        } catch {
          addLog("Error al parsear datos del usuario");
        }
      } else {
        addLog("Token encontrado pero sin datos de usuario");
      }
    } else {
      addLog("No hay sesión activa");
    }
  };
  
  // Al montar, verificar la conexión automáticamente
  useEffect(() => {
    // Solo verificar si el panel está abierto
    if (isOpen && dbStatus === null) {
      testApiConnection();
    }
  }, [isOpen]);

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="bg-gray-900 text-white rounded-lg shadow-lg"
      >
        <CollapsibleTrigger asChild>
          <Button 
            variant="default"
            size="sm"
            className="w-full bg-gray-900 hover:bg-gray-800 text-white rounded-t-lg rounded-b-none border-b border-gray-700"
          >
            {title} {isOpen ? "▼" : "▲"}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="p-3 text-xs space-y-3">
          {/* Sección de información básica */}
          <div>
            <p className="mb-1 font-semibold text-green-400">Información del sistema</p>
            <div className="bg-gray-800 p-2 rounded">
              <p>API URL: {apiUrlVisible}</p>
              <p>Route: {window.location.pathname}</p>
              <p>Auth: {localStorage.getItem('authToken') ? 'Activo' : 'Inactivo'}</p>
              <p>DB Status: {dbStatus === null ? 'No verificado' : 
                dbStatus === 'Conectado' ? 
                  <span className="text-green-400">Conectado</span> : 
                  <span className="text-red-400">Error</span>}
              </p>
            </div>
          </div>
          
          {/* Mostrar datos pasados al panel */}
          {Object.keys(data).length > 0 && (
            <div>
              <p className="mb-1 font-semibold text-green-400">Datos contextuales</p>
              <pre className="bg-gray-800 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          )}
          
          {/* Logs del sistema */}
          {showLogs && (
            <div>
              <p className="mb-1 font-semibold text-green-400">Logs de depuración</p>
              <div className="bg-black text-green-400 p-2 rounded overflow-auto max-h-60 font-mono">
                {logs.map((log, i) => (
                  <div key={i}>{log}</div>
                ))}
                {logs.length === 0 && <div>Sin eventos registrados</div>}
              </div>
            </div>
          )}
          
          {/* Botones de acciones */}
          <div className="flex flex-wrap gap-2">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={testApiConnection}
              className="text-xs h-7"
            >
              Test API
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={checkDatabase}
              className="text-xs h-7"
              title="Verificar conexión a la base de datos"
            >
              Check DB
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={checkAuth}
              className="text-xs h-7"
            >
              Check Auth
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setLogs([])}
              className="text-xs h-7"
            >
              Clear Logs
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default DebugPanel;
