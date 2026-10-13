package com.example.StudentManagement.dto;

import java.time.LocalDateTime;

public record StudentResponse(
    Long id,
    String name,
    String rollNumber,
    String branch,
    String email,
    String phone,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {
}
