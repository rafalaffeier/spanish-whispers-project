
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import SignatureCanvas from '@/components/SignatureCanvas';

interface TimesheetSignatureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (signature: string) => void;
}

const TimesheetSignatureDialog: React.FC<TimesheetSignatureDialogProps> = ({
  open,
  onOpenChange,
  onSave
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Firma para finalizar tu jornada</DialogTitle>
          <DialogDescription>
            Por favor, firma en el área a continuación para confirmar el fin de tu jornada.
          </DialogDescription>
        </DialogHeader>
        <SignatureCanvas onSave={onSave} />
      </DialogContent>
    </Dialog>
  );
};

export default TimesheetSignatureDialog;
