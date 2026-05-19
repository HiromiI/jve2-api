import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { IsNull, Repository } from 'typeorm';
import { Course } from '../courses/entities/course.entity';
import { Subject } from '../subjects/entities/subject.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './entities/user-role.enum';
import { UserSubject } from './entities/user-subject.entity';
import { User } from './entities/user.entity';

type PublicUser = Omit<User, 'password'> & {
  subjectIds: number[];
};

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(UserSubject)
    private readonly userSubjectsRepository: Repository<UserSubject>,
    @InjectRepository(Subject)
    private readonly subjectsRepository: Repository<Subject>,
    @InjectRepository(Course)
    private readonly coursesRepository: Repository<Course>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
      withDeleted: true,
    });

    if (existingUser) {
      throw new ConflictException('E-mail já cadastrado para outro Usuário.');
    }

    const password = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      name: createUserDto.name,
      email: createUserDto.email,
      password,
      active: createUserDto.active ?? true,
      role: createUserDto.role,
    });
    const savedUser = await this.usersRepository.save(user);

    await this.syncUserSubjects(
      savedUser.id,
      createUserDto.role === UserRole.PROFESSOR ? createUserDto.subjectIds ?? [] : [],
    );

    return this.toPublicUser(savedUser);
  }

  async findAll(query: ListUsersQueryDto) {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const [items, total] = await this.usersRepository.findAndCount({
      where: {
        active: true,
      },
      order: {
        name: 'ASC',
      },
      take: limit,
      skip: offset,
    });

    const subjectIdsByUserId = await this.loadActiveSubjectIdsByUserIds(items.map((user) => user.id));

    return {
      items: items.map((user) => this.buildPublicUser(user, subjectIdsByUserId.get(user.id) ?? [])),
      total,
      limit,
      offset,
      hasMore: offset + items.length < total,
    };
  }

  async findById(id: number) {
    const user = await this.findActiveEntityById(id);

    return this.toPublicUser(user);
  }

  async update(id: number, updateUserDto: UpdateUserDto, authenticatedUserId: number) {
    const user = await this.findActiveEntityById(id);

    const existingUserWithEmail = await this.usersRepository.findOne({
      where: { email: updateUserDto.email },
      withDeleted: true,
    });

    if (existingUserWithEmail && existingUserWithEmail.id !== id) {
      throw new ConflictException('E-mail já cadastrado para outro Usuário.');
    }

    const isEditingOwnUser = id === authenticatedUserId;

    if (!isEditingOwnUser && updateUserDto.password) {
      throw new ForbiddenException('Somente o próprio usuário pode alterar a senha.');
    }

    user.name = updateUserDto.name;
    user.email = updateUserDto.email;
    user.role = updateUserDto.role;

    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const updatedUser = await this.usersRepository.save(user);

    await this.syncUserSubjects(
      updatedUser.id,
      updateUserDto.role === UserRole.PROFESSOR ? updateUserDto.subjectIds ?? [] : [],
    );

    return this.toPublicUser(updatedUser);
  }

  async remove(id: number) {
    const user = await this.findActiveEntityById(id);

    user.active = false;
    user.deletedAt = new Date();

    await this.usersRepository.save(user);
    await this.syncUserSubjects(user.id, []);

    return {
      message: 'Usuário excluído com sucesso.',
    };
  }

  async findEntityById(id: number) {
    const user = await this.usersRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: {
        email: email.trim().toLowerCase(),
        active: true,
        deletedAt: IsNull(),
      },
    });
  }

  private async findActiveEntityById(id: number) {
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

  async toPublicUser(user: User): Promise<PublicUser> {
    const subjectIdsByUserId = await this.loadActiveSubjectIdsByUserIds([user.id]);

    return this.buildPublicUser(user, subjectIdsByUserId.get(user.id) ?? []);
  }

  private buildPublicUser(user: User, subjectIds: number[]): PublicUser {
    const { password, ...publicUser } = user;

    return {
      ...publicUser,
      subjectIds,
    };
  }

  private async syncUserSubjects(userId: number, subjectIds: number[]) {
    const normalizedSubjectIds = [...new Set(subjectIds)];

    await this.ensureSubjectsAreAvailable(normalizedSubjectIds);

    const existingRelations = await this.userSubjectsRepository.find({
      where: {
        userId,
        deletedAt: IsNull(),
      },
    });
    const nextSubjectIdSet = new Set(normalizedSubjectIds);
    const relationsToClose = existingRelations.filter((relation) => !nextSubjectIdSet.has(relation.subjectId));
    const existingSubjectIdSet = new Set(existingRelations.map((relation) => relation.subjectId));
    const relationsToCreate = normalizedSubjectIds
      .filter((subjectId) => !existingSubjectIdSet.has(subjectId))
      .map((subjectId) =>
        this.userSubjectsRepository.create({
          userId,
          subjectId,
        }),
      );

    if (relationsToClose.length > 0) {
      const deletedAt = new Date();

      relationsToClose.forEach((relation) => {
        relation.deletedAt = deletedAt;
      });

      await this.userSubjectsRepository.save(relationsToClose);
    }

    if (relationsToCreate.length > 0) {
      await this.userSubjectsRepository.save(relationsToCreate);
    }
  }

  private async ensureSubjectsAreAvailable(subjectIds: number[]) {
    if (subjectIds.length === 0) {
      return;
    }

    const subjects = await this.subjectsRepository
      .createQueryBuilder('subject')
      .select('subject.id', 'id')
      .innerJoin(Course, 'course', 'course.id = subject.courseId AND course.deletedAt IS NULL')
      .where('subject.id IN (:...subjectIds)', { subjectIds })
      .andWhere('subject.deletedAt IS NULL')
      .getRawMany<{ id: number | string }>();

    if (subjects.length !== subjectIds.length) {
      throw new NotFoundException('Uma ou mais Disciplinas informadas não foram encontradas.');
    }
  }

  private async loadActiveSubjectIdsByUserIds(userIds: number[]) {
    if (userIds.length === 0) {
      return new Map<number, number[]>();
    }

    const userIdToSubjectIds = new Map<number, number[]>(userIds.map((userId) => [userId, []]));
    const rows = await this.userSubjectsRepository
      .createQueryBuilder('userSubject')
      .select('userSubject.userId', 'userId')
      .addSelect('userSubject.subjectId', 'subjectId')
      .innerJoin(Subject, 'subject', 'subject.id = userSubject.subjectId AND subject.deletedAt IS NULL')
      .innerJoin(Course, 'course', 'course.id = subject.courseId AND course.deletedAt IS NULL')
      .where('userSubject.userId IN (:...userIds)', { userIds })
      .andWhere('userSubject.deletedAt IS NULL')
      .orderBy('course.name', 'ASC')
      .addOrderBy('subject.name', 'ASC')
      .getRawMany<{ userId: number | string; subjectId: number | string }>();

    rows.forEach((row) => {
      const userId = Number(row.userId);
      const subjectId = Number(row.subjectId);

      userIdToSubjectIds.get(userId)?.push(subjectId);
    });

    return userIdToSubjectIds;
  }
}
