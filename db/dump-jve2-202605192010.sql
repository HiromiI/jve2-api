-- MySQL dump 10.13  Distrib 8.0.40, for macos14 (x86_64)
--
-- Host: localhost    Database: jve2
-- ------------------------------------------------------
-- Server version	8.0.40

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `boards`
--

DROP TABLE IF EXISTS `boards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `boards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `boards`
--

LOCK TABLES `boards` WRITE;
/*!40000 ALTER TABLE `boards` DISABLE KEYS */;
INSERT INTO `boards` VALUES (1,'Banca 12','2026-05-11 21:02:18.395717','2026-05-11 21:03:38.000000'),(2,'Banca 34','2026-05-11 21:08:48.105711',NULL),(3,'Banca 56','2026-05-11 21:09:03.168849',NULL),(4,'Banca 78','2026-05-11 21:18:20.375074',NULL),(5,'Banca 910','2026-05-11 21:18:30.994976',NULL),(6,'Banca 1112','2026-05-11 21:18:40.595844',NULL),(7,'Banca 1213','2026-05-11 21:18:50.460670',NULL),(8,'Banca 1314','2026-05-11 21:19:01.691479',NULL),(9,'Banca 1415','2026-05-11 21:19:16.080363',NULL),(10,'Banca 1516','2026-05-11 21:19:26.745926',NULL),(11,'Banca 1617','2026-05-11 21:19:35.594100',NULL),(12,'Banca 1718','2026-05-11 21:19:44.618111',NULL),(13,'Banca 037','2026-05-11 21:27:12.394471',NULL),(14,'Banca Teste final','2026-05-11 21:36:49.220262',NULL),(15,'Banca 02 - Teste 12/05/2026','2026-05-12 19:48:32.065993','2026-05-12 19:50:03.000000');
/*!40000 ALTER TABLE `boards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `planCode` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `price` decimal(10,2) DEFAULT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (1,'Curso ABC','Descrição do Curso ABC',NULL,'CódigoPlanoCursoABC',170.50,'2026-05-13 21:02:38.582463','2026-05-13 21:24:45.000000'),(4,'Curso DEF','Descrição do Curso DEF Descrição do Curso DEF Descrição do Curso DEF Descrição do Curso DEF Descrição do Curso DEF Descrição do Curso DEF Descrição do Curso DEF','https://nyc3.digitaloceanspaces.com/test-fatecoins-bucket/JVE/Courses/4/CURSO DEF-d46ce515-22a6-4749-a529-1dcf827b8597.jpg','CodigoPlanoCursoDEF',200.50,'2026-05-13 21:22:47.192683',NULL),(5,'Curso ABC','Descrição do Curso ABC Descrição do Curso ABC Descrição do Curso ABC Descrição do Curso ABC',NULL,'CodigoPlanoCursoABC',357.90,'2026-05-13 21:33:36.546240',NULL),(6,'ATeste tamanho Descrição','Descrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABCDescrição do Curso ABC',NULL,NULL,36.90,'2026-05-13 21:34:44.438026',NULL);
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `educational_levels`
--

DROP TABLE IF EXISTS `educational_levels`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `educational_levels` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `educational_levels`
--

LOCK TABLES `educational_levels` WRITE;
/*!40000 ALTER TABLE `educational_levels` DISABLE KEYS */;
INSERT INTO `educational_levels` VALUES (1,'Nível de Escolaridade 12','2026-05-12 20:25:14.480985',NULL),(2,'Nível de Escolaridade 2','2026-05-12 20:25:25.069398','2026-05-12 20:26:03.000000');
/*!40000 ALTER TABLE `educational_levels` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `institutions`
--

DROP TABLE IF EXISTS `institutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `institutions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `institutions`
--

LOCK TABLES `institutions` WRITE;
/*!40000 ALTER TABLE `institutions` DISABLE KEYS */;
INSERT INTO `institutions` VALUES (1,'Instituição 12','2026-05-12 20:18:37.528377',NULL),(2,'Instituição 2','2026-05-12 20:19:09.545045','2026-05-12 20:19:43.000000');
/*!40000 ALTER TABLE `institutions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `question_skills`
--

DROP TABLE IF EXISTS `question_skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `question_skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `questionId` int NOT NULL,
  `skillId` int NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_ecfa340a988f29dd6384e07235b` (`questionId`),
  KEY `FK_0f12aaabf5f14c702c19f8e2e7d` (`skillId`),
  CONSTRAINT `FK_0f12aaabf5f14c702c19f8e2e7d` FOREIGN KEY (`skillId`) REFERENCES `skills` (`id`),
  CONSTRAINT `FK_ecfa340a988f29dd6384e07235b` FOREIGN KEY (`questionId`) REFERENCES `questions` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `question_skills`
--

LOCK TABLES `question_skills` WRITE;
/*!40000 ALTER TABLE `question_skills` DISABLE KEYS */;
INSERT INTO `question_skills` VALUES (1,1,6,'2026-05-19 19:15:29.397010','2026-05-19 19:15:46.798000'),(2,1,6,'2026-05-19 19:15:59.227580',NULL),(3,1,9,'2026-05-19 19:21:21.691763',NULL),(4,2,8,'2026-05-19 19:21:34.195464',NULL);
/*!40000 ALTER TABLE `question_skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `questions`
--

DROP TABLE IF EXISTS `questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subjectId` int NOT NULL,
  `roleId` int NOT NULL,
  `boardId` int NOT NULL,
  `institutionId` int NOT NULL,
  `educationalLevelId` int NOT NULL,
  `year` int NOT NULL,
  `question` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alternative1` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternative1_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alternative1_correct` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternative2` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternative2_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alternative2_correct` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternative3` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternative3_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alternative3_correct` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternative4` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternative4_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alternative4_correct` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternative5` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `alternative5_image` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alternative5_correct` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_e01d35c31e3ade999d9e569b79f` (`subjectId`),
  KEY `FK_5e82c5ff0f9652a4d6465c470db` (`roleId`),
  KEY `FK_d50f5d63894b8219875f9c9dbac` (`boardId`),
  KEY `FK_dd8d8d1ae8c2915d415a7f939dd` (`institutionId`),
  KEY `FK_36043f57bcfa0fab0076b9ad27e` (`educationalLevelId`),
  CONSTRAINT `FK_36043f57bcfa0fab0076b9ad27e` FOREIGN KEY (`educationalLevelId`) REFERENCES `educational_levels` (`id`),
  CONSTRAINT `FK_5e82c5ff0f9652a4d6465c470db` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`),
  CONSTRAINT `FK_d50f5d63894b8219875f9c9dbac` FOREIGN KEY (`boardId`) REFERENCES `boards` (`id`),
  CONSTRAINT `FK_dd8d8d1ae8c2915d415a7f939dd` FOREIGN KEY (`institutionId`) REFERENCES `institutions` (`id`),
  CONSTRAINT `FK_e01d35c31e3ade999d9e569b79f` FOREIGN KEY (`subjectId`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `questions`
--

LOCK TABLES `questions` WRITE;
/*!40000 ALTER TABLE `questions` DISABLE KEYS */;
INSERT INTO `questions` VALUES (1,4,1,6,1,1,2025,'Questão 1 - Alface',NULL,'Alternativa correta 1 - alface','https://nyc3.digitaloceanspaces.com/test-fatecoins-bucket/JVE/Courses/5/Subjects/4/Questions/1/Alternative1/Alternative1Image-ffc9a80b-aaa2-4a8b-b66d-174fa31faa9a.jpg','Y','Alternativa incorreta 2 - tomate','https://nyc3.digitaloceanspaces.com/test-fatecoins-bucket/JVE/Courses/5/Subjects/4/Questions/1/Alternative2/Alternative2Image-fb9904d2-1b3e-415a-aec4-0920250a2cb9.jpg','N','Alternativa incorreta 3 - cebola','https://nyc3.digitaloceanspaces.com/test-fatecoins-bucket/JVE/Courses/5/Subjects/4/Questions/1/Alternative3/Alternative3Image-d571508e-39ef-4955-86fd-223809abb338.jpg','N','Alternativa incorreta 4 - alface americana','https://nyc3.digitaloceanspaces.com/test-fatecoins-bucket/JVE/Courses/5/Subjects/4/Questions/1/Alternative4/Alternative4Image-e2c9bcb4-3f67-47a9-89b4-efff288ce43d.jpg','N','Alternativa incorreta 5 - alfafa',NULL,'N','2026-05-19 19:03:05.147544',NULL),(2,4,1,11,1,1,2023,'Questão 2 - tomate','https://nyc3.digitaloceanspaces.com/test-fatecoins-bucket/JVE/Courses/5/Subjects/4/Questions/2/QuestionImage-2e2bcca5-c826-4795-a82d-b8ab5990bac3.jpg','Alternativa incorreta 1 - Tomate cereja',NULL,'N','Alternativa correta 2 - tomate',NULL,'Y','Alternativa incorreta 3 - cebola',NULL,'N','Alternativa incorreta 4 - pepino',NULL,'N','Alternativa incorreta 5 - cenoura','https://nyc3.digitaloceanspaces.com/test-fatecoins-bucket/JVE/Courses/5/Subjects/4/Questions/2/Alternative5/Alternative5Image-ac88645e-3ed6-4989-a918-c2e09b57743e.jpg','N','2026-05-19 19:06:28.521110',NULL);
/*!40000 ALTER TABLE `questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Cargo 12','2026-05-12 19:50:55.289276',NULL),(2,'Cargo 2','2026-05-12 19:51:12.033169','2026-05-12 19:51:45.000000');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `skills`
--

DROP TABLE IF EXISTS `skills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `skills` (
  `id` int NOT NULL AUTO_INCREMENT,
  `subjectId` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_18fc241a1854316304b751662e0` (`subjectId`),
  CONSTRAINT `FK_18fc241a1854316304b751662e0` FOREIGN KEY (`subjectId`) REFERENCES `subjects` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `skills`
--

LOCK TABLES `skills` WRITE;
/*!40000 ALTER TABLE `skills` DISABLE KEYS */;
INSERT INTO `skills` VALUES (1,1,'Skill 1 - Disciplina 1 - Curso DEF','Teste 1','2026-05-18 20:10:57.479475',NULL),(2,1,'Skill 2 - Disciplina 1 - Curso DEF',NULL,'2026-05-18 20:11:44.810885','2026-05-18 20:33:40.000000'),(3,2,'Skill 1 - Disciplina 1 - Curso DEF',NULL,'2026-05-18 20:12:59.253152',NULL),(4,2,'Skill 2 - Disciplina 1 - Curso DEF',NULL,'2026-05-18 20:13:18.736914',NULL),(5,5,'Skill 1 - Disciplina 1 - Curso DEF',NULL,'2026-05-18 20:35:01.812533',NULL),(6,4,'Skill teste','Teste','2026-05-19 19:15:13.475913',NULL),(7,4,'Teste 2',NULL,'2026-05-19 19:20:38.704375',NULL),(8,4,'Teste 3',NULL,'2026-05-19 19:20:46.135130',NULL),(9,4,'Teste 4',NULL,'2026-05-19 19:20:56.432987',NULL);
/*!40000 ALTER TABLE `skills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subjects`
--

DROP TABLE IF EXISTS `subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `courseId` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_be7152766987a7bcdcac0401510` (`courseId`),
  CONSTRAINT `FK_be7152766987a7bcdcac0401510` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subjects`
--

LOCK TABLES `subjects` WRITE;
/*!40000 ALTER TABLE `subjects` DISABLE KEYS */;
INSERT INTO `subjects` VALUES (1,4,'Disciplina 1 - Curso DEF','Teste descrição Disciplina 1','2026-05-18 19:30:47.680404',NULL),(2,4,'Disciplina 2 - Curso DEF',NULL,'2026-05-18 19:32:57.630999','2026-05-18 20:32:58.000000'),(3,4,'Disciplina 3 - Curso DEF',NULL,'2026-05-18 19:33:21.106020','2026-05-18 19:38:47.000000'),(4,5,'Disciplina 2 - Curso DEF',NULL,'2026-05-18 19:33:32.743949',NULL),(5,4,'Disciplina 2 - Curso DEF',NULL,'2026-05-18 20:34:34.601917',NULL);
/*!40000 ALTER TABLE `subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_subjects`
--

DROP TABLE IF EXISTS `user_subjects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_subjects` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `subjectId` int NOT NULL,
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_e5b3b91e12265bb1cf01c2dbb44` (`userId`),
  KEY `FK_b8ffeeaa5df97da742b636e027b` (`subjectId`),
  CONSTRAINT `FK_b8ffeeaa5df97da742b636e027b` FOREIGN KEY (`subjectId`) REFERENCES `subjects` (`id`),
  CONSTRAINT `FK_e5b3b91e12265bb1cf01c2dbb44` FOREIGN KEY (`userId`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_subjects`
--

LOCK TABLES `user_subjects` WRITE;
/*!40000 ALTER TABLE `user_subjects` DISABLE KEYS */;
INSERT INTO `user_subjects` VALUES (1,7,1,'2026-05-18 19:55:43.599844','2026-05-18 20:01:39.576000'),(2,7,4,'2026-05-18 20:01:02.145884',NULL),(3,7,1,'2026-05-18 20:01:53.656269',NULL),(4,8,1,'2026-05-19 19:37:08.125133',NULL),(5,8,4,'2026-05-19 19:37:08.127696',NULL);
/*!40000 ALTER TABLE `user_subjects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint NOT NULL DEFAULT '1',
  `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `role` enum('admin','student','professor') COLLATE utf8mb4_unicode_ci NOT NULL,
  `deletedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Isabella Hiromi Alvarenga Shimazu','isaashimazu@gmail.com','$2b$10$9qR1y5Zr8K3jLwF6kQp8Uu1cG5rH0jPzYv9mT6aB2sXcN4eW7dHGa',1,'2025-01-21 17:54:00.000000','admin',NULL),(2,'Vinicius Toledo P. Gonella','vine.gonella@hotmail.com','$2b$10$65QQZWpEzsoHmVkiBdF6p.UGVuuY8eFvt1euZzvzZ5AxaMzbR8CtS',0,'2026-05-12 20:57:21.598759','admin',NULL),(3,'Isabella 2','isaashimazu2@gmail.com','$2b$10$kvVx5FF0wo3Qmb4TVUuezO2kYqbP36/tldKeMrwkLvdbnebJ1TvVu',1,'2026-05-12 21:11:40.194356','admin',NULL),(4,'Vinicius 2','vine.gonella2@hotmail.com','$2b$10$p5isZe1/Scn5y6Dm6DKGPuakxEKNp1un0uEMZU2XU7dC/1z.4ulny',1,'2026-05-12 21:33:25.212807','professor',NULL),(5,'Teste','isaashimazu3@gmail.com','$2b$10$T4bCcbTW7MSI6XHh69RS8u5AxTldr1iN43N8NZcBjYAOgpAleu58u',0,'2026-05-12 21:41:06.109371','admin','2026-05-12 21:41:21.724000'),(6,'Isabella Shimazu','isaashimazu5@teste.com','$2b$10$517rJbzsH6Xy.PFjwawvlORw6Mskk0P5lvnpRajIgalgUmuk5SJPW',1,'2026-05-18 19:28:16.000000','admin',NULL),(7,'Vinicius Professor','viniciusprof@teste.com','$2b$10$neVmrofpzWq5eh9n3aRlNOJEBmGsM1Ge.yLMeSXokt6PpnojWcNOW',1,'2026-05-18 19:55:22.402294','professor',NULL),(8,'Isabella professora','isaashimazu6@teste.com','$2b$10$eFv1aO63mpJPxM8MkDafvOPZzapcC2pCyhBN/1/9odqnBCetcnt1q',1,'2026-05-19 19:37:08.098078','professor',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'jve2'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-19 20:10:59
