package com.sumit.backend.reference.academics.grades.repository;

import com.sumit.backend.reference.academics.grades.entity.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

import java.util.Optional;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Integer> {
    Optional<Grade> findByGrade(Integer grade);
    boolean existsByGrade(Integer grade);
}
