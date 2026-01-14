package com.sumit.backend.location.repository;

import com.sumit.backend.location.entity.Street;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StreetRepository extends JpaRepository<Street, Integer> {
    List<Street> findByTownId(Integer townId);
}
