package com.example.blog.service.impl;

import com.example.blog.dto.ChangePasswordRequest;
import com.example.blog.dto.UserDto;
import com.example.blog.enums.Roles;
import com.example.blog.mapper.UserMapper;
import com.example.blog.model.User;
import com.example.blog.repository.UserRepository;
import com.example.blog.service.MailService;
import com.example.blog.service.PasswordUtil;
import com.example.blog.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Log4j2
public class UserServiceImpl implements UserService {

    private static final String USER_NOT_FOUND_MSG = "User not found with id: ";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final MailService mailService;
    private final UserMapper userMapper;
    private final MongoTemplate mongoTemplate;

    @Override
    @Transactional(readOnly = true)
    public Page<UserDto> getList(Pageable pageable, String searchQuery) {
        Query query = new Query();
        Criteria criteria = new Criteria();
        
        if (searchQuery != null && !searchQuery.trim().isEmpty()) {
            criteria.orOperator(
                Criteria.where("username").regex(searchQuery.toLowerCase(), "i"),
                Criteria.where("email").regex(searchQuery.toLowerCase(), "i"),
                Criteria.where("phone").regex(searchQuery, "i")
            );
        } else {
            criteria.and("roles").in(Roles.MANAGER);
        }

        // Add enabled filter
        criteria.and("enabled").in(null, true);
        query.addCriteria(criteria);
        
        // Create separate query for counting (without pagination)
        Query countQuery = new Query(criteria);
        long total = mongoTemplate.count(countQuery, User.class);
        
        // Apply pagination to the data query
        query.with(pageable);
        List<User> userList = mongoTemplate.find(query, User.class);
        Page<User> users = new PageImpl<>(userList, pageable, total);
        
        return users.map(userMapper::toDto);
    }

    @Override
    @Transactional(readOnly = true)
    public UserDto getById(String id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, USER_NOT_FOUND_MSG + id));
        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public UserDto createManager(UserDto request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }

        String rawPassword = (request.getPassword() == null || request.getPassword().isBlank()) 
                ? PasswordUtil.random(12) 
                : request.getPassword();

        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(rawPassword))
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .roles(Set.of(Roles.MANAGER))
                .build();

        user = userRepository.save(user);
        //sendManagerAccountEmail(user, rawPassword);

        return userMapper.toDto(user);
    }

    @Override
    @Transactional
    public UserDto updateManager(String id, UserDto request) {
        User existingUser = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, USER_NOT_FOUND_MSG + id));

        if (!existingUser.getUsername().equals(request.getUsername()) && 
            userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username already exists");
        }

        if (!existingUser.getEmail().equals(request.getEmail()) && 
            userRepository.existsByEmail(request.getEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already exists");
        }

        existingUser.setUsername(request.getUsername());
        existingUser.setEmail(request.getEmail());
        existingUser.setFullName(request.getFullName());
        existingUser.setPhone(request.getPhone());

        // Only update password if it's provided and not empty
        if (request.getPassword() != null && !request.getPassword().trim().isEmpty()) {
            existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
        }

        User updatedUser = userRepository.save(existingUser);
        return userMapper.toDto(updatedUser);
    }

    @Override
    public UserDto update(String id, UserDto request) {
        User existingUser = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, USER_NOT_FOUND_MSG + id));

        if (request.getFullName() != null) existingUser.setFullName(request.getFullName());
        if (request.getPhone() != null) existingUser.setPhone(request.getPhone());

        User updatedUser = userRepository.save(existingUser);
        return userMapper.toDto(updatedUser);
    }

    @Override
    public boolean changePassword(User u, @Valid ChangePasswordRequest req) {
        if (!passwordEncoder.matches(req.getCurrentPassword(), u.getPassword())) {
            return false;
        }
        u.setPassword(passwordEncoder.encode(req.getNewPassword()));
        userRepository.save(u);
        return true;
    }

    @Override
    public void deleteManager(String id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, USER_NOT_FOUND_MSG + id));

        // Ensure only MANAGER accounts are affected
        if (user.getRoles().contains(Roles.ADMIN)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Admin cannot be deleted");
        }

        user.setEnabled(false);
        userRepository.save(user);
    }

    private void sendManagerAccountEmail(User user, String rawPassword) {
        String body = "Xin chào " + user.getFullName() + ",\n\n" +
                "Tài khoản MANAGER của bạn đã được tạo.\n" +
                "Username: " + user.getUsername() + "\n" +
                "Mật khẩu tạm thời: " + rawPassword + "\n\n" +
                "Vui lòng đăng nhập và đổi mật khẩu ngay khi có thể.";
        
        try {
            mailService.send(user.getEmail(), "Tạo tài khoản MANAGER", body);
        } catch (Exception e) {
            log.error("Failed to send manager account email to {} - {}", user.getEmail(), e.getMessage(), e);
        }
    }
    
}
