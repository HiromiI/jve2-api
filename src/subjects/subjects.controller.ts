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
import { CreateSubjectDto } from './dto/create-subject.dto';
import { ListSubjectsQueryDto } from './dto/list-subjects-query.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectsService } from './subjects.service';

@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  findAll(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Query() query: ListSubjectsQueryDto,
  ) {
    return this.subjectsService.findAll(courseId, query);
  }

  @Get(':id')
  findById(@Param('courseId', ParseIntPipe) courseId: number, @Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.findById(courseId, id);
  }

  @Post()
  create(@Param('courseId', ParseIntPipe) courseId: number, @Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectsService.create(courseId, createSubjectDto);
  }

  @Patch(':id')
  update(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateSubjectDto: UpdateSubjectDto,
  ) {
    return this.subjectsService.update(courseId, id, updateSubjectDto);
  }

  @Delete(':id')
  remove(@Param('courseId', ParseIntPipe) courseId: number, @Param('id', ParseIntPipe) id: number) {
    return this.subjectsService.remove(courseId, id);
  }
}
