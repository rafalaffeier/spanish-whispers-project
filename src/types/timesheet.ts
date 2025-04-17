
export interface Employee {
  id: number;
  name: string;
  email?: string;
  avatar?: string;
  role: 'employee' | 'admin';
  // Nuevos campos para el perfil
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
