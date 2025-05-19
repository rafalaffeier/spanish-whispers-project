
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTimesheet } from '@/context/TimesheetContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { updateEmployee } from '@/services/employeeService';

const ProfileEditDialog = ({ open, onOpenChange }) => {
  const { currentEmployee, setCurrentEmployee } = useTimesheet();

  // Definir los campos igual que en tu tabla empleados
  const [formData, setFormData] = useState({
    nombre: "",
    apellidos: "",
    email: "",
    dni: "",
    departamento_id: "",
    cargo: "",
    division: "",
    pais: "",
    ciudad: "",
    direccion: "",
    codigo_postal: "",
    telefono: "",
    avatar: "",
  });

  useEffect(() => {
    if (open && currentEmployee) {
      setFormData({
        nombre: currentEmployee.nombre || currentEmployee.name || "",
        apellidos: currentEmployee.apellidos || currentEmployee.lastName || "",
        email: currentEmployee.email || "",
        dni: currentEmployee.dni || "",
        departamento_id: currentEmployee.departamento_id || "",
        cargo: currentEmployee.cargo || currentEmployee.position || "",
        division: currentEmployee.division || "",
        pais: currentEmployee.pais || currentEmployee.country || "",
        ciudad: currentEmployee.ciudad || currentEmployee.city || "",
        direccion: currentEmployee.direccion || currentEmployee.address || "",
        codigo_postal: currentEmployee.codigo_postal || currentEmployee.zipCode || "",
        telefono: currentEmployee.telefono || currentEmployee.phone || "",
        avatar: currentEmployee.avatar || "",
      });
    }
  }, [open, currentEmployee]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Guardar cambios usando las claves de la tabla empleados
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentEmployee) return;
    try {
      await updateEmployee(currentEmployee.id, {
        nombre: formData.nombre,
        apellidos: formData.apellidos,
        email: formData.email, // Solo lectura, pero se envía por si acaso (la API decidirá si permitir cambios)
        dni: formData.dni,
        departamento_id: formData.departamento_id,
        cargo: formData.cargo,
        division: formData.division,
        pais: formData.pais,
        ciudad: formData.ciudad,
        direccion: formData.direccion,
        codigo_postal: formData.codigo_postal,
        telefono: formData.telefono,
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
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.avatar || "/lovable-uploads/7cbe0d8f-8606-47a9-90f0-6e26f18cf47c.png"} />
              <AvatarFallback>
                {formData.nombre.charAt(0)}
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
              <Label htmlFor="nombre">Nombre</Label>
              <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="apellidos">Apellidos</Label>
              <Input id="apellidos" name="apellidos" value={formData.apellidos} onChange={handleChange} required />
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
              <Input id="dni" name="dni" value={formData.dni} onChange={handleChange} required />
            </div>
            <div>
              <Label htmlFor="departamento_id">Departamento (ID)</Label>
              <Input id="departamento_id" name="departamento_id" value={formData.departamento_id} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" name="cargo" value={formData.cargo} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="division">División</Label>
              <Input id="division" name="division" value={formData.division} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="pais">País</Label>
              <Input id="pais" name="pais" value={formData.pais} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="ciudad">Ciudad</Label>
              <Input id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="codigo_postal">Código Postal</Label>
              <Input id="codigo_postal" name="codigo_postal" value={formData.codigo_postal} onChange={handleChange} />
            </div>
            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" name="telefono" value={formData.telefono} onChange={handleChange} />
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

