ALTER TABLE users
ADD COLUMN role VARCHAR(20) DEFAULT 'student';

ALTER TABLE users
ADD CONSTRAINT check_role CHECK (role IN ('student', 'tutor', 'admin'));

ALTER TABLE users
DROP COLUMN bio