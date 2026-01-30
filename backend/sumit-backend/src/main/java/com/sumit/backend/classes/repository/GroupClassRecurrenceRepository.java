package com.sumit.backend.classes.repository;

import com.sumit.backend.classes.entity.GroupClassRecurrence;
import com.sumit.backend.classes.entity.GroupClassRecurrenceStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public interface GroupClassRecurrenceRepository extends JpaRepository<GroupClassRecurrence, Integer> {

    @Query(value = "SELECT class_date FROM group_class_recurrence WHERE group_class_id = :classId AND status = :status ORDER BY class_date", nativeQuery = true)
    List<LocalDate> findClassDatesByGroupClassIdAndStatus(@Param("classId") Integer classId, @Param("status") String status);

    List<GroupClassRecurrence> findByGroupClassIdAndStatusOrderByClassDateAsc(Integer groupClassId, GroupClassRecurrenceStatus status, Pageable pageable);

    Integer countByGroupClassIdAndStatusAndClassDateGreaterThanEqual(Integer groupClassId, GroupClassRecurrenceStatus status, LocalDate classDate);

    List<GroupClassRecurrence> findByIdInAndStatusInAndClassDateGreaterThanEqual(Collection<Integer> ids, Collection<GroupClassRecurrenceStatus> statuses, LocalDate classDate);

    List<GroupClassRecurrence> findByGroupClassIdAndClassDateGreaterThanEqual(Integer groupClassId, LocalDate date);

    List<GroupClassRecurrence> findByGroupClassIdInAndStatus(Set<Integer> groupClassId, GroupClassRecurrenceStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<GroupClassRecurrence> findByIdForUpdate(Integer id);
}
