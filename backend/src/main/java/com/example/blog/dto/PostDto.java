package com.example.blog.dto;


import java.time.Instant;

import com.example.blog.enums.PostCategory;

import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

@Data @Builder
public class PostDto {
    private String id;
    
    @NotBlank
    private String title;
    
    private String language;

    @Builder.Default
    private PostCategory category = PostCategory.NEWS;

    @NotBlank
    private String content; // HTML

    private Boolean enable;

    private String createdUser;
    private String updatedUser;

    private Instant createdAt;
}
