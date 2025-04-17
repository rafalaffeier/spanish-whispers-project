
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface PauseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const PauseDialog: React.FC<PauseDialogProps> = ({
  open,
  onOpenChange,
  reason,
  onReasonChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Registrar pausa</DialogTitle>
          <DialogDescription>
            Por favor, indica el motivo de tu pausa
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="reason">Motivo de la pausa</Label>
            <Textarea
              id="reason"
              placeholder="Ej: Descanso para almorzar"
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            Iniciar pausa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PauseDialog;
