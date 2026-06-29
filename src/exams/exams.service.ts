import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { Question } from '../questions/entities/question.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { User } from '../users/entities/user.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { ListUserExamsQueryDto } from './dto/list-user-exams-query.dto';
import { ExamAnswer } from './entities/exam-answer.entity';
import { Exam } from './entities/exam.entity';

const SUBJECT_QUESTION_COUNTS = [
  { name: 'Matemática', amount: 15 },
  { name: 'Português', amount: 15 },
  { name: 'Ciências Naturais', amount: 10 },
  { name: 'Ciências Humanas', amount: 10 },
] as const;

type ExamAnswerAlternativeKey =
  | 'alternative1'
  | 'alternative2'
  | 'alternative3'
  | 'alternative4'
  | 'alternative5';

type ExamAnswerQuestionResponse = {
  id: number;
  subjectId: number;
  subjectName: string;
  year: number;
  question: string;
  image: string | null;
  alternative1: string;
  alternative1Image: string | null;
  alternative2: string;
  alternative2Image: string | null;
  alternative3: string;
  alternative3Image: string | null;
  alternative4: string;
  alternative4Image: string | null;
  alternative5: string;
  alternative5Image: string | null;
};

type ExamAnswerResponse = {
  id: number;
  examId: number;
  questionId: number;
  answeredAt: Date | null;
  answer: ExamAnswerAlternativeKey | null;
  result: 'Correct' | 'Incorrect' | null;
  question: ExamAnswerQuestionResponse;
};

type ExamAnswersResponse = {
  id: number;
  courseId: number;
  startedAt: Date;
  completedAt: Date | null;
  totalAnswers: number;
  answers: ExamAnswerResponse[];
};

type FinishExamResponse = {
  id: number;
  completedAt: Date;
};

type ExamResultSubjectResponse = {
  subjectId: number;
  subjectName: string;
  correctAnswers: number;
  totalAnswers: number;
  percentage: number;
};

type ExamResultResponse = {
  id: number;
  courseId: number;
  startedAt: Date;
  completedAt: Date;
  totalAnswers: number;
  correctAnswers: number;
  percentage: number;
  topPercentage: number;
  subjects: ExamResultSubjectResponse[];
};

type ExamCourseScoreResponse = {
  examId: number;
  userId: number;
  totalAnswers: number;
  correctAnswers: number;
  percentage: number;
  completedAt: Date;
};

type CreateExamResponse = {
  id: number;
  courseId: number;
  startedAt: Date;
  totalAnswers: number;
};

type UserExamQueryRow = {
  id: string;
  courseId: string;
  courseName: string;
  startedAt: Date | string;
  completedAt: Date | string;
  totalAnswers: string;
  correctAnswers: string;
  percentage: string;
  durationMinutes: string;
};

type UserExamListItem = {
  id: number;
  courseId: number;
  courseName: string;
  startedAt: string;
  completedAt: string;
  totalAnswers: number;
  correctAnswers: number;
  percentage: number;
  durationMinutes: number;
};

