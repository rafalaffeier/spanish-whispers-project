
import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getEmployee, updateEmployee } from "@/services/employeeService";
import { Employee } from "@/types/timesheet";

interface Props {
  employeeId: string;
  onUpdate: () => void;
}

const emptyForm = {
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
};

const EmployeeEditForm: React.FC<Props> = ({ employeeId, onUpdate }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);
    getEmployee(employeeId)
      .then(emp => {
        setForm({
          name: emp.name || "",
          lastName: emp.lastName || "",
          email: emp.email || "",
          dni: emp.dni || "",
          department: emp.department || "",
          position: emp.position || "",
          division: emp.division || "",
          country: emp.country || "",
          city: emp.city || "",
          address: emp.address || "",
          zipCode: emp.zipCode || "",
          phone: emp.phone || "",
          avatar: emp.avatar || "",
        });
      })
      .catch(err => {
        toast({
          title: "Error al cargar datos del empleado",
          description: String(err),
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [employeeId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateEmployee(employeeId, { ...form });
      toast({
        title: "Perfil de empleado actualizado",
        description: "Los cambios han sido guardados correctamente.",
      });
      onUpdate();
    } catch (err) {
      toast({
        title: "Error",
        description: String(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!employeeId) return null;

  return (
    <form
      className="bg-white p-6 rounded-lg shadow space-y-4 my-4"
      onSubmit={handleSubmit}
    >
      <div className="flex gap-4">
        <div>
          <Label htmlFor="avatar">URL Foto</Label>
          <Input name="avatar" id="avatar" value={form.avatar} onChange={handleChange} />
        </div>
        <div className="flex-1">
          <Label htmlFor="name">Nombre</Label>
          <Input name="name" id="name" value={form.name} onChange={handleChange} required />
        </div>
        <div className="flex-1">
          <Label htmlFor="lastName">Apellidos</Label>
          <Input name="lastName" id="lastName" value={form.lastName} onChange={handleChange} required />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input name="email" id="email" value={form.email} readOnly className="bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="dni">NIF / ID</Label>
          <Input name="dni" id="dni" value={form.dni} readOnly className="bg-gray-100" />
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input name="phone" id="phone" value={form.phone} onChange={handleChange} />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="department">Departamento</Label>
          <Input name="department" id="department" value={form.department} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="position">Cargo</Label>
          <Input name="position" id="position" value={form.position} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="division">División</Label>
          <Input name="division" id="division" value={form.division} onChange={handleChange} />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="country">País</Label>
          <Input name="country" id="country" value={form.country} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="city">Ciudad</Label>
          <Input name="city" id="city" value={form.city} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="address">Dirección</Label>
          <Input name="address" id="address" value={form.address} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="zipCode">Código Postal</Label>
          <Input name="zipCode" id="zipCode" value={form.zipCode} onChange={handleChange} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
};

export default EmployeeEditForm;
