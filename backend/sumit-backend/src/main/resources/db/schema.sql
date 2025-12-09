--FULL DB SCHEMA. LAST UPDATED AFTER V5 DB PUSH

-- ========== USERS ==========
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    surname VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20) NOT NULL UNIQUE, -- Allows +27 and preserves leading 0s
    password_hash VARCHAR(255) NOT NULL,
    profile_picture_url VARCHAR(500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    role VARCHAR(20) DEFAULT 'student',
    CONSTRAINT check_role CHECK (role IN ('student', 'tutor', 'admin'))
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

CREATE INDEX idx_tutor_status ON tutors (status) WHERE status = 'pending';

-- ========== TUTOR SUBJECTS ==========
CREATE TABLE tutor_subjects (
    tutor_id INTEGER NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade_id INTEGER NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    mark SMALLINT NOT NULL CHECK (mark >= 0 AND mark <= 100),
    town_id INTEGER NOT NULL REFERENCES town(id) ON DELETE RESTRICT,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
    PRIMARY KEY (tutor_id, subject_id, grade_id, town_id, language_id)
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
