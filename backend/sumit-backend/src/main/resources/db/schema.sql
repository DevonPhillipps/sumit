-- =========================================
-- SUMIT FINAL SCHEMA (post-v9 consolidated). Might be wrong. I copied all migrations into gpt and said compile it into 1 schema
-- =========================================

-- ========== USERS ==========
CREATE TABLE users (
                       id SERIAL PRIMARY KEY,
                       first_name VARCHAR(100) NOT NULL,
                       surname VARCHAR(100) NOT NULL,
                       email VARCHAR(100) NOT NULL UNIQUE,
                       phone_number VARCHAR(20) NOT NULL UNIQUE, -- allows +27 and preserves leading 0s
                       password_hash VARCHAR(255) NOT NULL,
                       profile_picture_url VARCHAR(500),
                       bio TEXT,

                       role VARCHAR(20) NOT NULL DEFAULT 'student',
                       CONSTRAINT check_role CHECK (role IN ('student', 'tutor', 'admin')),

                       created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ========== PROVINCE / TOWN ==========
CREATE TABLE province (
                          id SERIAL PRIMARY KEY,
                          name VARCHAR(25) NOT NULL
);

CREATE TABLE town (
                      id SERIAL PRIMARY KEY,
                      name VARCHAR(25) NOT NULL,
                      province_id INTEGER REFERENCES province(id)
);

CREATE TABLE street
(
    id SERIAL PRIMARY KEY,
    town_id INTEGER NOT NULL REFERENCES town (id) ON DELETE CASCADE,
    street_address VARCHAR(255) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    url VARCHAR(255) NOT NULL
);

CREATE TABLE group_classes
(
    id SERIAL PRIMARY KEY,
    tutor_id INTEGER NOT NULL REFERENCES tutors (id) ON DELETE RESTRICT,
    class_type_id INTEGER NOT NULL REFERENCES subject_grade_town_language_combos (id) ON DELETE RESTRICT, --super vague table name clearly
    street_id INTEGER NOT NULL REFERENCES street (id) ON DELETE RESTRICT,
    day_of_week SMALLINT CHECK (day_of_week BETWEEN 1 AND 7), --  1 = monday, 7 = sunday
    start_time TIME NOT NULL,
    max_capacity SMALLINT NOT NULL,
    current_capacity SMALLINT NOT NULL
);

-- ========== SUBJECTS / GRADES / LANGUAGES ==========
CREATE TABLE subjects (
                          id SERIAL PRIMARY KEY,
                          name VARCHAR(25) NOT NULL
);

CREATE TABLE grades (
                        id SERIAL PRIMARY KEY,
                        grade INTEGER UNIQUE NOT NULL
);

CREATE TABLE languages (
                           id SERIAL PRIMARY KEY,
                           language VARCHAR(25) NOT NULL UNIQUE
);

-- ========== TUTORS ==========
CREATE TABLE tutors (
                        id SERIAL PRIMARY KEY,
                        age SMALLINT NOT NULL CHECK (age >= 18 AND age <= 65),
                        teaching_experience TEXT,

                        status VARCHAR(25) NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn')),
                        rejected_reason TEXT,

                        preferred_language_id INTEGER NOT NULL REFERENCES languages(id),
                        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                        town_id INTEGER REFERENCES town(id) ON DELETE RESTRICT,

                        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
                        reviewed BOOLEAN NOT NULL DEFAULT FALSE,
                        reviewed_at TIMESTAMP
);

CREATE INDEX idx_tutor_status
    ON tutors (status)
    WHERE status = 'pending';

-- ========== SUBJECT/GRADE/TOWN/LANGUAGE COMBOS (v6 -> v8 result) ==========
CREATE TABLE subject_grade_town_language_combos (
                                                    id SERIAL PRIMARY KEY,
                                                    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
                                                    grade_id INTEGER NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
                                                    town_id INTEGER NOT NULL REFERENCES town(id) ON DELETE RESTRICT,
                                                    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,

                                                    CONSTRAINT unique_combos UNIQUE (subject_id, grade_id, town_id, language_id)
);

-- ========== TUTOR SUBJECT OFFERS (v9) ==========
CREATE TABLE tutor_subject_offers (
                                      id SERIAL PRIMARY KEY,
                                      tutor_id INTEGER NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
                                      combo_id INTEGER NOT NULL REFERENCES subject_grade_town_language_combos(id) ON DELETE RESTRICT,
                                      CONSTRAINT uq_tutor_combo UNIQUE (tutor_id, combo_id)
);

-- ========== SEED DATA ==========
INSERT INTO province (name) VALUES ('western cape');

INSERT INTO town (name, province_id) VALUES
                                         ('durbanville', 1),
                                         ('stellenbosch', 1);

INSERT INTO subjects (name) VALUES
                                ('mathematics'),
                                ('physics'),
                                ('accounting');

INSERT INTO grades (grade) VALUES
                               (8), (9), (10), (11), (12);

INSERT INTO languages (language) VALUES
                                     ('english'),
                                     ('afrikaans');

-- ========== POPULATE ALL COMBOS (v8) ==========
INSERT INTO subject_grade_town_language_combos (subject_id, grade_id, town_id, language_id)
SELECT s.id, g.id, t.id, l.id
FROM subjects s
         CROSS JOIN grades g
         CROSS JOIN town t
         CROSS JOIN languages l
    ON CONFLICT (subject_id, grade_id, town_id, language_id) DO NOTHING;
