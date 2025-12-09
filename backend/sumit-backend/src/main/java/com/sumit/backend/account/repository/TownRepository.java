package com.sumit.backend.account.repository;

import com.sumit.backend.account.entity.Town;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TownRepository extends JpaRepository<Town, Integer> {
    Optional<Town> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
    Optional<Town> findByProvinceId(Integer provinceId);
    boolean existsByProvinceId(Integer provinceId);
}
