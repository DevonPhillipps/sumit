package com.sumit.backend.classes.dto;

import com.sumit.backend.classes.entity.GroupClassRecurrenceStudentsStatus;
import com.sumit.backend.classes.entity.PaymentMethodSelectedEnum;

public class ValidateStudentPaymentDTO {
    private Integer recurrenceStudentId;
    private PaymentMethodSelectedEnum paymentMethodSelected;
    private GroupClassRecurrenceStudentsStatus status;
    private String amountPaid;

    public Integer getRecurrenceStudentId() {
        return recurrenceStudentId;
    }

    public void setRecurrenceStudentId(Integer recurrenceStudentId) {
        this.recurrenceStudentId = recurrenceStudentId;
    }

    public PaymentMethodSelectedEnum getPaymentMethodSelected() {
        return paymentMethodSelected;
    }

    public void setPaymentMethodSelected(PaymentMethodSelectedEnum paymentMethodSelected) {
        this.paymentMethodSelected = paymentMethodSelected;
    }

    public GroupClassRecurrenceStudentsStatus getStatus() {
        return status;
    }

    public void setStatus(GroupClassRecurrenceStudentsStatus status) {
        this.status = status;
    }

    public String getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(String amountPaid) {
        this.amountPaid = amountPaid;
    }

    public String getAmountPaidInString() {
        return amountPaid;
    }

    public String setAmountPaidInString(String amountPaid) {
        return amountPaid;
    }


}
