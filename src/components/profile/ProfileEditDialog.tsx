import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTimesheet } from '@/context/TimesheetContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { updateEmployee } from '@/services/employeeService';

const departments = [
  "IT", "Recursos Humanos", "Finanzas", "Ventas", "Marketing", "Otros"
];
const divisions = [
  "España", "Andorra", "Latam", "Europa"
];

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getEmployeeEmail = (currentEmployee: any): string => {
  // Intentar sacar email directo del contexto, si existe
  if (currentEmployee?.email) return currentEmployee.email;
  // Si no, mirar en localStorage (por si está guardado allí)
  try {
    const raw = localStorage.getItem('currentEmployee');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email) return parsed.email;
    }
  } catch (e) {}
  // Si no lo encuentra, devolver string vacío
  return "";
};

const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({ open, onOpenChange }) => {
  const { currentEmployee, setCurrentEmployee } = useTimesheet();

  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    dni: "",
    department: "",
    position: "",
    division: "",
    country: "",
    province: "",
    city: "",
    address: "",
    companyAddress: "",
    zipCode: "",
    phone: "",
    avatar: "",
  });

  useEffect(() => {
    if (open && currentEmployee) {
      setFormData({
        name: currentEmployee.name || "",
        lastName: currentEmployee.lastName || "",
        email: getEmployeeEmail(currentEmployee), // <--- Esto coge siempre el email correcto
        dni: currentEmployee.dni || "",
        department: currentEmployee.department || "",
        position: currentEmployee.position || "",
        division: currentEmployee.division || "",
        country: currentEmployee.country || "",
        province: currentEmployee.province || "",
        city: currentEmployee.city || "",
        address: currentEmployee.address || "",
        companyAddress: currentEmployee.companyAddress || "",
        zipCode: currentEmployee.zipCode || "",
        phone: currentEmployee.phone || "",
        avatar: currentEmployee.avatar || "",
      });
    }
  }, [open, currentEmployee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentEmployee) return;

    try {
      await updateEmployee(currentEmployee.id, {
        name: formData.name,
        lastName: formData.lastName,
        email: formData.email,
        dni: formData.dni,
        department: formData.department,
        position: formData.position,
        division: formData.division,
        country: formData.country,
        province: formData.province,
        city: formData.city,
        address: formData.address,
        companyAddress: formData.companyAddress,
        zipCode: formData.zipCode,
        phone: formData.phone,
        avatar: formData.avatar,
      });

      setCurrentEmployee({
        ...currentEmployee,
        ...formData,
      });

      toast({
        title: "Perfil actualizado",
        description: "Los cambios han sido guardados correctamente.",
      });
      onOpenChange(false);
    } catch (err: any) {
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil en la base de datos.",
        variant: "destructive"
      });
      console.error("Error updating employee profile in DB:", err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Editar perfil de empleado</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.avatar || "/lovable-uploads/7cbe0d8f-8606-47a9-90f0-6e26f18cf47c.png"} />
              <AvatarFallback>
                {formData.name.charAt(0) || ""}
              </AvatarFallback>
            </Avatar>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="avatar">URL de imagen</Label>
              <Input
                id="avatar"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                placeholder="URL de tu imagen de perfil"
              />
            </div>
          </div>

          {/* Grid de dos columnas para campos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* campos personales */}
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="lastName">Apellidos</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                value={formData.email}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
                tabIndex={-1}
              />
            </div>
            <div>
              <Label htmlFor="dni">NIF / CIF / ID</Label>
              <Input id="dni" name="dni" value={formData.dni} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="department">Departamento</Label>
              <Input id="department" name="department" value={formData.department} onChange={handleChange} placeholder="Ej: IT, RRHH..." />
            </div>
            <div>
              <Label htmlFor="position">Cargo</Label>
              <Input id="position" name="position" value={formData.position} onChange={handleChange} placeholder="Ej: Técnico, Manager..." />
            </div>
            <div>
              <Label htmlFor="division">División</Label>
              <select
                id="division"
                name="division"
                value={formData.division}
                onChange={handleChange}
                className="block w-full border rounded px-2 py-2"
              >
                <option value="">Selecciona...</option>
                {divisions.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="country">País</Label>
              <Input id="country" name="country" value={formData.country} onChange={handleChange} placeholder="España, Andorra..." />
            </div>
            <div>
              <Label htmlFor="province">Provincia</Label>
              <Input id="province" name="province" value={formData.province} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Dirección de empleado" />
            </div>
            <div>
              <Label htmlFor="companyAddress">Calle de la empresa</Label>
              <Input id="companyAddress" name="companyAddress" value={formData.companyAddress} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="zipCode">Código postal</Label>
              <Input id="zipCode" name="zipCode" value={formData.zipCode} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">Guardar cambios</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditDialog;
