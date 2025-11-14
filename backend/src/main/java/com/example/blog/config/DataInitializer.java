package com.example.blog.config;

import com.example.blog.enums.Roles;
import com.example.blog.model.User;
import com.example.blog.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

@Configuration
@RequiredArgsConstructor
public class DataInitializer {
    private final PasswordEncoder passwordEncoder;

    @Bean
    CommandLineRunner initUsers(UserRepository users) {
        return args -> {
            if (users.findByUsername("admin").isEmpty()) {
                users.save(User.builder()
                        .username("admin")
                        .email("admin@gmail.com")
                        .password(passwordEncoder.encode("admin123"))
                        .fullName("Admin")
                        .phone("0123456789")
                        .roles(Set.of(Roles.ADMIN))
                        .build());
            }
            if (users.findByUsername("manager1").isEmpty()) {
                users.save(User.builder()
                        .username("manager1")
                        .email("manager1@gmail.com")
                        .password(passwordEncoder.encode("manager123"))
                        .fullName("Manager1")
                        .phone("0987654321")
                        .roles(Set.of(Roles.MANAGER))
                        .build());
            }
            if (users.findByUsername("manager2").isEmpty()) {
                users.save(User.builder()
                        .username("manager2")
                        .email("manager2@gmail.com")
                        .password(passwordEncoder.encode("manager123"))
                        .fullName("Manager2")
                        .phone("0987654321")
                        .roles(Set.of(Roles.MANAGER))
                        .build());
            }
        };
    }
}
