export type AuthView = "signin" | "signup" | "otp" | "tutorial" | "choosePlan" | "payment" | "firstDevice" | "complete";
export type SignupSubStep = "type" | "details";
export type AcctType = "individual" | "organization";
export type OtpFrom = "signin" | "signup";
export type PayMethod = "upi" | "card";

export interface DeviceFormState {
  deviceId: string;
  vehicleReg: string;
  chassisNo: string;
}

export interface FlowState {
  authView: AuthView;
  loginEmail: string;
  loginPassword: string;
  signupStep: SignupSubStep;
  acctType: AcctType;
  signupName: string;
  signupGstin: string;
  signupPan: string;
  signupContactName: string;
  signupContactPhone: string;
  signupAddress: string;
  signupEmail: string;
  signupPassword: string;
  captchaCode: string;
  captchaInput: string;
  otpCode: string;
  otpInput: string;
  otpFrom: OtpFrom;
  tutStep: number;
  calcDeviceCount: number;
  addons: Record<string, boolean>;
  payMethod: PayMethod;
  upiId: string;
  paying: boolean;
  deviceForm: DeviceFormState;
}

export type UpdateFlow = (patch: Partial<FlowState>) => void;
