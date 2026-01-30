package com.sumit.backend.classes.repository;

import com.sumit.backend.classes.entity.GroupClassRecurrenceStudents;
import com.sumit.backend.classes.entity.GroupClassRecurrenceStudentsStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Set;

@Repository
public interface GroupClassRecurrenceStudentsRepository extends JpaRepository<GroupClassRecurrenceStudents, Integer> {
    List<GroupClassRecurrenceStudents> findByGroupClassStudentIdIn(Set<Integer> groupClassStudentIds);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<GroupClassRecurrenceStudents> findByGroupClassStudentIdAndStatusAndGroupClassRecurrenceIdIn(
            Integer groupClassStudentId,
            GroupClassRecurrenceStudentsStatus status,
            Collection<Integer> groupClassRecurrenceIds
    );

    List<GroupClassRecurrenceStudents> findByGroupClassRecurrenceIdInAndStatus(Set<Integer> groupClassRecurrenceIds, GroupClassRecurrenceStudentsStatus status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<GroupClassRecurrenceStudents> findAllById(Iterable<Integer> ids);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<GroupClassRecurrenceStudents> findByGroupClassRecurrenceIdAndStatus(Integer groupClassRecurrenceId, GroupClassRecurrenceStudentsStatus status);

}
