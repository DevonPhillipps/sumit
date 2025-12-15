package com.sumit.backend.account.repository;

import com.sumit.backend.account.entity.Combo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ComboRepository extends JpaRepository<Combo, Integer> {
    boolean existsByGradeIdAndSubjectIdAndLanguageIdAndTownId(Integer gradeId, Integer subjectId, Integer languageId, Integer townId);
    Optional<Combo> findByGradeIdAndSubjectIdAndLanguageIdAndTownId(Integer gradeId, Integer subjectId, Integer languageId, Integer townId);
}
