export interface PatientFormData {
  age: string;
  systolicBP: string;
  diastolicBP: string;
  bloodGlucose: string;
  bodyTemperature: string;
  heartRate: string;
}

export const initialPatientForm: PatientFormData = {
  age: "31",
  systolicBP: "146",
  diastolicBP: "94",
  bloodGlucose: "7.8",
  bodyTemperature: "100.1",
  heartRate: "88",
};
