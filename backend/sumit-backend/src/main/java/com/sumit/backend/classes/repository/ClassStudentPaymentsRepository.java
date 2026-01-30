package com.sumit.backend.classes.repository;

import com.sumit.backend.classes.entity.ClassStudentPayments;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ClassStudentPaymentsRepository extends JpaRepository<ClassStudentPayments, Integer> {
    boolean existsByRecurrenceClassStudentId(Integer recurrenceClassStudentId);
}
