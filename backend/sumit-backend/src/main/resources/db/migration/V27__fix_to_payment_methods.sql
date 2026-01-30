ALTER TABLE group_class_recurrence DROP CONSTRAINT check_group_class_recurrence_status;

ALTER TABLE group_class_recurrence ADD CONSTRAINT check_group_class_recurrence_status CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'REMOVED', 'COMPLETED_WITHOUT_PAYMENTS'));

ALTER TABLE recurrence_class_student DROP CONSTRAINT recurrence_class_student_payment_method_selected_check;

ALTER TABLE recurrence_class_student ADD CONSTRAINT check_payment_method_selected CHECK (payment_method_selected IN ('CASH', 'FREE_LESSON'));