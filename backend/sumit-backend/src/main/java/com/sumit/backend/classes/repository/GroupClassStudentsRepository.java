package com.sumit.backend.classes.repository;

import com.sumit.backend.classes.entity.GroupClassStudentStatus;
import com.sumit.backend.classes.entity.GroupClassStudents;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface GroupClassStudentsRepository extends JpaRepository<GroupClassStudents, Integer>{
    Integer countByGroupClassIdAndStatus(Integer groupClassId, GroupClassStudentStatus status);
    boolean existsByStudentUserIdAndGroupClassIdAndStatus(Integer userId, Integer groupClassId, GroupClassStudentStatus status);
    List<GroupClassStudents> findByStudentUserIdAndStatus(Integer userId, GroupClassStudentStatus status);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<GroupClassStudents> findByStudentUserIdAndGroupClassIdAndStatus(Integer userId, Integer groupClassId, GroupClassStudentStatus status);

    List<GroupClassStudents> findByIdIn(Set<Integer> ids);
}
