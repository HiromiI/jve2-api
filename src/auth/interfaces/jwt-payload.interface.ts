import { UserRole } from '../../users/entities/user-role.enum';

export interface JwtPayload {
  sub: number;
  email: string | null;
  role: UserRole;
  type?: 'refresh';
}
