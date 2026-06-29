import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Exam } from './exam.entity';
import { Question } from '../../questions/entities/question.entity';

@Entity('exams_answers')
export class ExamAnswer {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  examId: number;

  @ManyToOne(() => Exam, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'examId' })
  exam: Exam;

  @Column({ type: 'int' })
  questionId: number;

  @ManyToOne(() => Question, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @Column({ type: 'datetime', nullable: true })
  answeredAt: Date | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  answer: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  result: 'Correct' | 'Incorrect' | null;
}
