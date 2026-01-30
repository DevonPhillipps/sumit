package com.sumit.backend.classes.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "recurrence_class_student")
public class GroupClassRecurrenceStudents {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="group_class_recurrence_id", nullable = false)
    private Integer groupClassRecurrenceId;

    @Column(name="group_class_student_id", nullable = false)
    private Integer groupClassStudentId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private GroupClassRecurrenceStudentsStatus status;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_method_selected")
    private PaymentMethodSelectedEnum paymentMethodSelected;

    public GroupClassRecurrenceStudents() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getGroupClassRecurrenceId() {
        return groupClassRecurrenceId;
    }

    public void setGroupClassRecurrenceId(Integer recurrenceClassId) {
        this.groupClassRecurrenceId = recurrenceClassId;
    }

    public Integer getGroupClassStudentId() {
        return groupClassStudentId;
    }

    public void setGroupClassStudentId(Integer groupClassStudentId) {
        this.groupClassStudentId = groupClassStudentId;
    }

    public GroupClassRecurrenceStudentsStatus getStatus() {
        return status;
    }

    public void setStatus(GroupClassRecurrenceStudentsStatus status) {
        this.status = status;
    }

    public PaymentMethodSelectedEnum getPaymentMethodSelected() {
        return paymentMethodSelected;
    }

    public void setPaymentMethodSelected(PaymentMethodSelectedEnum paymentMethodSelected) {
        this.paymentMethodSelected = paymentMethodSelected;
    }
}
