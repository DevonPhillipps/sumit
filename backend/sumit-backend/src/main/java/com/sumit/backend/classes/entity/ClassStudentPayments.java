package com.sumit.backend.classes.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "class_student_payments")
public class ClassStudentPayments {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="recurrence_class_student_id", nullable = false)
    private Integer recurrenceClassStudentId;

    @Column(name="amount", nullable = false)
    @Digits(integer = 10, fraction = 2)
    private BigDecimal amount;

    @Column(name="payment_time", nullable = false, insertable = false, updatable = false)
    private Instant paymentTime;

    public ClassStudentPayments() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getRecurrenceClassStudentId() {
        return recurrenceClassStudentId;
    }

    public void setRecurrenceClassStudentId(Integer recurrenceClassStudentId) {
        this.recurrenceClassStudentId = recurrenceClassStudentId;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public Instant getPaymentTime() {
        return paymentTime;
    }

    public void setPaymentTime(Instant paymentTime) {
        this.paymentTime = paymentTime;
    }
}
