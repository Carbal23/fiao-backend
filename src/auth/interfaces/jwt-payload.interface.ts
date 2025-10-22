export interface IJwtPayload {
  sub: string;
  documentNumber: string;
  role: string;
  iat?: number;
  exp?: number;
}
