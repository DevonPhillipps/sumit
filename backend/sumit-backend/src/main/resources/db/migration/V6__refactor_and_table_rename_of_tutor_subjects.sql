ALTER TABLE tutor_subjects
    DROP CONSTRAINT tutor_subjects_pkey;

ALTER TABLE tutor_subjects
    DROP COLUMN tutor_id,
    DROP COLUMN mark,
    ADD COLUMN id SERIAL PRIMARY KEY;

ALTER TABLE tutor_subjects RENAME TO subject_grade_town_language_combos;