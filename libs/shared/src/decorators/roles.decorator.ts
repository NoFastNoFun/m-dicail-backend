import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@features/users/entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]): ReturnType<typeof SetMetadata> => SetMetadata(ROLES_KEY, roles);
