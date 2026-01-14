package com.sumit.backend.classes.dto;

import java.math.BigDecimal;

public class GetBookClassPageDTO {
    private Integer groupClassId;
    private BigDecimal price;
    private String classAbout;

    public Integer getGroupClassId() {
        return groupClassId;
    }

    public void setGroupClassId(Integer groupClassId) {
        this.groupClassId = groupClassId;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getClassAbout() {
        return classAbout;
    }

    public void setClassAbout(String classAbout) {
        this.classAbout = classAbout;
    }
}
