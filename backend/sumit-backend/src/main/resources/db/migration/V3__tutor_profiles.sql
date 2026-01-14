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
    age INTEGER NOT NULL CHECK (age >= 18 AND age <= 65),
    teaching_experience text,
    status VARCHAR(25) NOT NULL,
    language_id INTEGER NOT NULL REFERENCES languages(id),
    CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
    rejected_reason text,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    town_id INTEGER REFERENCES town(id) ON DELETE RESTRICT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed BOOLEAN NOT NULL DEFAULT FALSE,
    reviewed_at TIMESTAMPTZ
);

CREATE INDEX idx_tutor_status ON tutors (status) WHERE status = 'pending';


--todo when filtering in admin page by pending status, index the tutors table above by pending status and then get all tutor_subjects using that id from index
--todo later add a last online timestamp to make finding tutors for specific company needs easier like if we need a grade 8 maths tutor, search through more active users
CREATE TABLE tutor_subjects (
    tutor_id INTEGER NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    grade_id INTEGER NOT NULL REFERENCES grades(id) ON DELETE CASCADE,
    mark SMALLINT NOT NULL CHECK (mark >= 0 AND mark <= 100),
    town_id INTEGER NOT NULL REFERENCES town(id) ON DELETE RESTRICT,
    language_id INTEGER NOT NULL REFERENCES languages(id) ON DELETE RESTRICT,
    PRIMARY KEY (tutor_id, subject_id, grade_id, town_id, language_id)
);
