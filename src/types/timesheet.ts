
export interface Employee {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
  role: 'employee' | 'admin';
  // Campos para el perfil
  firstName?: string;
  lastName?: string;
  dni?: string;
  department?: string;
  position?: string;
  division?: string;
  country?: string;
  city?: string;
  address?: string;
  zipCode?: string;
  phone?: string;
}

export interface Timesheet {
  id: number;
  employeeId: number;
  date: string;
  startTime: string | null;
  endTime: string | null;
  signature: string | null;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  } | null;
}

// Añadimos la interface para la empresa
export interface Company {
  id: number;
  name: string;
  cifNif: string;
  address: string;
  province: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
}

// Interface para el formulario de registro
export interface RegistrationData {
  type: 'employee' | 'company';
  firstName?: string;
  lastName?: string;
  dni?: string;
  companyName?: string;
  companyNif?: string;
  province?: string;
  companyAddress?: string;
  zipCode?: string;
  country?: string;
  phone?: string;
  email: string;
  password: string;
  confirmPassword: string;
}
