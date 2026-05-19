import { Transform } from 'class-transformer';
import {
  ArrayUnique,
  IsBoolean,
  IsInt,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '../entities/user-role.enum';

export class CreateUserDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(72)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).+$/)
  password: string;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((item) => Number(item))
      : value === undefined || value === null || value === ''
        ? []
        : [Number(value)],
  )
  @IsInt({ each: true })
  @Min(1, { each: true })
  subjectIds?: number[];
}
