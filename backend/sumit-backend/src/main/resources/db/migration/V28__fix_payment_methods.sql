ALTER TABLE class_student_payments
DROP COLUMN amount;

ALTER TABLE class_student_payments
    ADD COLUMN amount NUMERIC(10,2) NOT NULL;

ALTER TABLE class_student_payments
    ADD CONSTRAINT class_student_payments_amount_positive
        CHECK (amount >= 0.00);
