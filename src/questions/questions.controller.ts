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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuestionDto } from './dto/create-question.dto';
import { ListQuestionsQueryDto } from './dto/list-questions-query.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionImageFile } from './interfaces/question-image-file.interface';
import { QuestionsService } from './questions.service';

const questionImageFields = [
  { name: 'image', maxCount: 1 },
  { name: 'alternative1Image', maxCount: 1 },
  { name: 'alternative2Image', maxCount: 1 },
  { name: 'alternative3Image', maxCount: 1 },
  { name: 'alternative4Image', maxCount: 1 },
  { name: 'alternative5Image', maxCount: 1 },
] as const;

export interface QuestionUploadedFiles {
  image?: QuestionImageFile[];
  alternative1Image?: QuestionImageFile[];
  alternative2Image?: QuestionImageFile[];
  alternative3Image?: QuestionImageFile[];
  alternative4Image?: QuestionImageFile[];
  alternative5Image?: QuestionImageFile[];
}

@UseGuards(JwtAuthGuard)
@Controller('courses/:courseId/subjects/:subjectId/questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Get()
  findAll(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Query() query: ListQuestionsQueryDto,
  ) {
    return this.questionsService.findAll(courseId, subjectId, query);
  }

  @Get(':id')
  findById(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.questionsService.findById(courseId, subjectId, id);
  }

  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([...questionImageFields], {
      storage: memoryStorage(),
    }),
  )
  create(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Body() createQuestionDto: CreateQuestionDto,
    @UploadedFiles() files: QuestionUploadedFiles = {},
  ) {
    return this.questionsService.create(courseId, subjectId, createQuestionDto, files);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([...questionImageFields], {
      storage: memoryStorage(),
    }),
  )
  update(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateQuestionDto: UpdateQuestionDto,
    @UploadedFiles() files: QuestionUploadedFiles = {},
  ) {
    return this.questionsService.update(courseId, subjectId, id, updateQuestionDto, files);
  }

  @Delete(':id')
  remove(
    @Param('courseId', ParseIntPipe) courseId: number,
    @Param('subjectId', ParseIntPipe) subjectId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.questionsService.remove(courseId, subjectId, id);
  }
}