type UserExamListResponse = {
  items: UserExamListItem[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
};

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private readonly examsRepository: Repository<Exam>,
    @InjectRepository(ExamAnswer)
    private readonly examAnswersRepository: Repository<ExamAnswer>,
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    @InjectRepository(Subject)
    private readonly subjectsRepository: Repository<Subject>,
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  async create(userId: number, createExamDto: CreateExamDto): Promise<CreateExamResponse> {
    const [course, user] = await Promise.all([
      this.findActiveCourseById(createExamDto.courseId),
      this.findActiveUserById(userId),
    ]);

    const subjectIdsByName = await this.loadSubjectIdsByName(course.id);
    const exam = await this.dataSource.transaction(async (manager) => {
      const examRepository = manager.getRepository(Exam);
      const examAnswerRepository = manager.getRepository(ExamAnswer);
      const questionRepository = manager.getRepository(Question);

      const savedExam = await examRepository.save(
        examRepository.create({
          courseId: course.id,
          userId: user.id,
          completedAt: null,
        }),
      );

      const selectedQuestionIds: number[] = [];

      for (const item of SUBJECT_QUESTION_COUNTS) {
        const subjectId = subjectIdsByName.get(item.name);

        if (!subjectId) {
          throw new NotFoundException(`Disciplina ${item.name} não encontrada para o curso.`);
        }

        const questions = await questionRepository
          .createQueryBuilder('question')
          .select('question.id', 'id')
          .where('question.subjectId = :subjectId', { subjectId })
          .andWhere('question.deletedAt IS NULL')
          .orderBy('RAND()')
          .take(item.amount)
          .getRawMany<{ id: number | string }>();

        if (questions.length < item.amount) {
          throw new BadRequestException(`Quantidade insuficiente de questões na disciplina ${item.name}.`);
        }

        selectedQuestionIds.push(...questions.map((question) => Number(question.id)));
      }

      const examAnswers = selectedQuestionIds.map((questionId) =>
        examAnswerRepository.create({
          examId: savedExam.id,
          questionId,
          answeredAt: null,
          answer: null,
          result: null,
        }),
      );

      await examAnswerRepository.save(examAnswers);

      return savedExam;
    });

    return {
      id: exam.id,
      courseId: exam.courseId,
      startedAt: exam.startedAt,
      totalAnswers: 50,
    };
  }

  async findUserExams(userId: number, query: ListUserExamsQueryDto): Promise<UserExamListResponse> {
    const limit = query.limit ?? 5;
    const offset = query.offset ?? 0;
    const percentageExpression =
      'CASE WHEN COUNT(answer.id) = 0 THEN 0 ELSE ROUND((SUM(CASE WHEN answer.result = \'Correct\' THEN 1 ELSE 0 END) * 100.0) / COUNT(answer.id), 2) END';
    const queryBuilder = this.examsRepository
      .createQueryBuilder('exam')
      .innerJoin('exam.course', 'course')
      .leftJoin('exam.answers', 'answer')
      .select('exam.id', 'id')
      .addSelect('exam.courseId', 'courseId')
      .addSelect('course.name', 'courseName')
      .addSelect('exam.startedAt', 'startedAt')
      .addSelect('exam.completedAt', 'completedAt')
      .addSelect('COUNT(answer.id)', 'totalAnswers')
      .addSelect("SUM(CASE WHEN answer.result = 'Correct' THEN 1 ELSE 0 END)", 'correctAnswers')
      .addSelect(percentageExpression, 'percentage')
      .addSelect('TIMESTAMPDIFF(MINUTE, exam.startedAt, exam.completedAt)', 'durationMinutes')
      .where('exam.userId = :userId', { userId })
      .andWhere('exam.deletedAt IS NULL')
      .andWhere('exam.completedAt IS NOT NULL')
      .groupBy('exam.id')
      .addGroupBy('exam.courseId')
      .addGroupBy('course.name')
      .addGroupBy('exam.startedAt')
      .addGroupBy('exam.completedAt');

    if (query.courseId) {
      queryBuilder.andWhere('exam.courseId = :courseId', { courseId: query.courseId });
    }

    if (query.startDate) {
      queryBuilder.andWhere('DATE(exam.startedAt) >= :startDate', { startDate: query.startDate });
    }

    if (query.endDate) {
      queryBuilder.andWhere('DATE(exam.startedAt) <= :endDate', { endDate: query.endDate });
    }

    if (query.percentageComparison && typeof query.percentageValue === 'number') {
      const operatorByComparison: Record<NonNullable<ListUserExamsQueryDto['percentageComparison']>, string> = {
        greater: '>',
        less: '<',
        equal: '=',
      };

      queryBuilder.having(`${percentageExpression} ${operatorByComparison[query.percentageComparison]} :percentageValue`, {
        percentageValue: query.percentageValue,
      });
    }

    const totalRow = await this.dataSource
      .createQueryBuilder()
      .select('COUNT(*)', 'total')
      .from(`(${queryBuilder.getQuery()})`, 'user_exams')
      .setParameters(queryBuilder.getParameters())
      .getRawOne<{ total: string }>();

    const items = await queryBuilder
      .clone()
      .orderBy('exam.completedAt', 'DESC')
      .addOrderBy('exam.id', 'DESC')
      .take(limit)
      .skip(offset)
      .getRawMany<UserExamQueryRow>();

    const mappedItems = items.map((item) => ({
      id: Number(item.id),
      courseId: Number(item.courseId),
      courseName: item.courseName,
      startedAt: new Date(item.startedAt).toISOString(),
      completedAt: new Date(item.completedAt).toISOString(),
      totalAnswers: Number(item.totalAnswers),
      correctAnswers: Number(item.correctAnswers),
      percentage: Number(item.percentage),
      durationMinutes: Number(item.durationMinutes),
    }));

    const total = Number(totalRow?.total ?? 0);

    return {
      items: mappedItems,
      total,
      limit,
      offset,
      hasMore: offset + mappedItems.length < total,
    };
  }

  async findAnswers(userId: number, examId: number): Promise<ExamAnswersResponse> {
    const exam = await this.findActiveExamById(userId, examId);
    const answers = await this.examAnswersRepository.find({
      where: {
        examId: exam.id,
      },
      relations: {
        question: {
          subject: true,
        },
      },
      order: {
        id: 'ASC',
      },
    });

    return {
      id: exam.id,
      courseId: exam.courseId,
      startedAt: exam.startedAt,
      completedAt: exam.completedAt,
      totalAnswers: answers.length,
      answers: answers.map((answer) => this.mapExamAnswerResponse(answer)),
    };
  }

  async updateAnswer(userId: number, examId: number, answerId: number, answer: ExamAnswerAlternativeKey) {
    const exam = await this.findActiveExamById(userId, examId);
    const examAnswer = await this.examAnswersRepository.findOne({
      where: {
        id: answerId,
        examId: exam.id,
      },
      relations: {
        question: {
          subject: true,
        },
      },
    });

    if (!examAnswer) {
      throw new NotFoundException('Resposta do simulado não encontrada.');
    }

    if (examAnswer.answer !== answer) {
      examAnswer.answeredAt = new Date();
      examAnswer.answer = answer;
      examAnswer.result = this.resolveAnswerResult(examAnswer.question, answer);

      await this.examAnswersRepository.save(examAnswer);
    }

    return this.mapExamAnswerResponse(examAnswer);
  }

  async finish(userId: number, examId: number): Promise<FinishExamResponse> {
    const exam = await this.findActiveExamById(userId, examId);
    const answers = await this.examAnswersRepository.find({
      where: {
        examId: exam.id,
      },
      select: {
        id: true,
        answer: true,
      },
      order: {
        id: 'ASC',
      },
    });
    const pendingAnswers = answers
      .map((answer, index) => (answer.answer ? null : index + 1))
      .filter((value): value is number => value !== null);

    if (pendingAnswers.length > 0) {
      throw new BadRequestException(
        `Finalize todas as questões antes de finalizar o simulado. Questões pendentes: ${pendingAnswers.join(', ')}`,
      );
    }

    const completedAt = new Date();
    exam.completedAt = completedAt;
    await this.examsRepository.save(exam);

    return {
      id: exam.id,
      completedAt,
    };
  }

  async getResult(userId: number, examId: number): Promise<ExamResultResponse> {
    const exam = await this.findActiveExamById(userId, examId);
    const answers = await this.examAnswersRepository.find({
      where: {
        examId: exam.id,
      },
      relations: {
        question: {
          subject: true,
        },
      },
      order: {
        id: 'ASC',
      },
    });

    const totalAnswers = answers.length;
    const correctAnswers = answers.filter((answer) => answer.result === 'Correct').length;
    const percentage = totalAnswers > 0 ? Number(((correctAnswers / totalAnswers) * 100).toFixed(2)) : 0;
    const subjectStats = this.buildSubjectStats(answers);
    const examScores = await this.loadExamScoresByCourseId(exam.courseId);
    const currentScore = percentage;
    const bestScoreByUser = new Map<number, ExamCourseScoreResponse>();

    examScores.forEach((score) => {
      const currentBestScore = bestScoreByUser.get(score.userId);

      if (!currentBestScore) {
        bestScoreByUser.set(score.userId, score);
        return;
      }

      if (score.percentage > currentBestScore.percentage) {
        bestScoreByUser.set(score.userId, score);
        return;
      }

      if (score.percentage < currentBestScore.percentage) {
        return;
      }

      if (score.correctAnswers > currentBestScore.correctAnswers) {
        bestScoreByUser.set(score.userId, score);
        return;
      }

      if (score.correctAnswers < currentBestScore.correctAnswers) {
        return;
      }

      if (score.completedAt > currentBestScore.completedAt) {
        bestScoreByUser.set(score.userId, score);
      }
    });

    const orderedScores = [...bestScoreByUser.values()].sort((left, right) => {
      if (right.percentage !== left.percentage) {
        return right.percentage - left.percentage;
      }

      if (right.correctAnswers !== left.correctAnswers) {
        return right.correctAnswers - left.correctAnswers;
      }

      if (right.completedAt.getTime() !== left.completedAt.getTime()) {
        return right.completedAt.getTime() - left.completedAt.getTime();
      }

      return left.examId - right.examId;
    });
    const currentRank = Math.max(
      1,
      orderedScores.findIndex((item) => item.userId === exam.userId) + 1,
    );
    const topPercentage = orderedScores.length > 0 ? Math.max(1, Math.ceil((currentRank / orderedScores.length) * 100)) : 100;

    return {
      id: exam.id,
      courseId: exam.courseId,
      startedAt: exam.startedAt,
      completedAt: exam.completedAt ?? new Date(),
      totalAnswers,
      correctAnswers,
      percentage: currentScore,
      topPercentage,
      subjects: subjectStats,
    };
  }

  private async findActiveCourseById(id: number) {
    const course = await this.coursesRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado.');
    }

    return course;
  }

  private async findActiveUserById(id: number) {
    const user = await this.usersRepository.findOne({
      where: {
        id,
        active: true,
        deletedAt: IsNull(),
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  private async findActiveExamById(userId: number, id: number) {
    const exam = await this.examsRepository.findOne({
      where: {
        id,
        userId,
        deletedAt: IsNull(),
      },
    });

    if (!exam) {
      throw new NotFoundException('Simulado não encontrado.');
    }

    return exam;
  }

  private async loadSubjectIdsByName(courseId: number) {
    const subjects = await this.subjectsRepository.find({
      where: {
        courseId,
        deletedAt: IsNull(),
        name: In(SUBJECT_QUESTION_COUNTS.map((item) => item.name)),
      },
    });

    const subjectIdsByName = new Map<string, number>();

    subjects.forEach((subject) => {
      subjectIdsByName.set(subject.name, subject.id);
    });

    for (const item of SUBJECT_QUESTION_COUNTS) {
      if (!subjectIdsByName.has(item.name)) {
        throw new NotFoundException(`Disciplina ${item.name} não encontrada para o curso.`);
      }
    }

    return subjectIdsByName;
  }

  private mapExamAnswerResponse(answer: ExamAnswer): ExamAnswerResponse {
    return {
      id: answer.id,
      examId: answer.examId,
      questionId: answer.questionId,
      answeredAt: answer.answeredAt,
      answer: answer.answer as ExamAnswerAlternativeKey | null,
      result: answer.result,
      question: {
        id: answer.question.id,
        subjectId: answer.question.subjectId,
        subjectName: answer.question.subject?.name ?? '',
        year: answer.question.year,
        question: answer.question.question,
        image: answer.question.image,
        alternative1: answer.question.alternative1,
        alternative1Image: answer.question.alternative1Image,
        alternative2: answer.question.alternative2,
        alternative2Image: answer.question.alternative2Image,
        alternative3: answer.question.alternative3,
        alternative3Image: answer.question.alternative3Image,
        alternative4: answer.question.alternative4,
        alternative4Image: answer.question.alternative4Image,
        alternative5: answer.question.alternative5,
        alternative5Image: answer.question.alternative5Image,
      },
    };
  }

  private resolveAnswerResult(question: Question, answer: ExamAnswerAlternativeKey): 'Correct' | 'Incorrect' {
    const correctFlagByAnswer: Record<ExamAnswerAlternativeKey, 'Y' | 'N'> = {
      alternative1: question.alternative1Correct,
      alternative2: question.alternative2Correct,
      alternative3: question.alternative3Correct,
      alternative4: question.alternative4Correct,
      alternative5: question.alternative5Correct,
    };

    return correctFlagByAnswer[answer] === 'Y' ? 'Correct' : 'Incorrect';
  }

  private buildSubjectStats(answers: ExamAnswer[]) {
    const groupedBySubjectId = new Map<
      number,
      {
        subjectName: string;
        correctAnswers: number;
        totalAnswers: number;
      }
    >();

    answers.forEach((answer) => {
      const subjectId = answer.question.subjectId;
      const currentValue = groupedBySubjectId.get(subjectId);

      if (!currentValue) {
        groupedBySubjectId.set(subjectId, {
          subjectName: answer.question.subject?.name ?? '',
          correctAnswers: answer.result === 'Correct' ? 1 : 0,
          totalAnswers: 1,
        });
        return;
      }

      currentValue.correctAnswers += answer.result === 'Correct' ? 1 : 0;
      currentValue.totalAnswers += 1;
    });

    return [...groupedBySubjectId.entries()]
      .map(([subjectId, value]) => ({
        subjectId,
        subjectName: value.subjectName,
        correctAnswers: value.correctAnswers,
        totalAnswers: value.totalAnswers,
        percentage: value.totalAnswers > 0 ? Number(((value.correctAnswers / value.totalAnswers) * 100).toFixed(2)) : 0,
      }))
      .sort((left, right) => left.subjectName.localeCompare(right.subjectName, 'pt-BR'));
  }

  private async loadExamScoresByCourseId(courseId: number) {
    const rows = await this.examsRepository
      .createQueryBuilder('exam')
      .leftJoin('exam.answers', 'answer')
      .select('exam.id', 'examId')
      .addSelect('exam.userId', 'userId')
      .addSelect('exam.completedAt', 'completedAt')
      .addSelect('COUNT(answer.id)', 'totalAnswers')
      .addSelect("SUM(CASE WHEN answer.result = 'Correct' THEN 1 ELSE 0 END)", 'correctAnswers')
      .where('exam.courseId = :courseId', { courseId })
      .andWhere('exam.deletedAt IS NULL')
      .andWhere('exam.completedAt IS NOT NULL')
      .groupBy('exam.id')
      .addGroupBy('exam.userId')
      .addGroupBy('exam.completedAt')
      .getRawMany<{ examId: string; userId: string; completedAt: string; totalAnswers: string; correctAnswers: string }>();

    return rows.map((row) => {
      const totalAnswers = Number(row.totalAnswers);
      const correctAnswers = Number(row.correctAnswers);

      return {
        examId: Number(row.examId),
        userId: Number(row.userId),
        completedAt: new Date(row.completedAt),
        totalAnswers,
        correctAnswers,
        percentage: totalAnswers > 0 ? Number(((correctAnswers / totalAnswers) * 100).toFixed(2)) : 0,
      };
    });
  }
}
