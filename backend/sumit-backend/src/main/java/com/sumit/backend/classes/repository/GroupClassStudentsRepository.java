package com.sumit.backend.classes.repository;

import com.sumit.backend.classes.entity.GroupClassStudentStatus;
import com.sumit.backend.classes.entity.GroupClassStudents;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface GroupClassStudentsRepository extends JpaRepository<GroupClassStudents, Integer>{
    Integer countByGroupClassIdAndStatus(Integer groupClassId, GroupClassStudentStatus status);
    boolean existsByStudentUserIdAndGroupClassId(Integer userId, Integer groupClassId);
}
