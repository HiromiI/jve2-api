import { IsIn } from 'class-validator';

const EXAM_ANSWER_ALTERNATIVES = [
  'alternative1',
  'alternative2',
  'alternative3',
  'alternative4',
  'alternative5',
] as const;

export class UpdateExamAnswerDto {
  @IsIn(EXAM_ANSWER_ALTERNATIVES)
  answer!: (typeof EXAM_ANSWER_ALTERNATIVES)[number];
}
