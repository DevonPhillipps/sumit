package com.sumit.backend.classes.repository;

import com.sumit.backend.classes.entity.GroupClassStatus;
import com.sumit.backend.classes.entity.GroupClasses;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GroupClassesRepository extends JpaRepository<GroupClasses, Integer> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT gc FROM GroupClasses gc WHERE gc.id = :id")
    Optional<GroupClasses> findByIdForUpdate(@Param("id") Integer id);
    List<GroupClasses> findAllByComboIdAndStatus(Integer comboId, GroupClassStatus status);
    List<GroupClasses> findAllByTutorId(Integer tutorId);
    List<GroupClasses> findAllByStatus(GroupClassStatus groupClassStatus);
    List<GroupClasses> findAllByTutorIdAndStatus(Integer tutorId, GroupClassStatus status);
    long countByStatus(GroupClassStatus status);
}
