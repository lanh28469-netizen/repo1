package com.example.blog.controller;

import com.example.blog.enums.Roles;
import com.example.blog.model.User;
import com.example.blog.security.JwtService;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthenticationManager authManager;
    private final JwtService jwtService;
    private final PasswordEncoder encoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        Authentication auth = authManager.authenticate(new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
        SecurityContextHolder.getContext().setAuthentication(auth);
        var user = (User) auth.getPrincipal();
        String token = jwtService.generate(user.getUsername(), user.getRoles().stream().toList());
        return ResponseEntity.ok(new LoginResponse(user.getUsername(), user.getRoles().stream().toList(), token));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof User u)) return ResponseEntity.ok().build();
        return ResponseEntity.ok(new LoginResponse(u.getUsername(), u.getRoles().stream().toList(), null));
    }

    @Data
    public static class LoginRequest { @NotBlank private String username; @NotBlank private String password; }
    public record LoginResponse(String username, List<Roles> roles, String token) {}
}
