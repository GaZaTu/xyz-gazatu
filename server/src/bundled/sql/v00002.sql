-- BEGIN BlogEntry --
CREATE TABLE "BlogEntry" (
  "id" VARCHAR(26) NOT NULL,
  "story" VARCHAR(256) NOT NULL,
  "title" VARCHAR(256) NOT NULL,
  "message" TEXT,
  "imageFileExtension" VARCHAR(8) NOT NULL,
  "imageWidth" INTEGER NOT NULL,
  "imageHeight" INTEGER NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE ("story", "title"),
  PRIMARY KEY ("id")
);

SELECT __create_updatedat_trigger('BlogEntry');
-- END BlogEntry --

-- BEGIN UserGroup --
CREATE TABLE "UserGroup" (
  "id" VARCHAR(26) NOT NULL,
  "name" VARCHAR(256) NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE ("name"),
  PRIMARY KEY ("id")
);

SELECT __create_updatedat_trigger('UserGroup');
-- END UserGroup --

SELECT __create_n2m_table('UserGroup', 'User');

INSERT INTO "UserGroup" (
  "id",
  "name"
)
SELECT
  new_ulid(),
  "name"
FROM "UserRole";

INSERT INTO "N2M_UserGroup_User"
SELECT
  grp."id",
  n2m."User_id"
FROM "N2M_User_UserRole" n2m
JOIN "UserRole" rol ON rol."id" = n2m."UserRole_id"
JOIN "UserGroup" grp ON grp."name" = rol."name";

CREATE TRIGGER "trg_UserRole_after_insert_sync_UserGroup"
AFTER INSERT ON "UserRole" FOR EACH ROW
BEGIN
  INSERT INTO "UserGroup" (
    "id",
    "name"
  )
  SELECT
    new_ulid(),
    NEW."name";
END;

CREATE TRIGGER "trg_UserRole_after_delete_sync_UserGroup"
AFTER DELETE ON "UserRole" FOR EACH ROW
BEGIN
  DELETE FROM "UserGroup" grp
  WHERE
    grp."name" = OLD."name";
END;

CREATE TRIGGER "trg_N2M_User_UserRole_after_insert_sync_N2M_UserGroup_User"
AFTER INSERT ON "N2M_User_UserRole" FOR EACH ROW
BEGIN
  INSERT INTO "N2M_UserGroup_User"
  SELECT
    (SELECT grp."id" FROM "UserGroup" grp JOIN "UserRole" rol ON rol."name" = grp."name" WHERE rol."id" = NEW."UserRole_id"),
    NEW."User_id";
END;

CREATE TRIGGER "trg_N2M_User_UserRole_after_delete_sync_N2M_UserGroup_User"
AFTER DELETE ON "N2M_User_UserRole" FOR EACH ROW
BEGIN
  DELETE FROM "N2M_UserGroup_User" n2m
  WHERE
    n2m."UserGroup_id" = (SELECT grp."id" FROM "UserGroup" grp JOIN "UserRole" rol ON rol."name" = grp."name" WHERE rol."id" = OLD."UserRole_id") AND
    n2m."User_id" = OLD."User_id";
END;

-- BEGIN UploadedFile --
CREATE TABLE "UploadedFile" (
  "id" VARCHAR(26) NOT NULL,
  "dirname" TEXT NOT NULL,
  "basename" TEXT NOT NULL,
  "path" TEXT NOT NULL AS ("dirname" || '/' || "basename"),
  "isDirectory" BOOLEAN NOT NULL,
  "ownerId" VARCHAR(26),
  "groupId" VARCHAR(26),
  "writableByGroup" BOOLEAN NOT NULL DEFAULT false,
  "readableByPublic" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE ("dirname", "basename", "ownerId"),
  FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE SET NULL,
  FOREIGN KEY ("groupId") REFERENCES "UserGroup" ("id") ON DELETE SET NULL,
  PRIMARY KEY ("id")
);

SELECT __create_updatedat_trigger('UploadedFile');

CREATE VIRTUAL TABLE "UploadedFileFTS" USING fts5 (
  "basename",
  prefix = '3 4 5',
  tokenize = 'porter unicode61'
);
SELECT __create_fts_sync_triggers('UploadedFile', 'UploadedFileFTS');
-- END UploadedFile --
