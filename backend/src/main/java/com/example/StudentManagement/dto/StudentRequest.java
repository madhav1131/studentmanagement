package com.example.StudentManagement.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record StudentRequest(
    @NotBlank(message = "Student name is required")
    @Size(max = 100, message = "Student name must not exceed 100 characters")
    String name,

    @NotBlank(message = "Roll number is required")
    @Size(max = 50, message = "Roll number must not exceed 50 characters")
    String rollNumber,

    @NotBlank(message = "Branch is required")
    @Size(max = 80, message = "Branch must not exceed 80 characters")
    String branch,

    @NotBlank(message = "Email is required")
    @Email(message = "Please provide a valid email address")
    @Size(max = 150, message = "Email must not exceed 150 characters")
    String email,

    @Size(max = 20, message = "Phone number must not exceed 20 characters")
    String phone
) {
}
