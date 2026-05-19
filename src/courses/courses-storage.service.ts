import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { CourseImageFile } from './interfaces/course-image-file.interface';

@Injectable()
export class CoursesStorageService {
  constructor(private readonly configService: ConfigService) {}

  async uploadCourseImage(params: {
    courseId: number;
    courseName: string;
    file: CourseImageFile;
  }) {
    const { courseId, courseName, file } = params;
    const { bucketName, endpoint, s3Client } = this.getStorageClient();

    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Arquivo de banner inválido.');
    }

    const extension = this.resolveExtension(file);
    const fileNameSuffix = `-${randomUUID()}.${extension}`;
    const sanitizedCourseName = this.normalizeCourseName({
      courseId,
      courseName,
      bucketName,
      endpoint,
      fileNameSuffix,
    });
    const key = `JVE/Courses/${courseId}/${sanitizedCourseName}${fileNameSuffix}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: file.buffer,
        ACL: 'public-read',
        ContentType: file.mimetype,
      }),
    );

    return this.resolvePublicUrl(endpoint, bucketName, key);
  }

  private resolveExtension(file: CourseImageFile) {
    const originalExtension = file.originalname.split('.').pop()?.trim().toLowerCase();

    if (originalExtension) {
      return originalExtension;
    }

    const mimeExtension = file.mimetype.split('/').pop()?.trim().toLowerCase();

    if (!mimeExtension) {
      throw new BadRequestException('Arquivo de banner inválido.');
    }

    return mimeExtension;
  }

  private normalizeCourseName(params: {
    courseId: number;
    courseName: string;
    bucketName: string;
    endpoint: string;
    fileNameSuffix: string;
  }) {
    const { courseId, courseName, bucketName, endpoint, fileNameSuffix } = params;
    const normalizedName = courseName
      .trim()
      .toLocaleUpperCase('pt-BR')
      .replace(/[\\/]+/g, '-')
      .replace(/\s+/g, ' ');

    const baseUrlPrefix = this.resolvePublicUrl(endpoint, bucketName, `JVE/Courses/${courseId}/`);
    const maximumNameLength = Math.max(1, 255 - baseUrlPrefix.length - fileNameSuffix.length);

    return (normalizedName || 'CURSO').slice(0, maximumNameLength).trim() || 'CURSO';
  }

  private getStorageClient() {
    const accessKeyId = this.configService.get<string>('DO_SPACES_ACCESS_KEY')?.trim();
    const secretAccessKey = this.configService.get<string>('DO_SPACES_SECRET_KEY')?.trim();
    const bucketName = this.configService.get<string>('DO_SPACES_BUCKET')?.trim();
    const endpoint = this.configService.get<string>('DO_SPACES_ENDPOINT')?.trim()?.replace(/\/+$/, '');

    if (!accessKeyId || !secretAccessKey || !bucketName || !endpoint) {
      throw new InternalServerErrorException('Configuração do armazenamento de Cursos não encontrada.');
    }

    let region = 'us-east-1';

    try {
      const endpointUrl = new URL(endpoint);
      const [derivedRegion] = endpointUrl.hostname.split('.');

      if (derivedRegion) {
        region = derivedRegion;
      }
    } catch {
      region = 'us-east-1';
    }

    return {
      bucketName,
      endpoint,
      s3Client: new S3Client({
        region,
        endpoint,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      }),
    };
  }

  private resolvePublicUrl(endpoint: string, bucketName: string, key: string) {
    try {
      const endpointUrl = new URL(endpoint);
      const endpointAlreadyContainsBucket =
        endpointUrl.hostname.startsWith(`${bucketName}.`) || endpointUrl.pathname.split('/').includes(bucketName);

      return endpointAlreadyContainsBucket
        ? `${endpoint}/${key}`
        : `${endpoint}/${bucketName}/${key}`;
    } catch {
      return `${endpoint}/${bucketName}/${key}`;
    }
  }
}
