ALTER TABLE subject_grade_town_language_combos
ADD CONSTRAINT unique_combos UNIQUE (subject_id, grade_id, town_id, language_id);

INSERT INTO subject_grade_town_language_combos (subject_id, grade_id, town_id, language_id)
SELECT s.id, g.id, t.id, l.id
FROM subjects s
    CROSS JOIN grades g
    CROSS JOIN town t
    CROSS JOIN languages l
    ON CONFLICT (subject_id, grade_id, town_id, language_id) DO NOTHING;