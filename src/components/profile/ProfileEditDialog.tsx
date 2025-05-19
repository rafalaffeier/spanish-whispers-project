
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTimesheet } from '@/context/TimesheetContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { updateEmployee } from '@/services/employeeService';

const ProfileEditDialog = ({ open, onOpenChange }) => {
  const { currentEmployee, setCurrentEmployee } = useTimesheet();

  // Mapeamos los campos que sí existen en Employee y se usan en tu API al frontend
  const [formData, setFormData] = useState({
    name: "",
    lastName: "",
    email: "",
    dni: "",
    department: "",
    position: "",
    division: "",
    country: "",
    city: "",
    address: "",
    zipCode: "",
    phone: "",
    avatar: "",
  });

  // Cargar datos del empleado real en los campos correctos
  useEffect(() => {
    if (open && currentEmployee) {
      setFormData({
        name: currentEmployee.name || "",
        lastName: currentEmployee.lastName || "",
        email: currentEmployee.email || "",
        dni: currentEmployee.dni || "",
        department: currentEmployee.department || "",
        position: currentEmployee.position || "",
        division: currentEmployee.division || "",
        country: currentEmployee.country || "",
        city: currentEmployee.city || "",
        address: currentEmployee.address || "",
        zipCode: currentEmployee.zipCode || "",
        phone: currentEmployee.phone || "",
        avatar: currentEmployee.avatar || "",
      });
    }
  }, [open, currentEmployee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Guardar cambios usando los campos correctos del modelo Employee
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentEmployee) return;
    try {
      // Mapeo al modelo backend si la API lo requiere. Ajusta aquí según corresponda.
      await updateEmployee(currentEmployee.id, {
        name: formData.name,
        lastName: formData.lastName,
        email: formData.email,
        dni: formData.dni,
        department: formData.department,
        position: formData.position,
        division: formData.division,
        country: formData.country,
        city: formData.city,
        address: formData.address,
        zipCode: formData.zipCode,
        phone: formData.phone,
        avatar: formData.avatar,
      });
      setCurrentEmployee({
        ...currentEmployee,
        ...formData
      });
      toast({
        title: "Perfil actualizado",
        description: "Los cambios han sido guardados correctamente.",
      });
      onOpenChange(false);
    } catch (err) {
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
          <DialogTitle>Editar perfil empleado</DialogTitle>
          <DialogDescription>Actualiza aquí tus datos de empleado. El email y el NIF son de solo lectura.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.avatar || "/lovable-uploads/7cbe0d8f-8606-47a9-90f0-6e26f18cf47c.png"} />
              <AvatarFallback>
                {formData.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="avatar">URL Imagen</Label>
              <Input
                id="avatar"
                name="avatar"
                value={formData.avatar}
                onChange={handleChange}
                placeholder="URL de tu foto de perfil"
              />
            </div>
          </div>

          {/* Datos personales y laborales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                value={formData.email}
                readOnly
                className="bg-gray-100 cursor-not-allowed"
                tabIndex={-1}
                required
              />
            </div>
            <div>
              <Label htmlFor="dni">NIF / CIF / ID</Label>
              <Input id="dni" name="dni" value={formData.dni} readOnly className="bg-gray-100 cursor-not-allowed" required />
            </div>
            <div>
              <Label htmlFor="department">Departamento</Label>
              <Input id="department" name="department" value={formData.department} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="position">Cargo</Label>
              <Input id="position" name="position" value={formData.position} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="division">División</Label>
              <Input id="division" name="division" value={formData.division} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="country">País</Label>
              <Input id="country" name="country" value={formData.country} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="city">Ciudad</Label>
              <Input id="city" name="city" value={formData.city} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="address">Dirección</Label>
              <Input id="address" name="address" value={formData.address} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="zipCode">Código Postal</Label>
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
