
import React, { useEffect, useState } from "react";
import { getCompanyByNif } from "@/services/companyService";
import CompanyEditDialog from "@/components/profile/CompanyEditDialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";

const AdminProfile = () => {
  const { toast } = useToast();
  const [company, setCompany] = useState<any>(null);
  const [editOpen, setEditOpen] = useState(false);

  // Obtener NIF de la empresa desde el empleado logueado:
  useEffect(() => {
    let nif = "";
    try {
      const empStr = localStorage.getItem("currentEmployee");
      if (empStr) {
        const emp = JSON.parse(empStr);
        nif = (emp.nifdeMiEmpresa || emp.nif || "").toUpperCase();
      }
    } catch (e) {
      nif = "";
    }
    if (!nif) {
      toast({
        title: "No se pudo cargar el perfil de empresa",
        description: "No se encontró el NIF de la empresa actual.",
        variant: "destructive"
      });
      setCompany(null);
      return;
    }
    // Cargar datos empresa
    getCompanyByNif(nif)
      .then(data => setCompany(data))
      .catch(error => {
        toast({
          title: "Error al obtener datos de empresa",
          description: error.message || String(error),
          variant: "destructive"
        });
        setCompany(null);
      });
  }, [editOpen]); // Volver a cargar tras editar

  if (!company) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-semibold mb-4">Perfil de la Empresa</h1>
        <p className="text-muted-foreground">No se pudo cargar la información de la empresa.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Perfil de la Empresa</h1>
      <div className="flex flex-col items-center gap-3 mb-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src={company.avatar || "/lovable-uploads/7cbe0d8f-8606-47a9-90f0-6e26f18cf47c.png"} alt={company.nombre} />
          <AvatarFallback>{company.nombre?.charAt(0) || "E"}</AvatarFallback>
        </Avatar>
        <div className="text-xl font-bold">{company.nombre}</div>
        <div className="text-sm text-muted-foreground">{company.email}</div>
        {company.bio && <div className="italic text-sm text-muted-foreground text-center">{company.bio}</div>}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded mb-6">
        <div>
          <b>NIF:</b><br /><span>{company.nif}</span>
        </div>
        <div>
          <b>Email:</b><br /><span>{company.email}</span>
        </div>
        <div>
          <b>Teléfono:</b><br /><span>{company.telefono}</span>
        </div>
        <div>
          <b>Dirección:</b><br /><span>{company.direccion}</span>
        </div>
        <div>
          <b>Provincia:</b><br /><span>{company.provincia}</span>
        </div>
        <div>
          <b>Código Postal:</b><br /><span>{company.codigo_postal}</span>
        </div>
        <div>
          <b>País:</b><br /><span>{company.pais}</span>
        </div>
      </div>
      <Button onClick={() => setEditOpen(true)}>
        Editar perfil
      </Button>
      {/* Diálogo para editar el perfil */}
      <CompanyEditDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        companyNif={company.nif}
        afterSave={() => { /* Los datos se recargan automáticamente */ }}
      />
    </div>
  );
};

export default AdminProfile;
