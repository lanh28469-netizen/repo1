package com.example.blog.controller;

import com.example.blog.dto.UserDto;
import com.example.blog.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {
    private final UserService userService;

    @GetMapping
    public Page<UserDto> list(@RequestParam(defaultValue = "0") int page,
                            @RequestParam(defaultValue = "10") int size,
                            @RequestParam(required = false) String q) {
        Pageable pageable = PageRequest.of(Math.max(page,0), Math.min(size,100),
                Sort.by(Sort.Direction.DESC, "username"));
        return userService.getList(pageable, q);
    }

    @GetMapping("/{id}")
    public UserDto get(@PathVariable String id) {
        return userService.getById(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserDto createManager(@Valid @RequestBody UserDto req) {
        return userService.createManager(req);
    }

    @PutMapping("/{id}")
    public UserDto updateManager(@PathVariable String id, @RequestBody UserDto req) {
        return userService.updateManager(id, req);
    }

    @DeleteMapping("/{id}")
    public void deleteManager(@PathVariable String id) {
        userService.deleteManager(id);
    }

}
