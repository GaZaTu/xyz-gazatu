-- BEGIN TriviaCategory --
CREATE TABLE "TriviaCategory" (
  "id" VARCHAR(26) NOT NULL,
  "name" VARCHAR(256) NOT NULL,
  "description" VARCHAR(512),
  "submitter" VARCHAR(256),
  "submitterUserId" VARCHAR(26),
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "disabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedByUserId" VARCHAR(26),
  UNIQUE ("name"),
  FOREIGN KEY ("submitterUserId") REFERENCES "User" ("id") ON DELETE SET NULL,
  FOREIGN KEY ("updatedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

SELECT __create_updatedat_trigger('TriviaCategory');
-- END TriviaCategory --

-- BEGIN TriviaQuestion --
CREATE TABLE "TriviaQuestion" (
  "id" VARCHAR(26) NOT NULL,
  "question" VARCHAR(512) NOT NULL,
  "answer" VARCHAR(256) NOT NULL,
  "hint1" VARCHAR(256),
  "hint2" VARCHAR(256),
  "submitter" VARCHAR(256),
  "submitterUserId" VARCHAR(26),
  "verified" BOOLEAN NOT NULL DEFAULT false,
  "disabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedByUserId" VARCHAR(26),
  FOREIGN KEY ("submitterUserId") REFERENCES "User" ("id") ON DELETE SET NULL,
  FOREIGN KEY ("updatedByUserId") REFERENCES "User" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

SELECT __create_updatedat_trigger('TriviaQuestion');

CREATE VIRTUAL TABLE "TriviaQuestionFTS" USING fts5 (
  "question",
  "answer",
  "hint1",
  "hint2",
  "submitter",
  "SELECT group_concat(cat.name) FROM N2M_TriviaQuestion_TriviaCategory n2m JOIN TriviaCategory cat ON cat.id = n2m.categoryId WHERE n2m.questionId = $SRC.id",
  prefix = '3 4 5',
  tokenize = 'porter unicode61'
);
INSERT INTO "TriviaQuestionFTS" (
  "TriviaQuestionFTS",
  "rank"
) VALUES (
  'rank',
  'bm25(4, 4, 2, 2, 1, 1)'
);
SELECT __create_fts_sync_triggers('TriviaQuestion', 'TriviaQuestionFTS');
-- END TriviaQuestion --

-- BEGIN N2M_TriviaQuestion_TriviaCategory --
SELECT __create_n2m_table('TriviaQuestion', 'TriviaCategory');
SELECT __create_fts_sync_triggers('TriviaQuestion', 'TriviaQuestionFTS', 'N2M_TriviaQuestion_TriviaCategory');
-- END N2M_TriviaQuestion_TriviaCategory --

-- BEGIN TriviaReport --
CREATE TABLE "TriviaReport" (
  "id" VARCHAR(26) NOT NULL,
  "questionId" VARCHAR(26) NOT NULL,
  "message" VARCHAR(512) NOT NULL,
  "submitter" VARCHAR(256) NOT NULL,
  "submitterUserId" VARCHAR(26),
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE ("questionId", "submitter"),
  FOREIGN KEY ("questionId") REFERENCES "TriviaQuestion" ("id") ON DELETE CASCADE,
  FOREIGN KEY ("submitterUserId") REFERENCES "User" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

SELECT __create_index('TriviaReport', 'questionId');
-- END TriviaReport --
