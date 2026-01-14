ALTER TABLE group_classes
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'SCHEDULED',
ADD CONSTRAINT check_group_classes_status CHECK (status IN ('SCHEDULED', 'CANCELLED', 'DELETED'));

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

CREATE TABLE day_of_week (
    id SERIAL PRIMARY KEY,
    day VARCHAR(9) NOT NULL UNIQUE,
    CHECK (day IN ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'))
);

CREATE TABLE venue_timeslots (
    id SERIAL PRIMARY KEY,
    venue_id INTEGER NOT NULL REFERENCES venue(id) ON DELETE RESTRICT,
    timeslot_id INTEGER NOT NULL REFERENCES timeslots(id) ON DELETE RESTRICT,
    day_of_week_id INTEGER NOT NULL REFERENCES day_of_week(id) ON DELETE RESTRICT,
    UNIQUE (venue_id, timeslot_id, day_of_week_id)
);

ALTER TABLE group_classes ADD COLUMN venue_timeslots_id INTEGER NOT NULL REFERENCES venue_timeslots(id) ON DELETE RESTRICT;
ALTER TABLE group_classes RENAME COLUMN max_capacity TO class_capacity;

CREATE UNIQUE INDEX uq_group_classes_one_scheduled_per_slot
    ON group_classes (venue_timeslots_id)
    WHERE status = 'SCHEDULED';

INSERT INTO day_of_week (day) VALUES ('MONDAY'), ('TUESDAY'), ('WEDNESDAY'), ('THURSDAY'), ('FRIDAY'), ('SATURDAY'), ('SUNDAY');