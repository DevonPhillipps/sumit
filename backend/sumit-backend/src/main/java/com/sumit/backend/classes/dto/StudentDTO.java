package com.sumit.backend.classes.dto;

import com.sumit.backend.classes.entity.PaymentMethodSelectedEnum;

public class StudentDTO {
    private Integer studentUserId;
    private Integer recurrenceClassStudentId;
    private String studentFirstName;
    private String studentLastName;
    private String studentEmail;
    private PaymentMethodSelectedEnum paymentMethodSelected;

    public Integer getStudentUserId() {
        return studentUserId;
    }

    public void setStudentUserId(Integer studentUserId) {
        this.studentUserId = studentUserId;
    }

    public String getStudentFirstName() {
        return studentFirstName;
    }

    public void setStudentFirstName(String studentFirstName) {
        this.studentFirstName = studentFirstName;
    }

    public String getStudentLastName() {
        return studentLastName;
    }

    public void setStudentLastName(String studentLastName) {
        this.studentLastName = studentLastName;
    }

    public String getStudentEmail() {
        return studentEmail;
    }

    public void setStudentEmail(String studentEmail) {
        this.studentEmail = studentEmail;
    }

    public PaymentMethodSelectedEnum getPaymentMethodSelected() {
        return paymentMethodSelected;
    }

    public void setPaymentMethodSelected(PaymentMethodSelectedEnum paymentMethodSelected) {
        this.paymentMethodSelected = paymentMethodSelected;
    }

    public Integer getRecurrenceClassStudentId() {
        return recurrenceClassStudentId;
    }

    public void setRecurrenceClassStudentId(Integer recurrenceClassStudentId) {
        this.recurrenceClassStudentId = recurrenceClassStudentId;
    }
}
