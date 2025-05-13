import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTimesheet } from '@/context/TimesheetContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { useGeolocation } from '@/hooks/useGeolocation';
import { MapPin } from 'lucide-react';
import GoogleMap from '@/components/maps/GoogleMap';

interface ProfileEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileEditDialog: React.FC<ProfileEditDialogProps> = ({ open, onOpenChange }) => {
  const { currentEmployee, setCurrentEmployee } = useTimesheet();
  const { getLocation } = useGeolocation();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: '',
    coordinates: {
      lat: 0,
      lng: 0
    }
  });

  // Cargar datos del empleado actual cuando se abre el diálogo
  useEffect(() => {
    if (open && currentEmployee) {
      setFormData({
        name: currentEmployee.name || '',
        email: currentEmployee.email || '',
        phone: currentEmployee.phone || '',
        address: currentEmployee.address || '',
        avatar: currentEmployee.avatar || '',
        coordinates: currentEmployee.coordinates || { lat: 0, lng: 0 }
      });
    }
  }, [open, currentEmployee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentEmployee) return;
    
    // Actualizar el empleado en el contexto
    setCurrentEmployee({
      ...currentEmployee,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      avatar: formData.avatar,
      coordinates: formData.coordinates
    });
    
    toast({
      title: "Perfil actualizado",
      description: "Los cambios han sido guardados correctamente."
    });
    
    onOpenChange(false);
  };

  const handleGetLocation = async () => {
    try {
      const position = await getLocation();
      setFormData(prev => ({
        ...prev,
        coordinates: {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }
      }));
      
      toast({
        title: "Ubicación actualizada",
        description: "Se ha actualizado tu ubicación actual."
      });
    } catch (error) {
      toast({
        title: "Error de ubicación",
        description: error instanceof Error ? error.message : "No se pudo obtener la ubicación",
        variant: "destructive"
      });
    }
  };

  const hasCoordinates = formData.coordinates && 
    typeof formData.coordinates.lat === 'number' && 
    formData.coordinates.lat !== 0 &&
    typeof formData.coordinates.lng === 'number' &&
    formData.coordinates.lng !== 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Avatar */}
          <div className="flex flex-col items-center space-y-2">
            <Avatar className="h-24 w-24">
              <AvatarImage src={formData.avatar || "/lovable-uploads/7cbe0d8f-8606-47a9-90f0-6e26f18cf47c.png"} />
              <AvatarFallback>{formData.name.charAt(0)}</AvatarFallback>
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
          
          {/* Datos personales */}
          <div className="grid w-full gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="address">Dirección</Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            
            {/* Ubicación */}
            <div className="grid w-full items-center gap-1.5">
              <div className="flex justify-between items-center">
                <Label>Ubicación actual</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={handleGetLocation}
                  className="flex items-center"
                >
                  <MapPin className="h-4 w-4 mr-1" />
                  Actualizar ubicación
                </Button>
              </div>
              
              {hasCoordinates ? (
                <div className="mt-2 h-[150px] rounded-md overflow-hidden">
                  <GoogleMap 
                    center={formData.coordinates}
                    zoom={15}
                    markers={[{position: formData.coordinates}]}
                    height="150px"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-[150px] bg-muted/20 rounded-md">
                  <p className="text-muted-foreground text-center">
                    No hay datos de ubicación disponibles
                  </p>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground mt-1">
                {hasCoordinates ? (
                  <span>Lat: {formData.coordinates.lat.toFixed(6)}, Lng: {formData.coordinates.lng.toFixed(6)}</span>
                ) : (
                  <span>Haz clic en "Actualizar ubicación" para obtener tu posición actual</span>
                )}
              </div>
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
