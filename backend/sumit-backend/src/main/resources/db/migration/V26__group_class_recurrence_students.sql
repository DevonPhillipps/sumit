ALTER TABLE recurrence_class_student DROP COLUMN status;

ALTER TABLE recurrence_class_student ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED';

ALTER TABLE recurrence_class_student ADD CONSTRAINT status_check CHECK (status IN ('SCHEDULED', 'ATTENDED', 'ABSENT', 'CANCELLED', 'TUTOR_CANCELLED'));