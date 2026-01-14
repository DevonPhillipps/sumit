package com.sumit.backend.teaching.academic_offers.repository;

import com.sumit.backend.teaching.academic_offers.entity.Combo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComboRepository extends JpaRepository<Combo, Integer> {
    boolean existsByGradeIdAndSubjectIdAndLanguageIdAndTownId(Integer gradeId, Integer subjectId, Integer languageId, Integer townId);
    Optional<Combo> findByGradeIdAndSubjectIdAndLanguageIdAndTownId(Integer gradeId, Integer subjectId, Integer languageId, Integer townId);
    List<Combo> findByTownIdAndSubjectIdAndLanguageId(Integer townId, Integer subjectId, Integer languageId);
}
