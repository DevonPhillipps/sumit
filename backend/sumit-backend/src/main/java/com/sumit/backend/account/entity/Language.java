package com.sumit.backend.account.entity;

import jakarta.persistence.*;

@Entity
@Table(name="languages")
public class Language {
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Integer id;

    @Column(name="language", nullable=false, unique=true, length=25)
    private String name;

    public Language() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
