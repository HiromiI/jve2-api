import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
