CREATE TABLE street
(
    id SERIAL PRIMARY KEY,
    town_id INTEGER NOT NULL REFERENCES town (id) ON DELETE CASCADE,
    street_address VARCHAR(255) NOT NULL,
    latitude NUMERIC(9, 6) NOT NULL,
    longitude NUMERIC(9, 6) NOT NULL
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