import { Request } from 'express';

export type Role = 'user' | 'admin';

/** Shape of the JWT payload we sign and later trust on protected routes. */
export interface JwtPayload {
  id: string;
  role: Role;
}

/** Express request enriched with the authenticated user after auth middleware. */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}
