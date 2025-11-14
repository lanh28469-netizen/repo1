package com.example.blog.mapper;

import com.example.blog.dto.UserDto;
import com.example.blog.model.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {
  
    public UserDto toDto(User user) {
        if (user == null) {
            return null;
        }
        
        return UserDto.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .enable(user.getEnabled())
                .build();
    }
    
    public User toEntity(UserDto userDto) {
        if (userDto == null) {
            return null;
        }
        
        return User.builder()
                .id(userDto.getId())
                .username(userDto.getUsername())
                .email(userDto.getEmail())
                .password(userDto.getPassword()) // Password is included when creating/updating entity
                .fullName(userDto.getFullName())
                .phone(userDto.getPhone())
                .build();
    }
    
    public void updateUserFromDto(UserDto userDto, User user) {
        if (userDto == null || user == null) {
            return;
        }
        
        user.setUsername(userDto.getUsername());
        user.setEmail(userDto.getEmail());
        if (userDto.getPassword() != null && !userDto.getPassword().trim().isEmpty()) {
            user.setPassword(userDto.getPassword());
        }
        user.setFullName(userDto.getFullName());
        user.setPhone(userDto.getPhone());
    }
}
