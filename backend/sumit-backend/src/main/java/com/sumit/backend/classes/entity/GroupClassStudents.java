package com.sumit.backend.classes.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.time.LocalDateTime;

@Entity
@Table(name = "group_class_students", uniqueConstraints = {@UniqueConstraint(columnNames = {"group_class_id", "student_user_id"})})
public class GroupClassStudents {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "group_class_id", nullable = false)
    private Integer groupClassId;

    @Column(name = "student_user_id", nullable = false)
    private Integer studentUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private GroupClassStudentStatus status;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "booked_recurring", nullable = false)
    private Boolean bookedRecurring;

    public Integer getId() {
        return id;
    }

    public Integer getGroupClassId() {
        return groupClassId;
    }

    public void setGroupClassId(Integer groupClassId) {
        this.groupClassId = groupClassId;
    }

    public Integer getStudentUserId() {
        return studentUserId;
    }

    public void setStudentUserId(Integer studentUserId) {
        this.studentUserId = studentUserId;
    }

    public GroupClassStudentStatus getStatus() {
        return status;
    }

    public void setStatus(GroupClassStudentStatus status) {
        this.status = status;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(Instant cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public Boolean getBookedRecurring() {
        return bookedRecurring;
    }

    public void setBookedRecurring(Boolean bookedRecurring) {
        this.bookedRecurring = bookedRecurring;
    }
}
