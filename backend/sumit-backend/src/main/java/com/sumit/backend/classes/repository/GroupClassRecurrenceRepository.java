package com.sumit.backend.classes.repository;

import com.sumit.backend.classes.entity.GroupClassRecurrence;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroupClassRecurrenceRepository extends JpaRepository<GroupClassRecurrence, Integer> {

}
