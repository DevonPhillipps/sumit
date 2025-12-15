CREATE TABLE tutor_subject_offers (
    id SERIAL PRIMARY KEY,
    tutor_id INTEGER NOT NULL REFERENCES tutors(id) ON DELETE CASCADE,
    combo_id INTEGER NOT NULL REFERENCES subject_grade_town_language_combos(id) ON DELETE RESTRICT,
    CONSTRAINT uq_tutor_combo UNIQUE (tutor_id, combo_id)
);

