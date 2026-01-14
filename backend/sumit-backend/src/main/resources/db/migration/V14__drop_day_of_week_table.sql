ALTER TABLE venue_timeslots DROP COLUMN day_of_week_id;

DROP TABLE day_of_week;

ALTER TABLE venue_timeslots ADD COLUMN day_of_week VARCHAR(10) NOT NULL;
