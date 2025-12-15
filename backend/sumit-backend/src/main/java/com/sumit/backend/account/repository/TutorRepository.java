package com.sumit.backend.account.repository;

import com.sumit.backend.account.entity.Status;
import com.sumit.backend.account.entity.Tutor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TutorRepository extends JpaRepository<Tutor, Integer> {
    Optional<Tutor> findByUserId(Integer userId);
    boolean existsByUserId(Integer userId);

    List<Tutor> findByStatus(Status status);
}
