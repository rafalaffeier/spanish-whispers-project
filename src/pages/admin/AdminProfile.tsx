
import React, { useState } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import { UserCog, Save, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

const AdminProfile = () => {
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  
  // Datos del perfil (simulados)
  const [profileData, setProfileData] = useState({
    name: 'Francesc Gateu',
    email: 'admin@aplium.com',
    phone: '+34 600 123 456',
    position: 'Administrador',
    avatar: '/lovable-uploads/c86911d4-1095-4ee9-9c77-62f624b8e70f.png',
    bio: 'Administrador del sistema de registro de horas de APLIUM APLICACIONES TELEMATICAS SL.'
  });
  
  // Estado temporal para edición
  const [editData, setEditData] = useState(profileData);
  
  const handleEditToggle = () => {
    if (isEditing) {
      // Guardar cambios
      setProfileData(editData);
      toast({
        title: "Perfil actualizado",
        description: "Los cambios han sido guardados correctamente",
      });
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

  return (
    <div className="flex h-screen w-full bg-gray-50">
      <AdminSidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header superior con título */}
        <header className="bg-[#A4CB6A] text-white py-1 px-4 text-center">
          <h1 className="text-lg font-semibold">APLIUM APLICACIONES TELEMATICAS SL</h1>
        </header>
        
        <main className="flex-1 overflow-auto p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold">Perfil</h1>
              <p className="text-gray-600">Gestiona tu información personal</p>
            </div>
            <Button 
              onClick={handleEditToggle}
              className={isEditing ? "bg-[#A4CB6A] hover:bg-[#8FB75A]" : "bg-blue-500 hover:bg-blue-600"}
            >
              {isEditing ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              ) : (
                <>
                  <UserCog className="mr-2 h-4 w-4" />
                  Editar perfil
                </>
              )}
            </Button>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Avatar y sección de la foto */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <Avatar className="h-32 w-32 border">
                    <AvatarImage src={profileData.avatar} />
                    <AvatarFallback>FG</AvatarFallback>
                  </Avatar>
                  
                  {isEditing && (
                    <div className="absolute bottom-0 right-0 bg-[#A4CB6A] rounded-full p-2 text-white cursor-pointer">
                      <Camera className="h-4 w-4" />
                    </div>
                  )}
                </div>
                
                <p className="mt-2 text-center font-medium">{profileData.name}</p>
                <p className="text-sm text-gray-500">{profileData.position}</p>
              </div>
              
              {/* Formulario de perfil */}
              <div className="flex-1 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre</label>
                    {isEditing ? (
                      <Input 
                        name="name"
                        value={editData.name}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="p-2 border rounded-md bg-gray-50">{profileData.name}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    {isEditing ? (
                      <Input 
                        name="email"
                        type="email"
                        value={editData.email}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="p-2 border rounded-md bg-gray-50">{profileData.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Teléfono</label>
                    {isEditing ? (
                      <Input 
                        name="phone"
                        value={editData.phone}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="p-2 border rounded-md bg-gray-50">{profileData.phone}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Cargo</label>
                    {isEditing ? (
                      <Input 
                        name="position"
                        value={editData.position}
                        onChange={handleChange}
                      />
                    ) : (
                      <p className="p-2 border rounded-md bg-gray-50">{profileData.position}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Biografía</label>
                  {isEditing ? (
                    <Textarea 
                      name="bio"
                      value={editData.bio}
                      onChange={handleChange}
                      rows={4}
                    />
                  ) : (
                    <p className="p-2 border rounded-md bg-gray-50 min-h-[100px]">{profileData.bio}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminProfile;
