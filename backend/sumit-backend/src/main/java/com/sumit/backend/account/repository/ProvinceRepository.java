package com.sumit.backend.account.repository;

import com.sumit.backend.account.entity.Province;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProvinceRepository extends JpaRepository<Province, Integer> {
    Optional<Province> findByName(String name);
    boolean existsByName(String name);
}
