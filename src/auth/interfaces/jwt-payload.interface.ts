export interface JwtPayload {
  sub: string;
  documentNumber: string;
  role: string;
  iat?: number;
  exp?: number;
}
