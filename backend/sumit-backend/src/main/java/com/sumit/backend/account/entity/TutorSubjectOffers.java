package com.sumit.backend.account.entity;

import jakarta.persistence.*;

@Entity
@Table(name="tutor_subject_offers")
public class TutorSubjectOffers {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Integer id;

    @Column(name="tutor_id", nullable = false)
    private Integer tutorId;

    @Column(name="combo_id", nullable = false)
    private Integer comboId;

    public TutorSubjectOffers() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getTutorId() {
        return tutorId;
    }

    public void setTutorId(Integer tutorId) {
        this.tutorId = tutorId;
    }

    public Integer getComboId() {
        return comboId;
    }

    public void setComboId(Integer comboId) {
        this.comboId = comboId;
    }
}
