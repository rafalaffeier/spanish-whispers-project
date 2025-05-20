
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getCompanyByNif, updateCompany } from "@/services/companyService";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Props: open, onOpenChange, companyNif, afterSave
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyNif: string;
  afterSave?: () => void;
}

const emptyForm = {
  nombre: "",
  email: "",
  telefono: "",
  direccion: "",
  nif: "",
  provincia: "",
  codigo_postal: "",
  pais: "",
  avatar: "",
  bio: ""
};

const CompanyEditDialog: React.FC<Props> = ({ open, onOpenChange, companyNif, afterSave }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({ ...emptyForm });
  const [loading, setLoading] = useState(false);

  // Al abrir el diálogo, obtener los datos actuales de empresa
  useEffect(() => {
    if (!open || !companyNif) return;
    setLoading(true);
    getCompanyByNif(companyNif)
      .then(empresa => {
        setForm({
          nombre: empresa.nombre || "",
          email: empresa.email || "",
          telefono: empresa.telefono || "",
          direccion: empresa.direccion || "",
          nif: empresa.nif || "",
          provincia: empresa.provincia || "",
          codigo_postal: empresa.codigo_postal || "",
          pais: empresa.pais || "",
          avatar: empresa.avatar || "",
          bio: empresa.bio || ""
        });
      })
      .catch(err => {
        toast({
          title: "Error al cargar los datos de la empresa",
          description: String(err),
          variant: "destructive"
        });
      })
      .finally(() => setLoading(false));
  }, [open, companyNif]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyNif) return;
    setLoading(true);
    try {
      // Primero obtener id por NIF
      const empresa = await getCompanyByNif(companyNif);
      await updateCompany(empresa.id, { ...form });
      toast({
        title: "Perfil de empresa actualizado",
        description: "Los cambios han sido guardados correctamente."
      });
      if (afterSave) afterSave();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Error",
        description: String(err),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-scroll">
        <DialogHeader>
          <DialogTitle>Editar perfil de la empresa</DialogTitle>
          <DialogDescription>
            Actualiza aquí los datos de tu empresa.
          </DialogDescription>
        </DialogHeader>
        {loading
          ? <div className="flex items-center justify-center min-h-32"><span className="animate-spin mr-2">⏳</span> Cargando perfil...</div>
          : (
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={form.avatar || "/lovable-uploads/7cbe0d8f-8606-47a9-90f0-6e26f18cf47c.png"} />
                  <AvatarFallback>
                    {form.nombre?.charAt(0) || "E"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <label htmlFor="avatar">URL Imagen</label>
                  <Input
                    id="avatar"
                    name="avatar"
                    value={form.avatar}
                    onChange={handleChange}
                    placeholder="URL de imagen"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nombre">Nombre o razón social</label>
                  <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} required />
                </div>
                <div>
                  <label htmlFor="email">Email</label>
                  <Input id="email" name="email" value={form.email} onChange={handleChange} type="email" required />
                </div>
                <div>
                  <label htmlFor="telefono">Teléfono</label>
                  <Input id="telefono" name="telefono" value={form.telefono} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="nif">NIF / CIF</label>
                  <Input id="nif" name="nif" value={form.nif} onChange={handleChange} required />
                </div>
                <div>
                  <label htmlFor="direccion">Dirección</label>
                  <Input id="direccion" name="direccion" value={form.direccion} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="provincia">Provincia</label>
                  <Input id="provincia" name="provincia" value={form.provincia} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="codigo_postal">Código Postal</label>
                  <Input id="codigo_postal" name="codigo_postal" value={form.codigo_postal} onChange={handleChange} />
                </div>
                <div>
                  <label htmlFor="pais">País</label>
                  <Input id="pais" name="pais" value={form.pais} onChange={handleChange} />
                </div>
              </div>
              <div>
                <label htmlFor="bio">Biografía</label>
                <Textarea id="bio" name="bio" value={form.bio} onChange={handleChange} rows={4} />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar cambios"}</Button>
              </DialogFooter>
            </form>
          )
        }
      </DialogContent>
    </Dialog>
  );
};

export default CompanyEditDialog;
