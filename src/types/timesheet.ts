
export type TimesheetStatus = "active" | "paused" | "finished" | "not_started";

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  employeeName: string;
  startTime: Date | null;
  pauseTime: Date[];
  resumeTime: Date[];
  endTime: Date | null;
  signature: string | null;
  location: {
    startLocation: GeolocationPosition | null;
    endLocation: GeolocationPosition | null;
  };
  status: TimesheetStatus;
  date: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
}
