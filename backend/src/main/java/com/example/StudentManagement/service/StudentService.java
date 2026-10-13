package com.example.StudentManagement.service;

import com.example.StudentManagement.dto.StudentRequest;
import com.example.StudentManagement.dto.StudentResponse;
import com.example.StudentManagement.entity.Student;
import com.example.StudentManagement.exception.DuplicateResourceException;
import com.example.StudentManagement.exception.StudentNotFoundException;
import com.example.StudentManagement.repository.StudentRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class StudentService {

    private final StudentRepository studentRepository;

    public StudentService(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    public List<StudentResponse> getAllStudents(String sortBy, String direction) {
        String safeSortBy = (sortBy == null || sortBy.isBlank()) ? "id" : sortBy;
        String safeDirection = (direction == null || direction.isBlank()) ? "asc" : direction;

        Sort.Direction sortDirection = safeDirection.equalsIgnoreCase("desc")
            ? Sort.Direction.DESC
            : Sort.Direction.ASC;

        Comparator<Student> comparator = switch (safeSortBy) {
            case "name" -> Comparator.comparing(Student::getName, String.CASE_INSENSITIVE_ORDER);
            case "rollNumber" -> Comparator.comparing(Student::getRollNumber, String.CASE_INSENSITIVE_ORDER);
            case "branch" -> Comparator.comparing(Student::getBranch, String.CASE_INSENSITIVE_ORDER);
            case "email" -> Comparator.comparing(Student::getEmail, String.CASE_INSENSITIVE_ORDER);
            case "createdAt" -> Comparator.comparing(Student::getCreatedAt);
            case "updatedAt" -> Comparator.comparing(Student::getUpdatedAt);
            default -> Comparator.comparing(Student::getId);
        };

        if (sortDirection == Sort.Direction.DESC) {
            comparator = comparator.reversed();
        }

        return studentRepository.findAll(Sort.by(sortDirection, safeSortBy)).stream()
            .sorted(comparator)
            .map(this::toResponse)
            .toList();
    }

    public StudentResponse getStudentById(Long id) {
        Student student = studentRepository.findById(id)
            .orElseThrow(() -> new StudentNotFoundException(id));
        return toResponse(student);
    }

    @Transactional
    public StudentResponse createStudent(StudentRequest request) {
        validateUniqueValues(request.rollNumber(), request.email());

        Student student = new Student();
        student.setName(request.name().trim());
        student.setRollNumber(request.rollNumber().trim());
        student.setBranch(request.branch().trim());
        student.setEmail(request.email().trim());
        student.setPhone(request.phone() != null ? request.phone().trim() : null);

        Student savedStudent = studentRepository.save(student);
        return toResponse(savedStudent);
    }

    @Transactional
    public StudentResponse updateStudent(Long id, StudentRequest request) {
        Student existingStudent = studentRepository.findById(id)
            .orElseThrow(() -> new StudentNotFoundException(id));

        if (!Objects.equals(existingStudent.getRollNumber(), request.rollNumber().trim())
            && studentRepository.findByRollNumber(request.rollNumber().trim()).isPresent()) {
            throw new DuplicateResourceException("Student with roll number '" + request.rollNumber().trim() + "' already exists.");
        }

        if (!Objects.equals(existingStudent.getEmail(), request.email().trim())
            && studentRepository.findByEmail(request.email().trim()).isPresent()) {
            throw new DuplicateResourceException("Student with email '" + request.email().trim() + "' already exists.");
        }

        existingStudent.setName(request.name().trim());
        existingStudent.setRollNumber(request.rollNumber().trim());
        existingStudent.setBranch(request.branch().trim());
        existingStudent.setEmail(request.email().trim());
        existingStudent.setPhone(request.phone() != null ? request.phone().trim() : null);

        Student updatedStudent = studentRepository.save(existingStudent);
        return toResponse(updatedStudent);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findById(id)
            .orElseThrow(() -> new StudentNotFoundException(id));
        studentRepository.delete(student);
    }

    public List<StudentResponse> searchStudents(String keyword) {
        String trimmedKeyword = keyword == null ? "" : keyword.trim();
        if (trimmedKeyword.isEmpty()) {
            return studentRepository.findAll(Sort.by("id").ascending()).stream()
                .map(this::toResponse)
                .toList();
        }

        return studentRepository.searchByKeyword(trimmedKeyword).stream()
            .map(this::toResponse)
            .toList();
    }

    private void validateUniqueValues(String rollNumber, String email) {
        if (studentRepository.findByRollNumber(rollNumber.trim()).isPresent()) {
            throw new DuplicateResourceException("Student with roll number '" + rollNumber.trim() + "' already exists.");
        }

        if (studentRepository.findByEmail(email.trim()).isPresent()) {
            throw new DuplicateResourceException("Student with email '" + email.trim() + "' already exists.");
        }
    }

    private StudentResponse toResponse(Student student) {
        return new StudentResponse(
            student.getId(),
            student.getName(),
            student.getRollNumber(),
            student.getBranch(),
            student.getEmail(),
            student.getPhone(),
            student.getCreatedAt(),
            student.getUpdatedAt()
        );
    }
}
