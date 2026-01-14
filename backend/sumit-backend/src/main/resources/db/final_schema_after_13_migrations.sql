CREATE TABLE users
(
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    profile_picture_url VARCHAR(500),
    role VARCHAR(20) DEFAULT 'STUDENT',
    check_role CHECK (role IN ('STUDENT', 'TUTOR', 'ADMIN')),
    free_lessons_available SMALLINT NOT NULL DEFAULT 1 CHECK (free_lessons_available >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE province (
                          id SERIAL PRIMARY KEY,
                          name VARCHAR(25) NOT NULL
);

CREATE TABLE town (
                      id SERIAL PRIMARY KEY,
                      name VARCHAR(25) NOT NULL,
                      province_id INTEGER REFERENCES province(id)
);

INSERT INTO province (name) VALUES ('WESTERN_CAPE');
INSERT INTO town (name, province_id) VALUES ('DURBANVILLE', 1);
INSERT INTO town (name, province_id) VALUES ('STELLENBOSCH', 1);

CREATE TABLE subjects (
                          id SERIAL PRIMARY KEY,
                          name VARCHAR(25) NOT NULL
);

ALTER TABLE tutor_subjects
DROP CONSTRAINT tutor_subjects_pkey;

INSERT INTO subjects (name) VALUES ('MATHEMATICS');

CREATE TABLE grades (
                        id SERIAL PRIMARY KEY,
                        grade INTEGER UNIQUE NOT NULL
);

CREATE TABLE languages (
                           id SERIAL PRIMARY KEY,
                           language VARCHAR(25) NOT NULL UNIQUE
);

INSERT INTO languages (language) VALUES ('ENGLISH');

INSERT INTO grades (grade) VALUES (8), (9), (10), (11), (12);

CREATE TABLE tutors (
                        id SERIAL PRIMARY KEY,
                        age SMALLINT NOT NULL CHECK (age >= 18 AND age <= 65),
                        teaching_experience text,
                        status VARCHAR(25) NOT NULL,
                        preferred_language_id INTEGER NOT NULL REFERENCES languages(id),
                        CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
                        rejected_reason text,
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        town_id INTEGER REFERENCES town(id) ON DELETE RESTRICT,
                        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                        reviewed BOOLEAN NOT NULL DEFAULT FALSE,
                        reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_tutor_status ON tutors (status) WHERE status = 'pending';

CREATE TABLE subject_grade_town_language_combos (
                                subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                                grade_id INTEGER NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
                                town_id INTEGER NOT NULL REFERENCES town(id) ON DELETE RESTRICT,
                                language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
                                PRIMARY KEY (tutor_id, subject_id, grade_id, town_id, language_id),
                                CONSTRAINT unique_combos UNIQUE (subject_id, grade_id, town_id, language_id)
);

INSERT INTO subject_grade_town_language_combos (subject_id, grade_id, town_id, language_id)
SELECT s.id, g.id, t.id, l.id
FROM subjects s
         CROSS JOIN grades g
         CROSS JOIN town t
         CROSS JOIN languages l
    ON CONFLICT (subject_id, grade_id, town_id, language_id) DO NOTHING;

CREATE TABLE street
(
    id SERIAL PRIMARY KEY,
    town_id INTEGER NOT NULL REFERENCES town (id) ON DELETE CASCADE,
    street_address VARCHAR(255) NOT NULL,
    latitude double precision NOT NULL,
    longitude double precision NOT NULL,
    url VARCHAR(255) NOT NULL
);

CREATE TABLE group_classes
(
    id SERIAL PRIMARY KEY,
    tutor_id INTEGER NOT NULL REFERENCES tutors (id) ON DELETE RESTRICT,
    combo_id INTEGER NOT NULL REFERENCES subject_grade_town_language_combos (id) ON DELETE RESTRICT, --super vague table name clearly
    class_capacity SMALLINT NOT NULL,
    venue_timeslots_id INTEGER NOT NULL REFERENCES venue_timeslots(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0.00),
    start_date DATE NOT NULL,
    CONSTRAINT check_group_classes_status CHECK (status IN ('SCHEDULED', 'ADMIN_TERMINATED', 'CANCELLED', 'PENDING'))
);

CREATE TABLE tutor_subject_offers (
                                      id SERIAL PRIMARY KEY,
                                      tutor_id INTEGER NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
                                      combo_id INTEGER NOT NULL REFERENCES subject_grade_town_language_combos(id) ON DELETE RESTRICT,
                                      CONSTRAINT uq_tutor_combo UNIQUE (tutor_id, combo_id)
);

CREATE TABLE venue (
                       id SERIAL PRIMARY KEY,
                       street_id INTEGER NOT NULL REFERENCES street(id) ON DELETE RESTRICT,
                       name VARCHAR(255) NOT NULL,
                       max_capacity INTEGER NOT NULL
);

CREATE TABLE timeslots (
                           id SERIAL PRIMARY KEY,
                           start_time TIME NOT NULL,
                           end_time TIME NOT NULL,
                           turnaround_minutes INTEGER NOT NULL DEFAULT 15,
                           CHECK (end_time > start_time),
                           UNIQUE (start_time, end_time, turnaround_minutes)
);

INSERT INTO timeslots (start_time, end_time, turnaround_minutes) VALUES ('15:30:00', '16:45:00', 15), ('17:00:00', '18:15:00', 15), ('18:30:00', '19:45:00', 15);

CREATE TABLE venue_timeslots (
                                 id SERIAL PRIMARY KEY,
                                 venue_id INTEGER NOT NULL REFERENCES venue(id) ON DELETE RESTRICT,
                                 timeslot_id INTEGER NOT NULL REFERENCES timeslots(id) ON DELETE RESTRICT,
                                 day_of_week VARCHAR(10) NOT NULL,
                                 CONSTRAINT uq_venue_timeslots_venue_timeslot_day UNIQUE (venue_id, timeslot_id, day_of_week),
                                 status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE'
);

CREATE UNIQUE INDEX uq_group_classes_one_scheduled_per_slot
    ON group_classes (venue_timeslots_id)
    WHERE status = 'SCHEDULED';

INSERT INTO day_of_week (day) VALUES ('MONDAY'), ('TUESDAY'), ('WEDNESDAY'), ('THURSDAY'), ('FRIDAY'), ('SATURDAY'), ('SUNDAY');

CREATE INDEX idx_subject_town_language_combos ON subject_grade_town_language_combos (subject_id, town_id, language_id);

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
                                          status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ATTENDED', 'ABSENT', 'LATE_CANCEL')),
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