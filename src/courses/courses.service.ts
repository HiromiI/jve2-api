import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, IsNull, Repository } from 'typeorm';
import { CreateCourseDto } from './dto/create-course.dto';
import { ListCoursesQueryDto } from './dto/list-courses-query.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Course } from './entities/course.entity';
import { CourseImageFile } from './interfaces/course-image-file.interface';
import { CoursesStorageService } from './courses-storage.service';
import { Exam } from '../exams/entities/exam.entity';
import { Payment } from '../payments/entities/payment.entity';

type UserCourseQueryRow = {
  id: number | string;
  name: string;
  description: string | null;
  image: string | null;
  price: string | number | null;
  paymentId: number | string;
  paymentCreatedAt: Date | string;
};

type UserExamCourseQueryRow = {
  id: number | string;
  name: string;
};

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
    @InjectRepository(Payment)
    private readonly paymentsRepository: Repository<Payment>,
    @InjectRepository(Exam)
    private readonly examsRepository: Repository<Exam>,
    private readonly coursesStorageService: CoursesStorageService,
  ) {}

  async create(createCourseDto: CreateCourseDto, imageFile?: CourseImageFile) {
    await this.ensureCourseNameIsAvailable(createCourseDto.name);

    const course = this.coursesRepository.create({
      name: createCourseDto.name.trim(),
      description: createCourseDto.description?.trim() ?? null,
      image: null,
      planCode: createCourseDto.planCode?.trim() ?? null,
      price: createCourseDto.price?.trim() ?? null,
    });

    const savedCourse = await this.coursesRepository.save(course);

    if (!imageFile) {
      return savedCourse;
    }

    try {
      savedCourse.image = await this.coursesStorageService.uploadCourseImage({
        courseId: savedCourse.id,
        courseName: savedCourse.name,
        file: imageFile,
      });

      return await this.coursesRepository.save(savedCourse);
    } catch (error) {
      await this.coursesRepository.remove(savedCourse);

      if (error instanceof Error) {
        throw error;
      }

      throw new InternalServerErrorException('Erro ao salvar o banner do Curso.');
    }
  }

  async findAll(query: ListCoursesQueryDto) {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const [items, total] = await this.coursesRepository.findAndCount({
      order: {
        name: 'ASC',
      },
      take: limit,
      skip: offset,
    });

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findStoreCourses(query: ListCoursesQueryDto, userId: number) {
    const limit = query.limit ?? 5;
    const offset = query.offset ?? 0;
    const queryBuilder = this.coursesRepository
      .createQueryBuilder('course')
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('payment.courseId', 'courseId')
            .from(this.paymentsRepository.target, 'payment')
            .where('payment.userId = :userId', { userId })
            .andWhere("payment.active = 'Y'"),
        'active_payment',
        'active_payment.courseId = course.id',
      )
      .where('course.deletedAt IS NULL')
      .andWhere('course.planCode IS NOT NULL')
      .andWhere("TRIM(course.planCode) <> ''")
      .andWhere('course.price IS NOT NULL')
      .andWhere('active_payment.courseId IS NULL');

    const total = await queryBuilder.getCount();
    const items = await queryBuilder.orderBy('course.name', 'ASC').take(limit).skip(offset).getMany();

    return {
      items,
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findUserCourses(query: ListCoursesQueryDto, userId: number) {
    const limit = query.limit ?? 5;
    const offset = query.offset ?? 0;
    const queryBuilder = this.coursesRepository
      .createQueryBuilder('course')
      .distinct(true)
      .innerJoin(
        Payment,
        'payment',
        "payment.courseId = course.id AND payment.userId = :userId AND payment.active = 'Y'",
        { userId },
      )
      .where('course.deletedAt IS NULL')
      .andWhere('course.planCode IS NOT NULL')
      .andWhere("TRIM(course.planCode) <> ''")
      .andWhere('course.price IS NOT NULL')
      .andWhere('payment.deletedAt IS NULL');

    const total = await queryBuilder.clone().getCount();
    const items = await queryBuilder
      .clone()
      .select('course.id', 'id')
      .addSelect('course.name', 'name')
      .addSelect('course.description', 'description')
      .addSelect('course.image', 'image')
      .addSelect('course.price', 'price')
      .addSelect('payment.id', 'paymentId')
      .addSelect('payment.createdAt', 'paymentCreatedAt')
      .orderBy('course.name', 'ASC')
      .take(limit)
      .skip(offset)
      .getRawMany<UserCourseQueryRow>();

    return {
      items: items.map((item) => ({
        id: Number(item.id),
        name: item.name,
        description: item.description,
        image: item.image,
        price: item.price === null ? null : String(item.price),
        paymentId: Number(item.paymentId),
        paymentCreatedAt: item.paymentCreatedAt,
      })),
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findUserExamCourses(query: ListCoursesQueryDto, userId: number) {
    const limit = query.limit ?? 5;
    const offset = query.offset ?? 0;
    const queryBuilder = this.coursesRepository
      .createQueryBuilder('course')
      .distinct(true)
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('payment.courseId', 'courseId')
            .from(this.paymentsRepository.target, 'payment')
            .where('payment.userId = :userId', { userId })
            .andWhere("payment.active = 'Y'")
            .andWhere('payment.deletedAt IS NULL')
            .groupBy('payment.courseId'),
        'active_payment',
        'active_payment.courseId = course.id',
      )
      .leftJoin(
        (subQuery) =>
          subQuery
            .select('exam.courseId', 'courseId')
            .from(this.examsRepository.target, 'exam')
            .where('exam.userId = :userId', { userId })
            .andWhere('exam.deletedAt IS NULL')
            .andWhere('exam.completedAt IS NOT NULL')
            .groupBy('exam.courseId'),
        'completed_exam',
        'completed_exam.courseId = course.id',
      )
      .where('course.planCode IS NOT NULL')
      .andWhere("TRIM(course.planCode) <> ''")
      .andWhere('course.price IS NOT NULL')
      .andWhere(
        new Brackets((qb) => {
          qb.where('active_payment.courseId IS NOT NULL').orWhere('completed_exam.courseId IS NOT NULL');
        }),
      );

    const total = await queryBuilder.clone().getCount();
    const items = await queryBuilder
      .clone()
      .select('course.id', 'id')
      .addSelect('course.name', 'name')
      .orderBy('course.name', 'ASC')
      .take(limit)
      .skip(offset)
      .getRawMany<UserExamCourseQueryRow>();

    return {
      items: items.map((item) => ({
        id: Number(item.id),
        name: item.name,
      })),
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findById(id: number) {
    return this.findEntityById(id);
  }

  async update(id: number, updateCourseDto: UpdateCourseDto, imageFile?: CourseImageFile) {
    const course = await this.findEntityById(id);

    await this.ensureCourseNameIsAvailable(updateCourseDto.name, id);

    const nextName = updateCourseDto.name.trim();
    const nextDescription = updateCourseDto.description?.trim() ?? null;
    const nextPlanCode = updateCourseDto.planCode?.trim() ?? null;
    const nextPrice = updateCourseDto.price?.trim() ?? null;
    const nextImage = imageFile
      ? await this.coursesStorageService.uploadCourseImage({
          courseId: course.id,
          courseName: nextName,
          file: imageFile,
        })
      : updateCourseDto.removeImage
        ? null
        : course.image;

    course.name = nextName;
    course.description = nextDescription;
    course.planCode = nextPlanCode;
    course.price = nextPrice;
    course.image = nextImage;

    return this.coursesRepository.save(course);
  }

  async remove(id: number) {
    const course = await this.findEntityById(id);

    await this.coursesRepository.softRemove(course);

    return {
      message: 'Curso excluído com sucesso.',
    };
  }

  private async ensureCourseNameIsAvailable(name: string, currentCourseId?: number) {
    const normalizedName = name.trim().toLowerCase();
    const existingCourse = await this.coursesRepository
      .createQueryBuilder('course')
      .where('LOWER(course.name) = :normalizedName', { normalizedName })
      .andWhere('course.deletedAt IS NULL')
      .getOne();

    if (existingCourse && existingCourse.id !== currentCourseId) {
      throw new ConflictException('Curso já cadastrado.');
    }
  }

  private async findEntityById(id: number) {
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
}
