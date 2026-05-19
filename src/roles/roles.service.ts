import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoleDto } from './dto/create-role.dto';
import { ListRolesQueryDto } from './dto/list-roles-query.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { Role } from './entities/role.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async create(createRoleDto: CreateRoleDto) {
    const role = this.rolesRepository.create({
      description: createRoleDto.description.trim(),
    });

    return this.rolesRepository.save(role);
  }

  async findAll(query: ListRolesQueryDto) {
    const limit = query.limit ?? 10;
    const offset = query.offset ?? 0;
    const [items, total] = await this.rolesRepository.findAndCount({
      order: {
        description: 'ASC',
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

  async update(id: number, updateRoleDto: UpdateRoleDto) {
    const role = await this.findEntityById(id);

    role.description = updateRoleDto.description.trim();

    return this.rolesRepository.save(role);
  }

  async remove(id: number) {
    const role = await this.findEntityById(id);

    await this.rolesRepository.softRemove(role);

    return {
      message: 'Cargo excluído com sucesso.',
    };
  }

  private async findEntityById(id: number) {
    const role = await this.rolesRepository.findOne({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Cargo não encontrado.');
    }

    return role;
  }
}
