package com.example.blog.repository;

import com.example.blog.enums.Roles;
import com.example.blog.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findByUsername(String username);
    Optional<User> findByEmail(String email);
    boolean existsByUsername(String username);
    boolean existsByEmail(String email);
    
    Page<User> findByRolesContaining(Roles role, Pageable pageable);
    
    Page<User> findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrPhoneContaining(
        String username, String email, String phone, Pageable pageable);
        
}
