package com.example.blog.controller;

import com.example.blog.dto.ChangePasswordRequest;
import com.example.blog.dto.UserDto;
import com.example.blog.model.User;
import com.example.blog.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {
    private final UserService userService;

    @GetMapping("/profile")
    public UserDto profile(@AuthenticationPrincipal User u) {
        return userService.getById(u.getId());
    }

    @PutMapping("/profile")
    public UserDto update(@AuthenticationPrincipal User u, @RequestBody UserDto req) {
        return userService.update(u.getId(), req);
    }

    @PutMapping("/change-password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal User u, @Valid @RequestBody ChangePasswordRequest req) {
        if (!userService.changePassword(u, req)) return ResponseEntity.status(400).body("Current password incorrect");
        return ResponseEntity.noContent().build();
    }
}
