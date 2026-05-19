import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { resolve } from 'path';
import { TypeOrmModule } from '@nestjs/typeorm';
import { createConnection } from 'mysql2/promise';
import { AuthModule } from './auth/auth.module';
import { BoardsModule } from './boards/boards.module';
import { CoursesModule } from './courses/courses.module';
import { EducationalLevelsModule } from './educational_levels/educational_levels.module';
import { InstitutionsModule } from './institutions/institutions.module';
import { QuestionsModule } from './questions/questions.module';
import { RolesModule } from './roles/roles.module';
import { SkillsModule } from './skills/skills.module';
import { SubjectsModule } from './subjects/subjects.module';
import { UsersModule } from './users/users.module';

const resolveDatabaseName = (configService: ConfigService) => {
  const configuredDatabaseName = configService.get<string>('DB_NAME')?.trim();

  if (!configuredDatabaseName || configuredDatabaseName === 'jve') {
    return 'jve2';
  }

  return configuredDatabaseName;
};

const ensureDatabaseExists = async (configService: ConfigService) => {
  const database = resolveDatabaseName(configService);
  const connection = await createConnection({
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: Number(configService.get<string>('DB_PORT', '3306')),
    user: configService.get<string>('DB_USERNAME', 'root'),
    password: configService.get<string>('DB_PASSWORD', ''),
  });

  try {
    const escapedDatabase = database.replace(/`/g, '``');

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${escapedDatabase}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
  } finally {
    await connection.end();
  }

  return database;
};

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: [resolve(__dirname, '..', '.env'), resolve(process.cwd(), '.env')],
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const database = await ensureDatabaseExists(configService);

        return {
          type: 'mysql' as const,
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: Number(configService.get<string>('DB_PORT', '3306')),
          username: configService.get<string>('DB_USERNAME', 'root'),
          password: configService.get<string>('DB_PASSWORD', ''),
          database,
          autoLoadEntities: true,
          synchronize: configService.get<string>('DB_SYNCHRONIZE', 'true') === 'true',
        };
      },
    }),
    BoardsModule,
    CoursesModule,
    EducationalLevelsModule,
    InstitutionsModule,
    QuestionsModule,
    RolesModule,
    SkillsModule,
    SubjectsModule,
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
