import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { UserCog, Save, Camera, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { getCompanyByNif, updateCompany } from '@/services/companyService';
import ProfileEditDialog from "@/components/profile/ProfileEditDialog";
import EmployeeEditForm from "@/components/profile/EmployeeEditForm";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { getEmployees } from "@/services/employeeService";
import { useNavigate } from "react-router-dom";
import CompanyEditDialog from "@/components/profile/CompanyEditDialog";

// Reemplaza este import si tu auth/context tiene el empleado actual:
const getCurrentEmployee = () => {
  const stored = localStorage.getItem('currentEmployee');
  return stored ? JSON.parse(stored) : null;
};

const AdminProfile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    id: '',
    nombre: '',
    email: '',
    telefono: '',
    direccion: '',
    nif: '',
    provincia: '',
    codigo_postal: '',
    pais: '',
    avatar: '',
    bio: ''
  });
  const [editData, setEditData] = useState(profileData);
  const [loading, setLoading] = useState(true);
  const [showProfileDialog, setShowProfileDialog] = useState(false);

  // Estado para editar empleado
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);
  const [showCompanyDialog, setShowCompanyDialog] = useState(false);

  useEffect(() => {
    getEmployees().then(setEmployees).catch(() => setEmployees([]));
    // Obtener SIEMPRE datos de empresa para mostrar en el perfil
    const employee = getCurrentEmployee();
    if (employee && employee.isCompany && employee.nifdeMiEmpresa) {
      setLoading(true);
      getCompanyByNif(employee.nifdeMiEmpresa)
        .then(empresa => {
          setProfileData({
            id: empresa.id,
            nombre: empresa.nombre || '',
            email: empresa.email || '',
            telefono: empresa.telefono || '',
            direccion: empresa.direccion || '',
            nif: empresa.nif || '',
            provincia: empresa.provincia || '',
            codigo_postal: empresa.codigo_postal || '',
            pais: empresa.pais || '',
            avatar: empresa.avatar || '',
            bio: empresa.bio || ''
          });
          setEditData({
            id: empresa.id,
            nombre: empresa.nombre || '',
            email: empresa.email || '',
            telefono: empresa.telefono || '',
            direccion: empresa.direccion || '',
            nif: empresa.nif || '',
            provincia: empresa.provincia || '',
            codigo_postal: empresa.codigo_postal || '',
            pais: empresa.pais || '',
            avatar: empresa.avatar || '',
            bio: empresa.bio || ''
          });
        })
        .catch(err => {
          toast({
            title: "Error al cargar datos de empresa",
            description: String(err),
            variant: "destructive"
          });
          // En caso de error, resetea los campos a vacío pero sin datos demo
          setProfileData({
            id: '',
            nombre: '',
            email: '',
            telefono: '',
            direccion: '',
            nif: '',
            provincia: '',
            codigo_postal: '',
            pais: '',
            avatar: '',
            bio: ''
          });
          setEditData({
            id: '',
            nombre: '',
            email: '',
            telefono: '',
            direccion: '',
            nif: '',
            provincia: '',
            codigo_postal: '',
            pais: '',
            avatar: '',
            bio: ''
          });
        })
        .finally(() => setLoading(false));
    } else {
      // Si por alguna razón el empleado no es empresa o falta info, deja campos vacíos.
      setProfileData({
        id: '',
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        nif: '',
        provincia: '',
        codigo_postal: '',
        pais: '',
        avatar: '',
        bio: ''
      });
      setEditData({
        id: '',
        nombre: '',
        email: '',
        telefono: '',
        direccion: '',
        nif: '',
        provincia: '',
        codigo_postal: '',
        pais: '',
        avatar: '',
        bio: ''
      });
      setLoading(false);
    }
  }, []);

  const handleEditToggle = async () => {
    if (isEditing && profileData.id) {
      // Guardar cambios en BDD si es empresa
      setLoading(true);
      try {
        await updateCompany(profileData.id, {
          nombre: editData.nombre,
          email: editData.email,
          telefono: editData.telefono,
          direccion: editData.direccion,
          nif: editData.nif,
          provincia: editData.provincia,
          codigo_postal: editData.codigo_postal,
          pais: editData.pais,
          avatar: editData.avatar,
          bio: editData.bio // Agrega el campo bio si tu API/tables lo soportan
        });
        setProfileData(editData);
        toast({
          title: "Perfil actualizado",
          description: "Los cambios han sido guardados correctamente"
        });
      } catch (err) {
        toast({
          title: "Error al guardar",
          description: String(err),
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }
    setIsEditing(!isEditing);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Detectar si el usuario actual es "empresa/empleador"
  const currentEmployee = getCurrentEmployee();
  const isCompany = !!currentEmployee?.isCompany;
  const nifEmpresa = currentEmployee?.nifdeMiEmpresa ?? "";

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <span className="animate-spin mr-2">⏳</span> Cargando perfil...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-[#A4CB6A] text-white py-1 px-4 text-center">
          <h1 className="text-lg font-semibold">{profileData.nombre || "Perfil de empresa"}</h1>
        </header>
        <main className="flex-1 overflow-auto p-6">
          <div className="flex flex-wrap gap-4 items-center mb-6">
            <Button
              onClick={() => {
                if (isCompany) setShowCompanyDialog(true);
                else setShowProfileDialog(true);
              }}
              className="bg-blue-500 hover:bg-blue-600"
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar mi perfil
            </Button>
            {/* Mostrar el diálogo correcto según el tipo de usuario */}
            {isCompany ? (
              <CompanyEditDialog
                open={showCompanyDialog}
                onOpenChange={setShowCompanyDialog}
                companyNif={nifEmpresa}
                afterSave={() => {
                  // Refrescar datos de empresa tras guardar
                  getCompanyByNif(nifEmpresa)
                    .then(empresa => {
                      setProfileData({
                        id: empresa.id,
                        nombre: empresa.nombre || '',
                        email: empresa.email || '',
                        telefono: empresa.telefono || '',
                        direccion: empresa.direccion || '',
                        nif: empresa.nif || '',
                        provincia: empresa.provincia || '',
                        codigo_postal: empresa.codigo_postal || '',
                        pais: empresa.pais || '',
                        avatar: empresa.avatar || '',
                        bio: empresa.bio || ''
                      });
                      setEditData({
                        id: empresa.id,
                        nombre: empresa.nombre || '',
                        email: empresa.email || '',
                        telefono: empresa.telefono || '',
                        direccion: empresa.direccion || '',
                        nif: empresa.nif || '',
                        provincia: empresa.provincia || '',
                        codigo_postal: empresa.codigo_postal || '',
                        pais: empresa.pais || '',
                        avatar: empresa.avatar || '',
                        bio: empresa.bio || ''
                      });
                    });
                }}
              />
            ) : (
              <ProfileEditDialog open={showProfileDialog} onOpenChange={setShowProfileDialog} />
            )}

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                onClick={() => setSelectedEmployeeId("")}
                className="bg-[#A4CB6A] hover:bg-[#8FB75A] text-white"
              >
                <Edit className="mr-2 h-4 w-4" />
                Editar perfil de empleado
              </Button>
              <Select
                value={selectedEmployeeId || ""}
                onValueChange={value => setSelectedEmployeeId(value)}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Selecciona empleado" />
                </SelectTrigger>
                <SelectContent>
                  {employees
                    .filter(emp => !emp.isCompany)
                    .map(emp => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} ({emp.email})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar y sección de la foto */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 border">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback>{(profileData.nombre?.charAt(0) || "E")}</AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <div className="absolute bottom-0 right-0 bg-[#A4CB6A] rounded-full p-2 text-white cursor-pointer">
                      <Camera className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-center font-medium">{profileData.nombre}</p>
                <p className="text-sm text-gray-500">{profileData.nif}</p>
              </div>
              {/* Formulario de perfil */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre o razón social</label>
                    {isEditing ? (
                      <Input name="nombre" value={editData.nombre} onChange={handleChange} />
                    ) : (
                      <p className="p-2 border rounded-md bg-gray-50">{profileData.nombre}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    {isEditing ? (
                      <Input name="email" type="email" value={editData.email} onChange={handleChange} />
                    ) : (
                      <p className="p-2 border rounded-md bg-gray-50">{profileData.email}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Teléfono</label>
                    {isEditing ? (
                      <Input name="telefono" value={editData.telefono} onChange={handleChange} />
                    ) : (
                      <p className="p-2 border rounded-md bg-gray-50">{profileData.telefono}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">NIF / CIF</label>
                    {isEditing ? (
                      <Input name="nif" value={editData.nif} onChange={handleChange} />
                    ) : (
                      <p className="p-2 border rounded-md bg-gray-50">{profileData.nif}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Dirección</label>
                    {isEditing ? (
                      <Input name="direccion" value={editData.direccion} onChange={handleChange} />
                    ) : (
                      <p className="p-2 border rounded-md bg-gray-50">{profileData.direccion}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Provincia</label>
                    {isEditing ? (
                      <Input name="provincia" value={editData.provincia} onChange={handleChange} />
                    ) : (
                      <p className="p-2 border rounded-md bg-gray-50">{profileData.provincia}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Código Postal</label>
                    {isEditing ? (
                      <Input name="codigo_postal" value={editData.codigo_postal} onChange={handleChange} />
                    ) : (
                      <p className="p-2 border rounded-md bg-gray-50">{profileData.codigo_postal}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">País</label>
                    {isEditing ? (
                      <Input name="pais" value={editData.pais} onChange={handleChange} />
                    ) : (
                      <p className="p-2 border rounded-md bg-gray-50">{profileData.pais}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Biografía</label>
                  {isEditing ? (
                    <Textarea name="bio" value={editData.bio} onChange={handleChange} rows={4} />
                  ) : (
                    <p className="p-2 border rounded-md bg-gray-50 min-h-[100px]">{profileData.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {selectedEmployeeId && (
            <EmployeeEditForm
              employeeId={selectedEmployeeId}
              onUpdate={() => {
                setSelectedEmployeeId(undefined);
                // Opcionalmente, recargar también lista empleados si quieres
                getEmployees().then(setEmployees);
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminProfile;
