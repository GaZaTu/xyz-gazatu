-- BEGIN UserRole --
CREATE TABLE "UserRole" (
  "id" VARCHAR(26) NOT NULL,
  "name" VARCHAR(256) NOT NULL,
  "description" VARCHAR(512),
  UNIQUE ("name"),
  PRIMARY KEY ("id")
);
-- END UserRole --

INSERT INTO "UserRole" (
  "id",
  "name"
) VALUES (
  new_ulid(),
  'admin'
);

-- BEGIN User --
CREATE TABLE "User" (
  "id" VARCHAR(26) NOT NULL,
  "username" VARCHAR(256) NOT NULL,
  "email" VARCHAR(256),
  "activated" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE ("username"),
  UNIQUE ("email"),
  PRIMARY KEY ("id")
);

SELECT __create_updatedat_trigger('User');
-- END User --

SELECT __create_n2m_table('User', 'UserRole');

-- BEGIN UserPrivate --
CREATE TABLE "UserPrivate" (
  "userId" VARCHAR(26) NOT NULL,
  "password" VARCHAR(256),
  "passwordResetId" VARCHAR(26),
  "passwordResetAt" TIMESTAMPTZ,
  UNIQUE ("passwordResetId"),
  FOREIGN KEY ("userId") REFERENCES "User" ("id"),
  PRIMARY KEY ("userId")
);

SELECT __create_index('UserPrivate', 'passwordResetId');
-- END UserPrivate --

-- BEGIN UserPushSubscription --
CREATE TABLE "UserPushSubscription" (
  "id" VARCHAR(26) NOT NULL,
  "userId" VARCHAR(26) NOT NULL,
  "info" TEXT NOT NULL DEFAULT '',
  "json" TEXT NOT NULL,
  "failures" INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY ("userId") REFERENCES "User" ("id"),
  PRIMARY KEY ("id")
);

SELECT __create_index('UserPushSubscription', 'userId');
-- END UserPushSubscription --

SELECT __create_auditlog_table();

SELECT __create_auditlog_triggers('User', 'I,U,D', 'SELECT SRC.username');
SELECT __create_auditlog_triggers(__get_n2m_table_name('User', 'UserRole'), 'I,U,D', 'SELECT ''User:		'' || (SELECT username FROM User WHERE id = SRC.User_id) || char(10) || ''UserRole:	'' || (SELECT name FROM UserRole WHERE id = SRC.UserRole_id)');
