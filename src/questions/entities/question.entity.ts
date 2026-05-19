import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Board } from '../../boards/entities/board.entity';
import { EducationalLevel } from '../../educational_levels/entities/educational_level.entity';
import { Institution } from '../../institutions/entities/institution.entity';
import { Role } from '../../roles/entities/role.entity';
import { Subject } from '../../subjects/entities/subject.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  subjectId: number;

  @ManyToOne(() => Subject, { nullable: false })
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;

  @Column({ type: 'int' })
  roleId: number;

  @ManyToOne(() => Role, { nullable: false })
  @JoinColumn({ name: 'roleId' })
  role: Role;

  @Column({ type: 'int' })
  boardId: number;

  @ManyToOne(() => Board, { nullable: false })
  @JoinColumn({ name: 'boardId' })
  board: Board;

  @Column({ type: 'int' })
  institutionId: number;

  @ManyToOne(() => Institution, { nullable: false })
  @JoinColumn({ name: 'institutionId' })
  institution: Institution;

  @Column({ type: 'int' })
  educationalLevelId: number;

  @ManyToOne(() => EducationalLevel, { nullable: false })
  @JoinColumn({ name: 'educationalLevelId' })
  educationalLevel: EducationalLevel;

  @Column({ type: 'int' })
  year: number;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  image: string | null;

  @Column({ type: 'text' })
  alternative1: string;

  @Column({ name: 'alternative1_image', type: 'varchar', length: 255, nullable: true })
  alternative1Image: string | null;

  @Column({ name: 'alternative1_correct', type: 'varchar', length: 1 })
  alternative1Correct: 'Y' | 'N';

  @Column({ type: 'text' })
  alternative2: string;

  @Column({ name: 'alternative2_image', type: 'varchar', length: 255, nullable: true })
  alternative2Image: string | null;

  @Column({ name: 'alternative2_correct', type: 'varchar', length: 1 })
  alternative2Correct: 'Y' | 'N';

  @Column({ type: 'text' })
  alternative3: string;

  @Column({ name: 'alternative3_image', type: 'varchar', length: 255, nullable: true })
  alternative3Image: string | null;

  @Column({ name: 'alternative3_correct', type: 'varchar', length: 1 })
  alternative3Correct: 'Y' | 'N';

  @Column({ type: 'text' })
  alternative4: string;

  @Column({ name: 'alternative4_image', type: 'varchar', length: 255, nullable: true })
  alternative4Image: string | null;

  @Column({ name: 'alternative4_correct', type: 'varchar', length: 1 })
  alternative4Correct: 'Y' | 'N';

  @Column({ type: 'text' })
  alternative5: string;

  @Column({ name: 'alternative5_image', type: 'varchar', length: 255, nullable: true })
  alternative5Image: string | null;

  @Column({ name: 'alternative5_correct', type: 'varchar', length: 1 })
  alternative5Correct: 'Y' | 'N';

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
