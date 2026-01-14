package com.sumit.backend.account.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;

@Entity
@Table(name="tutors")
public class Tutor {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="age", nullable = false)
    private short age;

    @Column(name="teaching_experience")
    private String teachingExperience;

    @Enumerated(EnumType.STRING)
    @Column(name="status", length=25)
    private Status status;

    @Column(name="preferred_language_id", nullable=false)
    private Integer preferredLanguageId;

    @Column(name="rejected_reason")
    private String rejectedReason;

    @Column(name="user_id")
    private Integer userId;

    @Column(name="town_id")
    private Integer townId;

    @CreationTimestamp
    @Column(name="created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name="reviewed", nullable = false)
    private Boolean reviewed = false;

    @Column(name="reviewed_at")
    private Instant reviewedAt;

    public Tutor() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public short getAge() {
        return age;
    }

    public void setAge(short age) {
        this.age = age;
    }

    public String getTeachingExperience() {
        return teachingExperience;
    }

    public void setTeachingExperience(String teachingExperience) {
        this.teachingExperience = teachingExperience;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public Integer getPreferredLanguageId() {
        return preferredLanguageId;
    }

    public void setPreferredLanguageId(Integer preferredLanguageId) {
        this.preferredLanguageId = preferredLanguageId;
    }

    public String getRejectedReason() {
        return rejectedReason;
    }

    public void setRejectedReason(String rejectedReason) {
        this.rejectedReason = rejectedReason;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getTownId() {
        return townId;
    }

    public void setTownId(Integer townId) {
        this.townId = townId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Boolean getReviewed() {
        return reviewed;
    }

    public void setReviewed(Boolean reviewed) {
        this.reviewed = reviewed;
    }

    public Instant getReviewedAt() {
        return reviewedAt;
    }

    public void setReviewedAt(Instant reviewedAt) {
        this.reviewedAt = reviewedAt;
    }
}
