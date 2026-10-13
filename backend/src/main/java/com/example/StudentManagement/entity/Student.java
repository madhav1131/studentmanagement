package com.example.StudentManagement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

@Entity
@Table(
    name = "students",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_students_roll_number", columnNames = "roll_number"),
        @UniqueConstraint(name = "uk_students_email", columnNames = "email")
    }
)
public class Student {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Student name is required")
    @Size(max = 100, message = "Student name must not exceed 100 characters")
    @Column(nullable = false, length = 100)
    private String name;

    @NotBlank(message = "Roll number is required")
    @Size(max = 50, message = "Roll number must not exceed 50 characters")
    @Column(name = "roll_number", nullable = false, unique = true, length = 50)
    private String rollNumber;

    @NotBlank(message = "Branch is required")
    @Size(max = 80, message = "Branch must not exceed 80 characters")
    @Column(nullable = false, length = 80)
    private String branch;

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    @Column(length = 20)
    private String phone;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Student() {
    }

    public Student(String name, String rollNumber, String branch, String email, String phone) {
        this.name = name;
        this.rollNumber = rollNumber;
        this.branch = branch;
        this.email = email;
        this.phone = phone;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getRollNumber() {
        return rollNumber;
    }

    public void setRollNumber(String rollNumber) {
        this.rollNumber = rollNumber;
    }

    public String getBranch() {
        return branch;
    }

    public void setBranch(String branch) {
        this.branch = branch;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
