ALTER TABLE group_classes
DROP CONSTRAINT check_group_classes_status;

ALTER TABLE group_classes
ADD CONSTRAINT check_group_classes_status
CHECK (status IN ('PENDING', 'SCHEDULED', 'CANCELLED', 'ADMIN_TERMINATED'));
