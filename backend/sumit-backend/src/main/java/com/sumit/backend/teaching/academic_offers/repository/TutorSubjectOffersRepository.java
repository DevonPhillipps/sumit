package com.sumit.backend.teaching.academic_offers.repository;

import com.sumit.backend.teaching.academic_offers.entity.TutorSubjectOffers;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TutorSubjectOffersRepository extends JpaRepository<TutorSubjectOffers, Integer> {
    List<TutorSubjectOffers> findByTutorId(Integer tutorId);
    boolean existsByTutorIdAndComboId(Integer tutorId, Integer comboId);
}
