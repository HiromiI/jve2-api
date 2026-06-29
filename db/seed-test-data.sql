SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE question_skills;
TRUNCATE TABLE skills;
TRUNCATE TABLE user_subjects;
TRUNCATE TABLE questions;
TRUNCATE TABLE subjects;
TRUNCATE TABLE courses;
TRUNCATE TABLE exams_answers;
TRUNCATE TABLE exams;
TRUNCATE TABLE payments;
TRUNCATE TABLE roles;
TRUNCATE TABLE boards;
TRUNCATE TABLE educational_levels;
TRUNCATE TABLE institutions;

SET FOREIGN_KEY_CHECKS = 1;

START TRANSACTION;

INSERT INTO roles (id, description) VALUES
(1, 'Cargo fictício 1'),
(2, 'Cargo fictício 2'),
(3, 'Cargo fictício 3');

INSERT INTO boards (id, description) VALUES
(1, 'Banca fictícia 1'),
(2, 'Banca fictícia 2'),
(3, 'Banca fictícia 3');

INSERT INTO educational_levels (id, description) VALUES
(1, 'Nível de Escolaridade 1'),
(2, 'Nível de Escolaridade 2'),
(3, 'Nível de Escolaridade 3');

INSERT INTO institutions (id, description) VALUES
(1, 'Instituição fictícia 1'),
(2, 'Instituição fictícia 2'),
(3, 'Instituição fictícia 3');

INSERT INTO courses (id, name, description, image, planCode, price) VALUES
(
  1,
  'Curso Fictício 1',
  RPAD('Descrição longa do Curso Fictício 1 para testes.', 1000, '.'),
  'https://placehold.co/600x400/png?text=Curso+1',
  'plan_PJzqn5yTPTlndgL9',
  199.90
),
(
  2,
  'Curso Fictício 2',
  RPAD('Descrição curta do Curso Fictício 2.', 20, '.'),
  NULL,
  'plan_PJzqn5yTPTlndgL9',
  59.90
);

INSERT INTO subjects (id, courseId, name, description) VALUES
(1, 1, 'Matemática', NULL),
(2, 1, 'Português', NULL),
(3, 1, 'Ciências Naturais', NULL),
(4, 1, 'Ciências Humanas', NULL),
(5, 2, 'Matemática', NULL),
(6, 2, 'Português', NULL),
(7, 2, 'Ciências Naturais', NULL),
(8, 2, 'Ciências Humanas', NULL);

INSERT INTO questions (
  subjectId,
  roleId,
  boardId,
  institutionId,
  educationalLevelId,
  year,
  question,
  image,
  alternative1,
  alternative1_image,
  alternative1_correct,
  alternative2,
  alternative2_image,
  alternative2_correct,
  alternative3,
  alternative3_image,
  alternative3_correct,
  alternative4,
  alternative4_image,
  alternative4_correct,
  alternative5,
  alternative5_image,
  alternative5_correct
)
SELECT
  base.subjectId,
  base.roleId,
  base.boardId,
  base.institutionId,
  base.educationalLevelId,
  base.year,
  base.question,
  base.image,
  base.alternative1,
  base.alternative1_image,
  base.alternative1_correct,
  base.alternative2,
  base.alternative2_image,
  base.alternative2_correct,
  base.alternative3,
  base.alternative3_image,
  base.alternative3_correct,
  base.alternative4,
  base.alternative4_image,
  base.alternative4_correct,
  base.alternative5,
  base.alternative5_image,
  base.alternative5_correct
