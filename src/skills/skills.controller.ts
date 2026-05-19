import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateSkillDto } from './dto/create-skill.dto';
import { ListSkillsQueryDto } from './dto/list-skills-query.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { SkillsService } from './skills.service';

@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/subjects/:subjectId/skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  findAll(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Query() query: ListSkillsQueryDto,
  ) {
    return this.skillsService.findAll(courseId, subjectId, query);
  }

  @Post()
  create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Body() createSkillDto: CreateSkillDto,
  ) {
    return this.skillsService.create(courseId, subjectId, createSkillDto);
  }

  @Patch(':id')
  update(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSkillDto: UpdateSkillDto,
  ) {
    return this.skillsService.update(courseId, subjectId, id, updateSkillDto);
  }

  @Delete(':id')
  remove(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.skillsService.remove(courseId, subjectId, id);
  }
}
