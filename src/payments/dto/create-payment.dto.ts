import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Length,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreatePaymentDto {
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  courseId: number;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Length(13, 19)
  @Matches(/^\d+$/)
  cardNumber: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  cardHolderName: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  @Matches(/^\d+$/)
  cardHolderDocument: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  @Matches(/^\d+$/)
  cardExpirationDate: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Length(3, 4)
  @Matches(/^\d+$/)
  cardSecurityCode: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Length(11, 11)
  @Matches(/^\d+$/)
  phone: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @Length(8, 8)
  @Matches(/^\d+$/)
  cep: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  number: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  neighborhood: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  city: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toUpperCase() : value))
  @IsString()
  @IsNotEmpty()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/)
  state: string;
}
