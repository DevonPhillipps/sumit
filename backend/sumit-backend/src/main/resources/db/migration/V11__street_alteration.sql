ALTER TABLE street
ALTER COLUMN latitude TYPE DOUBLE PRECISION
USING latitude::double precision;

ALTER TABLE street
ALTER COLUMN longitude TYPE double precision
USING longitude::double precision;