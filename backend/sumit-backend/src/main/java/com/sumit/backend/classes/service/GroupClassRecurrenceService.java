package com.sumit.backend.classes.service;

import com.sumit.backend.classes.entity.GroupClassRecurrence;
import com.sumit.backend.classes.entity.GroupClassRecurrenceStatus;
import com.sumit.backend.classes.repository.GroupClassRecurrenceRepository;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class GroupClassRecurrenceService {
    @Autowired
    GroupClassRecurrenceRepository groupClassRecurrenceRepository;

    @Transactional
    public void setAllGroupClassRecurrences(Integer groupClassId, DayOfWeek classDay, LocalDate startDate, LocalDate endDate) {
        LocalDate currentDate = startDate;

        if (groupClassId == null) throw new IllegalArgumentException("groupClassId required");
        if (classDay == null) throw new IllegalArgumentException("classDay required");
        if (startDate == null) throw new IllegalArgumentException("startDate required");
        if (endDate == null) throw new IllegalArgumentException("endDate required");
        if (endDate.isBefore(startDate)) throw new IllegalArgumentException("endDate before startDate");


        while (currentDate.getDayOfWeek() != classDay) {
            currentDate = currentDate.plusDays(1);
        }

        List<GroupClassRecurrence> groupClassRecurrences = new ArrayList<>();
        while (!currentDate.isAfter(endDate)) {
            GroupClassRecurrence groupClassRecurrence = new GroupClassRecurrence();
            groupClassRecurrence.setGroupClassId(groupClassId);
            groupClassRecurrence.setClassDate(currentDate);
            groupClassRecurrence.setStatus(GroupClassRecurrenceStatus.SCHEDULED);
            groupClassRecurrence.setCreatedAt(Instant.now());
            groupClassRecurrences.add(groupClassRecurrence);
            currentDate = currentDate.plusWeeks(1);
        }
        groupClassRecurrenceRepository.saveAll(groupClassRecurrences);
    }
}
