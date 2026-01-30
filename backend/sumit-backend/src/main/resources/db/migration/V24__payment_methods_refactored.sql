ALTER TABLE recurrence_class_student ADD COLUMN payment_method_selected VARCHAR(20) CHECK (payment_method_selected IN ('CASH','EFT','FREE_LESSON'));

ALTER TABLE class_student_payments DROP COLUMN payment_method;