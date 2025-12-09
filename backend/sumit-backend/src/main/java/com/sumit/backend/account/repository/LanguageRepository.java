package com.sumit.backend.account.repository;

import com.sumit.backend.account.entity.Language;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LanguageRepository extends JpaRepository<Language, Integer> {
    Optional<Language> findByName(String name);
    boolean existsByName(String name);
}
