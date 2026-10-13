package com.example.StudentManagement.repository;

import com.example.StudentManagement.entity.Student;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {

    Optional<Student> findByRollNumber(String rollNumber);

    Optional<Student> findByEmail(String email);

    @Query(
        "SELECT s FROM Student s WHERE " +
        "LOWER(s.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
        "LOWER(s.rollNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
        "LOWER(s.email) LIKE LOWER(CONCAT('%', :keyword, '%'))"
    )
    List<Student> searchByKeyword(@Param("keyword") String keyword);
}
