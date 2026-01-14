ALTER TABLE venue_timeslots
DROP CONSTRAINT IF EXISTS venue_timeslots_venue_id_timeslot_id_day_of_week_id_key;

ALTER TABLE venue_timeslots ADD CONSTRAINT uq_venue_timeslots_venue_timeslot_day UNIQUE (venue_id, timeslot_id, day_of_week);
