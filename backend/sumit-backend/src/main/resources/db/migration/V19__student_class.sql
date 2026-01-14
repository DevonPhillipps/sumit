ALTER TABLE users ADD COLUMN free_lessons_available SMALLINT NOT NULL DEFAULT 1 CHECK (free_lessons_available >= 0);

CREATE TABLE group_class_students (
    id SERIAL PRIMARY KEY,
    group_class_id INTEGER NOT NULL REFERENCES group_classes(id) ON DELETE CASCADE,
    student_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    booked_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    classes_remaining INTEGER NOT NULL DEFAULT 1 CHECK (classes_remaining >= 0),
    number_free_lessons_applied INTEGER NOT NULL DEFAULT 0 CHECK (number_free_lessons_applied >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    CONSTRAINT uq_group_class_students UNIQUE (group_class_id, student_user_id),
    CONSTRAINT check_group_class_students_status CHECK (status IN ('ACTIVE', 'CANCELLED', 'EXPIRED')),
    CONSTRAINT chk_recurring_overrides_pack CHECK ( (booked_recurring = TRUE AND classes_remaining = 0) OR (booked_recurring = FALSE))
);

CREATE TABLE group_class_recurrence (
    id SERIAL PRIMARY KEY,
    group_class_id INTEGER NOT NULL REFERENCES group_classes(id) ON DELETE CASCADE,
    class_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SCHEDULED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_group_class_recurrence UNIQUE (group_class_id, class_date),
    CONSTRAINT check_group_class_recurrence_status CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'REMOVED'))
);

CREATE INDEX idx_group_class_recurrence_upcoming ON group_class_recurrence (group_class_id, class_date) WHERE status = 'scheduled';

CREATE TABLE recurrence_class_student (
    id SERIAL PRIMARY KEY,
    group_class_student_id INTEGER NOT NULL REFERENCES group_class_students(id) ON DELETE CASCADE,
    group_class_recurrence_id INTEGER NOT NULL REFERENCES group_class_recurrence(id) ON DELETE CASCADE,
    CONSTRAINT uq_recurrence_student UNIQUE (group_class_recurrence_id, group_class_student_id)
);

CREATE TABLE class_student_payments (
    id SERIAL PRIMARY KEY,
    recurrence_class_student_id INTEGER NOT NULL REFERENCES recurrence_class_student(id) ON DELETE RESTRICT,
    amount INTEGER NOT NULL,
    payment_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('CASH','EFT','FREE_LESSON', 'UNPAID')),
    CONSTRAINT uq_payment_once UNIQUE (recurrence_class_student_id)
);