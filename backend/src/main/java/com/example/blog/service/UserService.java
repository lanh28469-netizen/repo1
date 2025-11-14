package com.example.blog.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.RequestBody;

import com.example.blog.dto.ChangePasswordRequest;
import com.example.blog.dto.UserDto;
import com.example.blog.model.User;

import jakarta.validation.Valid;

public interface UserService {

    Page<UserDto> getList(Pageable pageable, String searchQuery);

    UserDto getById(String id);

    /*
     * Admin create Manager user
     */
    UserDto createManager(UserDto request);

    /*
     * Admin update user info
     */
    UserDto updateManager(String id, UserDto request);

    /*
     * Admin delete an user
     */
    void deleteManager(String id);

    /*
     * User update profile
     */
    UserDto update(String id, UserDto request);

    boolean changePassword(@AuthenticationPrincipal User u, @Valid @RequestBody ChangePasswordRequest req);
}
