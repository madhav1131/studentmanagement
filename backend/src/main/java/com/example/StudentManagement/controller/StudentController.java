package com.example.StudentManagement.controller;

import com.example.StudentManagement.dto.StudentRequest;
import com.example.StudentManagement.dto.StudentResponse;
import com.example.StudentManagement.service.StudentService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/students")
public class StudentController {

    private final StudentService studentService;

    public StudentController(StudentService studentService) {
        this.studentService = studentService;
    }

    @GetMapping
    public ResponseEntity<List<StudentResponse>> getAllStudents(
        @RequestParam(required = false, defaultValue = "id") String sortBy,
        @RequestParam(required = false, defaultValue = "asc") String direction
    ) {
        return ResponseEntity.ok(studentService.getAllStudents(sortBy, direction));
    }

    @GetMapping("/{id}")
    public ResponseEntity<StudentResponse> getStudentById(@PathVariable Long id) {
        return ResponseEntity.ok(studentService.getStudentById(id));
    }

    @PostMapping
    public ResponseEntity<StudentResponse> createStudent(@Valid @RequestBody StudentRequest request) {
        StudentResponse createdStudent = studentService.createStudent(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdStudent);
    }

    @PutMapping("/{id}")
    public ResponseEntity<StudentResponse> updateStudent(
        @PathVariable Long id,
        @Valid @RequestBody StudentRequest request
    ) {
        StudentResponse updatedStudent = studentService.updateStudent(id, request);
        return ResponseEntity.ok(updatedStudent);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteStudent(@PathVariable Long id) {
        studentService.deleteStudent(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/search")
    public ResponseEntity<List<StudentResponse>> searchStudents(@RequestParam String keyword) {
        return ResponseEntity.ok(studentService.searchStudents(keyword));
    }
}
