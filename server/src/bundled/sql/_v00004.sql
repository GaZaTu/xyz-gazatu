SELECT __drop_auditlog_triggers('User');

ALTER TABLE "User" DROP COLUMN "password";

SELECT __create_auditlog_triggers('User', 'I,U,D', 'SELECT SRC.username');