FROM (
  SELECT
    s.id AS subjectId,
    CASE MOD(seq.n - 1, 3)
      WHEN 0 THEN 1
      WHEN 1 THEN 2
      ELSE 3
    END AS roleId,
    CASE MOD(seq.n - 1, 3)
      WHEN 0 THEN 1
      WHEN 1 THEN 2
      ELSE 3
    END AS boardId,
    CASE MOD(seq.n - 1, 3)
      WHEN 0 THEN 1
      WHEN 1 THEN 2
      ELSE 3
    END AS institutionId,
    CASE MOD(seq.n - 1, 3)
      WHEN 0 THEN 1
      WHEN 1 THEN 2
      ELSE 3
    END AS educationalLevelId,
    2020 + MOD(seq.n, 7) AS year,
    CASE MOD(seq.n, 4)
      WHEN 0 THEN CONCAT(
        '<p><strong>Questão ', seq.n, '</strong> sobre ', s.name, ' no curso ', c.name,
        '. Texto objetivo sem fórmulas.',
        REPEAT(' Mais contexto para variar o tamanho.', MOD(seq.n, 8) + 4),
        '</p>'
      )
      WHEN 1 THEN CONCAT(
        '<p><strong>Questão ', seq.n, '</strong> sobre ', s.name, ' no curso ', c.name,
        '. Fórmula única: <span class="katex" data-math-formula="true">a+b=c</span>.',
        REPEAT(' Contexto complementar.', MOD(seq.n, 6) + 2),
        '</p>'
      )
      WHEN 2 THEN CONCAT(
        '<p><strong>Questão ', seq.n, '</strong> sobre ', s.name, ' no curso ', c.name,
        '. Duas fórmulas: <span class="katex" data-math-formula="true">a+b=c</span> e ',
        '<span class="katex" data-math-formula="true">x^2+y^2=z^2</span>.',
        REPEAT(' Detalhe adicional para variar o tamanho.', MOD(seq.n, 6) + 2),
        '</p>'
      )
      ELSE CONCAT(
        '<p><strong>Questão ', seq.n, '</strong> sobre ', s.name, ' no curso ', c.name,
        '. Três fórmulas: <span class="katex" data-math-formula="true">a+b=c</span>, ',
        '<span class="katex" data-math-formula="true">x^2+y^2=z^2</span> e ',
        '<span class="katex" data-math-formula="true">\\int_0^1 x\\,dx = 1/2</span>.',
        REPEAT(' Trecho extra para alongar o texto.', MOD(seq.n, 6) + 2),
        '</p>'
      )
    END AS question,
    CASE
      WHEN MOD(seq.n, 4) = 0 THEN NULL
      WHEN MOD(seq.n, 4) = 1 THEN CONCAT('https://placehold.co/800x450/png?text=Q-', s.courseId, '-', s.id, '-', seq.n)
      WHEN MOD(seq.n, 4) = 2 THEN CONCAT('https://placehold.co/800x450/jpg?text=Q-', s.courseId, '-', s.id, '-', seq.n)
      ELSE CONCAT('https://placehold.co/800x450/webp?text=Q-', s.courseId, '-', s.id, '-', seq.n)
    END AS image,
    CONCAT('Alternativa 1 da questão ', seq.n, ' - ', s.name) AS alternative1,
    CASE
      WHEN MOD(seq.n, 2) = 0 THEN CONCAT('https://placehold.co/320x180/png?text=A1-', s.courseId, '-', s.id, '-', seq.n)
      ELSE NULL
    END AS alternative1_image,
    CASE
      WHEN CASE
        WHEN MOD(seq.n, 6) = 0 THEN 4
        ELSE CASE MOD(seq.n - 1, 5)
          WHEN 0 THEN 1
          WHEN 1 THEN 2
          WHEN 2 THEN 3
          WHEN 3 THEN 4
          ELSE 5
        END
      END = 1 THEN 'Y' ELSE 'N'
    END AS alternative1_correct,
    CONCAT('Alternativa 2 da questão ', seq.n, ' - ', s.name) AS alternative2,
    CASE
      WHEN MOD(seq.n, 3) = 0 THEN CONCAT('https://placehold.co/320x180/png?text=A2-', s.courseId, '-', s.id, '-', seq.n)
      ELSE NULL
    END AS alternative2_image,
    CASE
      WHEN CASE
        WHEN MOD(seq.n, 6) = 0 THEN 4
        ELSE CASE MOD(seq.n - 1, 5)
          WHEN 0 THEN 1
          WHEN 1 THEN 2
          WHEN 2 THEN 3
          WHEN 3 THEN 4
          ELSE 5
        END
      END = 2 THEN 'Y' ELSE 'N'
    END AS alternative2_correct,
    CONCAT('Alternativa 3 da questão ', seq.n, ' - ', s.name) AS alternative3,
    CASE
      WHEN MOD(seq.n, 4) = 0 THEN CONCAT('https://placehold.co/320x180/png?text=A3-', s.courseId, '-', s.id, '-', seq.n)
      ELSE NULL
    END AS alternative3_image,
    CASE
      WHEN CASE
        WHEN MOD(seq.n, 6) = 0 THEN 4
        ELSE CASE MOD(seq.n - 1, 5)
          WHEN 0 THEN 1
          WHEN 1 THEN 2
          WHEN 2 THEN 3
          WHEN 3 THEN 4
          ELSE 5
        END
      END = 3 THEN 'Y' ELSE 'N'
    END AS alternative3_correct,
    CONCAT('Alternativa 4 da questão ', seq.n, ' - ', s.name) AS alternative4,
    CASE
      WHEN MOD(seq.n, 5) = 0 THEN CONCAT('https://placehold.co/320x180/png?text=A4-', s.courseId, '-', s.id, '-', seq.n)
      ELSE NULL
    END AS alternative4_image,
    CASE
      WHEN CASE
        WHEN MOD(seq.n, 6) = 0 THEN 4
        ELSE CASE MOD(seq.n - 1, 5)
          WHEN 0 THEN 1
          WHEN 1 THEN 2
          WHEN 2 THEN 3
          WHEN 3 THEN 4
          ELSE 5
        END
      END = 4 THEN 'Y' ELSE 'N'
    END AS alternative4_correct,
    CASE
      WHEN MOD(seq.n, 6) = 0 THEN ''
      ELSE CONCAT('Alternativa 5 da questão ', seq.n, ' - ', s.name)
    END AS alternative5,
    CASE
      WHEN MOD(seq.n, 6) = 0 THEN NULL
      ELSE CONCAT('https://placehold.co/320x180/png?text=A5-', s.courseId, '-', s.id, '-', seq.n)
    END AS alternative5_image,
    CASE
      WHEN CASE
        WHEN MOD(seq.n, 6) = 0 THEN 4
        ELSE CASE MOD(seq.n - 1, 5)
          WHEN 0 THEN 1
          WHEN 1 THEN 2
          WHEN 2 THEN 3
          WHEN 3 THEN 4
          ELSE 5
        END
      END = 5 THEN 'Y' ELSE 'N'
    END AS alternative5_correct
  FROM (
    SELECT 1 AS n
    UNION ALL SELECT 2
    UNION ALL SELECT 3
    UNION ALL SELECT 4
    UNION ALL SELECT 5
    UNION ALL SELECT 6
    UNION ALL SELECT 7
    UNION ALL SELECT 8
    UNION ALL SELECT 9
    UNION ALL SELECT 10
    UNION ALL SELECT 11
    UNION ALL SELECT 12
    UNION ALL SELECT 13
    UNION ALL SELECT 14
    UNION ALL SELECT 15
    UNION ALL SELECT 16
    UNION ALL SELECT 17
    UNION ALL SELECT 18
    UNION ALL SELECT 19
    UNION ALL SELECT 20
    UNION ALL SELECT 21
    UNION ALL SELECT 22
    UNION ALL SELECT 23
    UNION ALL SELECT 24
    UNION ALL SELECT 25
    UNION ALL SELECT 26
    UNION ALL SELECT 27
    UNION ALL SELECT 28
    UNION ALL SELECT 29
    UNION ALL SELECT 30
    UNION ALL SELECT 31
    UNION ALL SELECT 32
    UNION ALL SELECT 33
    UNION ALL SELECT 34
    UNION ALL SELECT 35
    UNION ALL SELECT 36
    UNION ALL SELECT 37
    UNION ALL SELECT 38
    UNION ALL SELECT 39
    UNION ALL SELECT 40
    UNION ALL SELECT 41
    UNION ALL SELECT 42
    UNION ALL SELECT 43
    UNION ALL SELECT 44
    UNION ALL SELECT 45
    UNION ALL SELECT 46
    UNION ALL SELECT 47
    UNION ALL SELECT 48
    UNION ALL SELECT 49
    UNION ALL SELECT 50
  ) AS seq
  CROSS JOIN subjects s
  INNER JOIN courses c ON c.id = s.courseId
) AS base;

COMMIT;
