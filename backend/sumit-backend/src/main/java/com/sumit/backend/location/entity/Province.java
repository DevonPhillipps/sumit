package com.sumit.backend.location.entity;

import jakarta.persistence.*;

@Entity
@Table(name="province")
public class Province {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name="name", nullable = false, length = 25)
    private String name;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String setName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
}
