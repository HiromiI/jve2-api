import {
  BadRequestException,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Repository } from 'typeorm';
import { Board } from '../boards/entities/board.entity';
import { Course } from '../courses/entities/course.entity';
import { EducationalLevel } from '../educational_levels/entities/educational_level.entity';
import { Institution } from '../institutions/entities/institution.entity';
import { Role } from '../roles/entities/role.entity';
import { Skill } from '../skills/entities/skill.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionsQueryDto } from './dto/list-questions-query.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionSkill } from './entities/question-skill.entity';
import { Question } from './entities/question.entity';
import type { QuestionImageFile } from './interfaces/question-image-file.interface';
import type { QuestionUploadedFiles } from './questions.controller';
import { QuestionsStorageService } from './questions-storage.service';

export interface SkillSummary {
  id: number;
  name: string;
}

export type PublicQuestion = Question & {
  skillIds: number[];
  skills: SkillSummary[];
};

type QuestionContentValidationDto = CreateQuestionDto &
  Partial<Pick<UpdateQuestionDto, 'removeAlternative1Image' | 'removeAlternative2Image' | 'removeAlternative3Image' | 'removeAlternative4Image' | 'removeAlternative5Image'>>;

@Injectable()
export class QuestionsService {
  constructor(
    @InjectRepository(Question)
    private readonly questionsRepository: Repository<Question>,
    @InjectRepository(QuestionSkill)
    private readonly questionSkillsRepository: Repository<QuestionSkill>,
    @InjectRepository(Subject)
    private readonly subjectsRepository: Repository<Subject>,
    @InjectRepository(Skill)
    private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Board)
    private readonly boardsRepository: Repository<Board>,
    @InjectRepository(Institution)
    private readonly institutionsRepository: Repository<Institution>,
    @InjectRepository(EducationalLevel)
    private readonly educationalLevelsRepository: Repository<EducationalLevel>,
    private readonly questionsStorageService: QuestionsStorageService,
  ) {}

  async create(
    courseId: number,
    subjectId: number,
    createQuestionDto: CreateQuestionDto,
    files: QuestionUploadedFiles,
  ) {
    const subject = await this.findActiveSubjectById(courseId, subjectId);

    await this.ensureRelatedEntitiesAreAvailable(createQuestionDto);
    await this.ensureSkillsAreAvailable(subject.id, createQuestionDto.skillIds ?? []);
    this.ensureAlternativeContentsAreValid(createQuestionDto, files);

    const question = this.questionsRepository.create({
      subjectId: subject.id,
      roleId: createQuestionDto.roleId,
      boardId: createQuestionDto.boardId,
      institutionId: createQuestionDto.institutionId,
      educationalLevelId: createQuestionDto.educationalLevelId,
      year: createQuestionDto.year,
      question: this.normalizeContent(createQuestionDto.question),
      image: null,
      alternative1: this.normalizeContent(createQuestionDto.alternative1),
      alternative1Image: null,
      alternative1Correct: this.resolveCorrectFlag(createQuestionDto.correctAlternative, 1),
      alternative2: this.normalizeContent(createQuestionDto.alternative2),
      alternative2Image: null,
      alternative2Correct: this.resolveCorrectFlag(createQuestionDto.correctAlternative, 2),
      alternative3: this.normalizeContent(createQuestionDto.alternative3),
      alternative3Image: null,
      alternative3Correct: this.resolveCorrectFlag(createQuestionDto.correctAlternative, 3),
      alternative4: this.normalizeContent(createQuestionDto.alternative4),
      alternative4Image: null,
      alternative4Correct: this.resolveCorrectFlag(createQuestionDto.correctAlternative, 4),
      alternative5: this.normalizeContent(createQuestionDto.alternative5),
      alternative5Image: null,
      alternative5Correct: this.resolveCorrectFlag(createQuestionDto.correctAlternative, 5),
    });

    const savedQuestion = await this.questionsRepository.save(question);

    try {
      await this.applyUploadedImages(courseId, subject.id, savedQuestion, files, createQuestionDto);
      await this.questionsRepository.save(savedQuestion);
      await this.syncQuestionSkills(savedQuestion.id, subject.id, createQuestionDto.skillIds ?? []);

      return this.toPublicQuestion(savedQuestion);
    } catch (error) {
      await this.questionsRepository.remove(savedQuestion);

      if (error instanceof Error) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao salvar a Questão.');
    }
  }

  async findAll(courseId: number, subjectId: number, query: ListQuestionsQueryDto) {
    await this.findActiveSubjectById(courseId, subjectId);

    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const questionsQueryBuilder = this.questionsRepository
      .createQueryBuilder('question')
      .where('question.subjectId = :subjectId', { subjectId })
      .andWhere('question.deletedAt IS NULL');

    if (query.roleId) {
      questionsQueryBuilder.andWhere('question.roleId = :roleId', { roleId: query.roleId });
    }

    if (query.boardId) {
      questionsQueryBuilder.andWhere('question.boardId = :boardId', { boardId: query.boardId });
    }

    if (query.institutionId) {
      questionsQueryBuilder.andWhere('question.institutionId = :institutionId', {
        institutionId: query.institutionId,
      });
    }

    if (query.educationalLevelId) {
      questionsQueryBuilder.andWhere('question.educationalLevelId = :educationalLevelId', {
        educationalLevelId: query.educationalLevelId,
      });
    }

    if (query.year) {
      questionsQueryBuilder.andWhere('question.year = :year', { year: query.year });
    }

    if (query.search) {
      const searchTerm = `%${query.search}%`;

      questionsQueryBuilder.andWhere(
        new Brackets((subQueryBuilder) => {
          subQueryBuilder
            .where('question.question LIKE :searchTerm', { searchTerm })
            .orWhere('question.alternative1 LIKE :searchTerm', { searchTerm })
            .orWhere('question.alternative2 LIKE :searchTerm', { searchTerm })
            .orWhere('question.alternative3 LIKE :searchTerm', { searchTerm })
            .orWhere('question.alternative4 LIKE :searchTerm', { searchTerm })
            .orWhere('question.alternative5 LIKE :searchTerm', { searchTerm });
        }),
      );
    }

    const [items, total] = await questionsQueryBuilder
      .orderBy('question.id', 'ASC')
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    const skillsByQuestionId = await this.loadSkillsByQuestionIds(items.map((item) => item.id));

    return {
      items: items.map((item) => this.buildPublicQuestion(item, skillsByQuestionId.get(item.id))),
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findById(courseId: number, subjectId: number, id: number) {
    await this.findActiveSubjectById(courseId, subjectId);

    const question = await this.findEntityById(subjectId, id);

    return this.toPublicQuestion(question);
  }

  async update(
    courseId: number,
    subjectId: number,
    id: number,
    updateQuestionDto: UpdateQuestionDto,
    files: QuestionUploadedFiles,
  ) {
    const subject = await this.findActiveSubjectById(courseId, subjectId);
    const question = await this.findEntityById(subject.id, id);

    await this.ensureRelatedEntitiesAreAvailable(updateQuestionDto);
    await this.ensureSkillsAreAvailable(subject.id, updateQuestionDto.skillIds ?? []);
    this.ensureAlternativeContentsAreValid(updateQuestionDto, files, question);

    question.roleId = updateQuestionDto.roleId;
    question.boardId = updateQuestionDto.boardId;
    question.institutionId = updateQuestionDto.institutionId;
    question.educationalLevelId = updateQuestionDto.educationalLevelId;
    question.year = updateQuestionDto.year;
    question.question = this.normalizeContent(updateQuestionDto.question);
    question.alternative1 = this.normalizeContent(updateQuestionDto.alternative1);
    question.alternative1Correct = this.resolveCorrectFlag(updateQuestionDto.correctAlternative, 1);
    question.alternative2 = this.normalizeContent(updateQuestionDto.alternative2);
    question.alternative2Correct = this.resolveCorrectFlag(updateQuestionDto.correctAlternative, 2);
    question.alternative3 = this.normalizeContent(updateQuestionDto.alternative3);
    question.alternative3Correct = this.resolveCorrectFlag(updateQuestionDto.correctAlternative, 3);
    question.alternative4 = this.normalizeContent(updateQuestionDto.alternative4);
    question.alternative4Correct = this.resolveCorrectFlag(updateQuestionDto.correctAlternative, 4);
    question.alternative5 = this.normalizeContent(updateQuestionDto.alternative5);
    question.alternative5Correct = this.resolveCorrectFlag(updateQuestionDto.correctAlternative, 5);

    await this.applyUploadedImages(courseId, subject.id, question, files, updateQuestionDto);
    const updatedQuestion = await this.questionsRepository.save(question);
    await this.syncQuestionSkills(updatedQuestion.id, subject.id, updateQuestionDto.skillIds ?? []);

    return this.toPublicQuestion(updatedQuestion);
  }

  async remove(courseId: number, subjectId: number, id: number) {
    await this.findActiveSubjectById(courseId, subjectId);

    const question = await this.findEntityById(subjectId, id);

    await this.syncQuestionSkills(question.id, subjectId, []);
    await this.questionsRepository.softRemove(question);

    return {
      message: 'Questão excluída com sucesso.',
    };
  }

  private async ensureRelatedEntitiesAreAvailable(dto: CreateQuestionDto | UpdateQuestionDto) {
    await Promise.all([
      this.findActiveRoleById(dto.roleId),
      this.findActiveBoardById(dto.boardId),
      this.findActiveInstitutionById(dto.institutionId),
      this.findActiveEducationalLevelById(dto.educationalLevelId),
    ]);
  }

  private async findActiveSubjectById(courseId: number, subjectId: number) {
    const course = await this.coursesRepository.findOne({
      where: {
        id: courseId,
        deletedAt: IsNull(),
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado.');
    }

    const subject = await this.subjectsRepository.findOne({
      where: {
        id: subjectId,
        courseId,
        deletedAt: IsNull(),
      },
    });

    if (!subject) {
      throw new NotFoundException('Disciplina não encontrada.');
    }

    return subject;
  }

  private async findEntityById(subjectId: number, id: number) {
    const question = await this.questionsRepository.findOne({
      where: {
        id,
        subjectId,
        deletedAt: IsNull(),
      },
    });

    if (!question) {
      throw new NotFoundException('Questão não encontrada.');
    }

    return question;
  }

  private async findActiveRoleById(id: number) {
    const role = await this.rolesRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });

    if (!role) {
      throw new NotFoundException('Cargo não encontrado.');
    }

    return role;
  }

  private async findActiveBoardById(id: number) {
    const board = await this.boardsRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });

    if (!board) {
      throw new NotFoundException('Banca não encontrada.');
    }

    return board;
  }

  private async findActiveInstitutionById(id: number) {
    const institution = await this.institutionsRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });

    if (!institution) {
      throw new NotFoundException('Instituição não encontrada.');
    }

    return institution;
  }

  private async findActiveEducationalLevelById(id: number) {
    const educationalLevel = await this.educationalLevelsRepository.findOne({
      where: {
        id,
        deletedAt: IsNull(),
      },
    });

    if (!educationalLevel) {
      throw new NotFoundException('Nível de Escolaridade não encontrado.');
    }

    return educationalLevel;
  }

  private resolveCorrectFlag(correctAlternative: number, alternativeNumber: number): 'Y' | 'N' {
    return correctAlternative === alternativeNumber ? 'Y' : 'N';
  }

  private normalizeContent(value?: string) {
    return value?.trim() ?? '';
  }

  private hasContent(value?: string, imageFile?: QuestionImageFile, existingImage?: string | null, removeImage?: boolean) {
    return Boolean(this.normalizeContent(value) || imageFile || (existingImage && !removeImage));
  }

  private ensureAlternativeContentsAreValid(
    dto: QuestionContentValidationDto,
    files: QuestionUploadedFiles | undefined,
    question?: Question,
  ) {
    const alternativeChecks = [
      {
        number: 1,
        value: dto.alternative1,
        imageFile: files?.alternative1Image?.[0],
        existingImage: question?.alternative1Image,
        removeImage: dto.removeAlternative1Image,
      },
      {
        number: 2,
        value: dto.alternative2,
        imageFile: files?.alternative2Image?.[0],
        existingImage: question?.alternative2Image,
        removeImage: dto.removeAlternative2Image,
      },
      {
        number: 3,
        value: dto.alternative3,
        imageFile: files?.alternative3Image?.[0],
        existingImage: question?.alternative3Image,
        removeImage: dto.removeAlternative3Image,
      },
      {
        number: 4,
        value: dto.alternative4,
        imageFile: files?.alternative4Image?.[0],
        existingImage: question?.alternative4Image,
        removeImage: dto.removeAlternative4Image,
      },
      {
        number: 5,
        value: dto.alternative5,
        imageFile: files?.alternative5Image?.[0],
        existingImage: question?.alternative5Image,
        removeImage: dto.removeAlternative5Image,
      },
    ] as const;

    alternativeChecks.forEach((alternative) => {
      if (this.hasContent(alternative.value, alternative.imageFile, alternative.existingImage, alternative.removeImage)) {
        return;
      }

      if (alternative.number === 5) {
        if (dto.correctAlternative === 5) {
          throw new BadRequestException('Insira o conteúdo da Alternativa 5.)');
        }

        return;
      }

      throw new BadRequestException(`Insira o conteúdo da Alternativa ${alternative.number}.`);
    });
  }

  private async applyUploadedImages(
    courseId: number,
    subjectId: number,
    question: Question,
    files: QuestionUploadedFiles | undefined,
    dto: Partial<UpdateQuestionDto>,
  ) {
    if (dto.removeImage) {
      question.image = null;
    }

    if (dto.removeAlternative1Image) {
      question.alternative1Image = null;
    }

    if (dto.removeAlternative2Image) {
      question.alternative2Image = null;
    }

    if (dto.removeAlternative3Image) {
      question.alternative3Image = null;
    }

    if (dto.removeAlternative4Image) {
      question.alternative4Image = null;
    }

    if (dto.removeAlternative5Image) {
      question.alternative5Image = null;
    }

    const imageFile = files?.image?.[0];
    const alternative1ImageFile = files?.alternative1Image?.[0];
    const alternative2ImageFile = files?.alternative2Image?.[0];
    const alternative3ImageFile = files?.alternative3Image?.[0];
    const alternative4ImageFile = files?.alternative4Image?.[0];
    const alternative5ImageFile = files?.alternative5Image?.[0];

    if (imageFile) {
      question.image = await this.questionsStorageService.uploadQuestionImage({
        courseId,
        subjectId,
        questionId: question.id,
        file: imageFile,
        fileNamePrefix: 'QuestionImage',
      });
    }

    if (alternative1ImageFile) {
      question.alternative1Image = await this.questionsStorageService.uploadQuestionImage({
        courseId,
        subjectId,
        questionId: question.id,
        file: alternative1ImageFile,
        fileNamePrefix: 'Alternative1Image',
        folderSuffix: 'Alternative1',
      });
    }

    if (alternative2ImageFile) {
      question.alternative2Image = await this.questionsStorageService.uploadQuestionImage({
        courseId,
        subjectId,
        questionId: question.id,
        file: alternative2ImageFile,
        fileNamePrefix: 'Alternative2Image',
        folderSuffix: 'Alternative2',
      });
    }

    if (alternative3ImageFile) {
      question.alternative3Image = await this.questionsStorageService.uploadQuestionImage({
        courseId,
        subjectId,
        questionId: question.id,
        file: alternative3ImageFile,
        fileNamePrefix: 'Alternative3Image',
        folderSuffix: 'Alternative3',
      });
    }

    if (alternative4ImageFile) {
      question.alternative4Image = await this.questionsStorageService.uploadQuestionImage({
        courseId,
        subjectId,
        questionId: question.id,
        file: alternative4ImageFile,
        fileNamePrefix: 'Alternative4Image',
        folderSuffix: 'Alternative4',
      });
    }

    if (alternative5ImageFile) {
      question.alternative5Image = await this.questionsStorageService.uploadQuestionImage({
        courseId,
        subjectId,
        questionId: question.id,
        file: alternative5ImageFile,
        fileNamePrefix: 'Alternative5Image',
        folderSuffix: 'Alternative5',
      });
    }
  }

  private async syncQuestionSkills(questionId: number, subjectId: number, skillIds: number[]) {
    const normalizedSkillIds = [...new Set(skillIds)];

    await this.ensureSkillsAreAvailable(subjectId, normalizedSkillIds);

    const existingRelations = await this.questionSkillsRepository.find({
      where: {
        questionId,
        deletedAt: IsNull(),
      },
    });
    const nextSkillIdSet = new Set(normalizedSkillIds);
    const relationsToClose = existingRelations.filter((relation) => !nextSkillIdSet.has(relation.skillId));
    const existingSkillIdSet = new Set(existingRelations.map((relation) => relation.skillId));
    const relationsToCreate = normalizedSkillIds
      .filter((skillId) => !existingSkillIdSet.has(skillId))
      .map((skillId) =>
        this.questionSkillsRepository.create({
          questionId,
          skillId,
        }),
      );

    if (relationsToClose.length > 0) {
      const deletedAt = new Date();

      relationsToClose.forEach((relation) => {
        relation.deletedAt = deletedAt;
      });

      await this.questionSkillsRepository.save(relationsToClose);
    }

    if (relationsToCreate.length > 0) {
      await this.questionSkillsRepository.save(relationsToCreate);
    }
  }

  private async ensureSkillsAreAvailable(subjectId: number, skillIds: number[]) {
    if (skillIds.length === 0) {
      return;
    }

    const skills = await this.skillsRepository
      .createQueryBuilder('skill')
      .select('skill.id', 'id')
      .innerJoin(Subject, 'subject', 'subject.id = skill.subjectId AND subject.deletedAt IS NULL')
      .innerJoin(Course, 'course', 'course.id = subject.courseId AND course.deletedAt IS NULL')
      .where('skill.id IN (:...skillIds)', { skillIds })
      .andWhere('skill.subjectId = :subjectId', { subjectId })
      .andWhere('skill.deletedAt IS NULL')
      .getRawMany<{ id: number | string }>();

    if (skills.length !== skillIds.length) {
      throw new NotFoundException('Uma ou mais Skills informadas não foram encontradas para a Disciplina.');
    }
  }

  private async toPublicQuestion(question: Question): Promise<PublicQuestion> {
    const skillsByQuestionId = await this.loadSkillsByQuestionIds([question.id]);

    return this.buildPublicQuestion(question, skillsByQuestionId.get(question.id));
  }

  private buildPublicQuestion(question: Question, skillData?: { skillIds: number[]; skills: SkillSummary[] }): PublicQuestion {
    return {
      ...question,
      skillIds: skillData?.skillIds ?? [],
      skills: skillData?.skills ?? [],
    };
  }

  private async loadSkillsByQuestionIds(questionIds: number[]) {
    const skillsByQuestionId = new Map<number, { skillIds: number[]; skills: SkillSummary[] }>(
      questionIds.map((questionId) => [questionId, { skillIds: [], skills: [] }]),
    );

    if (questionIds.length === 0) {
      return skillsByQuestionId;
    }

    const rows = await this.questionSkillsRepository
      .createQueryBuilder('questionSkill')
      .select('questionSkill.questionId', 'questionId')
      .addSelect('skill.id', 'skillId')
      .addSelect('skill.name', 'skillName')
      .innerJoin(Skill, 'skill', 'skill.id = questionSkill.skillId AND skill.deletedAt IS NULL')
      .innerJoin(Subject, 'subject', 'subject.id = skill.subjectId AND subject.deletedAt IS NULL')
      .innerJoin(Course, 'course', 'course.id = subject.courseId AND course.deletedAt IS NULL')
      .where('questionSkill.questionId IN (:...questionIds)', { questionIds })
      .andWhere('questionSkill.deletedAt IS NULL')
      .orderBy('skill.name', 'ASC')
      .getRawMany<{ questionId: number | string; skillId: number | string; skillName: string }>();

    rows.forEach((row) => {
      const questionId = Number(row.questionId);
      const skillId = Number(row.skillId);
      const currentValue = skillsByQuestionId.get(questionId);

      if (!currentValue) {
        return;
      }

      currentValue.skillIds.push(skillId);
      currentValue.skills.push({
        id: skillId,
        name: row.skillName,
      });
    });

    return skillsByQuestionId;
  }
}
