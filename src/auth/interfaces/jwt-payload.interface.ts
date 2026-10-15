export interface IJwtPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}
