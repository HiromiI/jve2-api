import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Skill } from '../../skills/entities/skill.entity';
import { Question } from './question.entity';

@Entity('question_skills')
export class QuestionSkill {
  @PrimaryGeneratedColumn({ type: 'int' })
  id: number;

  @Column({ type: 'int' })
  questionId: number;

  @ManyToOne(() => Question, { nullable: false })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @Column({ type: 'int' })
  skillId: number;

  @ManyToOne(() => Skill, { nullable: false })
  @JoinColumn({ name: 'skillId' })
  skill: Skill;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @DeleteDateColumn({ type: 'datetime', nullable: true })
  deletedAt: Date | null;
}
