package com.sumit.backend.timeslots.repository;

import com.sumit.backend.timeslots.entity.Timeslots;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TimeslotsRepository extends JpaRepository<Timeslots, Integer> {

}
