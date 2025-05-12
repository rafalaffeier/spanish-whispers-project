
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTimesheet } from '@/context/TimesheetContext';
import { Employee } from '@/types/timesheet';
import { updateEmployee } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({ 
  open, 
  onOpenChange 
}) => {
  const { currentEmployee, setCurrentEmployee, refreshData } = useTimesheet();
  const [formData, setFormData] = useState<Partial<Employee>>(currentEmployee || {});
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!currentEmployee) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!currentEmployee || !currentEmployee.id) {
      toast({
        title: "Error",
        description: "No se puede identificar al empleado actual",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Procesamos el nombre completo
      const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
      const dataToUpdate = {
        ...formData,
        name: fullName
      };
      
      console.log("Actualizando datos de empleado:", currentEmployee.id, dataToUpdate);
      
      // Llamar a la API para actualizar los datos
      await updateEmployee(currentEmployee.id, dataToUpdate);
      
      // Actualizar el empleado en el contexto
      const updatedEmployee = {
        ...currentEmployee,
        ...formData,
        name: fullName
      };
      
      setCurrentEmployee(updatedEmployee);
      
      // Refrescar datos del servidor
      await refreshData();
      
      toast({
        title: "Éxito",
        description: "Datos actualizados correctamente",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error("Error al actualizar perfil:", error);
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setCurrentEmployee(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-auto max-h-[90vh]">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">Edición de mi perfil</h2>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex justify-center">
            <Avatar className="h-32 w-32 cursor-pointer relative group">
              <AvatarImage 
                src={avatarFile ? URL.createObjectURL(avatarFile) : currentEmployee.avatar || "/lovable-uploads/cd2f057b-3eec-4848-8033-bc2c642d3137.png"} 
                alt={currentEmployee.name} 
              />
              <AvatarFallback>{currentEmployee.name.charAt(0)}</AvatarFallback>
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 rounded-full flex items-center justify-center transition-opacity">
                <span className="text-white text-xs">Cambiar</span>
              </div>
            </Avatar>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input 
                placeholder="Nombre" 
                name="firstName"
                value={formData.firstName || currentEmployee.name?.split(' ')[0] || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <Input 
                placeholder="Apellido" 
                name="lastName"
                value={formData.lastName || currentEmployee.name?.split(' ')[1] || ''}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Input 
                placeholder="Email" 
                name="email"
                value={formData.email || currentEmployee.email || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <Input 
                placeholder="DNI" 
                name="dni"
                value={formData.dni || currentEmployee.dni || ''}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Select 
                onValueChange={(value) => handleSelectChange('department', value)} 
                defaultValue={formData.department || currentEmployee.department || 'APLIUM Aplicaciones Tele'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APLIUM Aplicaciones Tele">APLIUM Aplicaciones Tele</SelectItem>
                  <SelectItem value="RRHH">RRHH</SelectItem>
                  <SelectItem value="Finanzas">Finanzas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Input 
                placeholder="Puesto" 
                name="position"
                value={formData.position || currentEmployee.position || ''}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Input 
                placeholder="División" 
                name="division"
                value={formData.division || currentEmployee.division || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <Select 
                onValueChange={(value) => handleSelectChange('country', value)} 
                defaultValue={formData.country || currentEmployee.country || 'España'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="País" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="España">España</SelectItem>
                  <SelectItem value="Portugal">Portugal</SelectItem>
                  <SelectItem value="Francia">Francia</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Input 
                placeholder="Ciudad" 
                name="city"
                value={formData.city || currentEmployee.city || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <Input 
                placeholder="Dirección" 
                name="address"
                value={formData.address || currentEmployee.address || ''}
                onChange={handleChange}
              />
            </div>
            
            <div>
              <Input 
                placeholder="Código Postal" 
                name="zipCode"
                value={formData.zipCode || currentEmployee.zipCode || ''}
                onChange={handleChange}
              />
            </div>
            <div>
              <Input 
                placeholder="Teléfono" 
                name="phone"
                value={formData.phone || currentEmployee.phone || ''}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="pt-4">
            <label className="block w-fit">
              <span className="sr-only">Elegir avatar</span>
              <span className="inline-block px-4 py-2 bg-gray-100 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-200 transition-colors">
                Choose File
              </span>
              <input 
                type="file" 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
              />
              <span className="ml-3 text-gray-500 text-sm">
                {avatarFile ? avatarFile.name : 'No file chosen'}
              </span>
            </label>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200">
          <Button 
            className="bg-gray-200 hover:bg-gray-300 text-gray-800" 
            onClick={handleLogout}
          >
            Cerrar sesión
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700" 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Guardando...' : 'Modificar datos'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;
