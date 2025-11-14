package com.example.blog.mapper;

import com.example.blog.dto.PostDto;
import com.example.blog.model.Post;

import org.springframework.stereotype.Component;

@Component
public class PostMapper {

    public Post toEntity(PostDto dto) {
        if (dto == null) {
            return null;
        }
        
        return Post.builder()
                .title(dto.getTitle())
                .titleNoAccent(Post.unaccent(dto.getTitle()))
                .category(dto.getCategory())
                .content(dto.getContent())
                .language(dto.getLanguage())
                .build();
    }

    public Post toEntity(PostDto dto, Post existingPost) {
        if (dto == null) {
            return null;
        }
        
        existingPost.setTitle(dto.getTitle());
        existingPost.setTitleNoAccent(Post.unaccent(dto.getTitle()));
        existingPost.setLanguage(dto.getLanguage());
        existingPost.setCategory(dto.getCategory());
        existingPost.setContent(dto.getContent());
        return existingPost;
    }

    public PostDto toDto(Post entity) {
        if (entity == null) {
            return null;
        }
        
        return PostDto.builder()
                .id(entity.getId())
                .title(entity.getTitle())
                .language(entity.getLanguage())
                .category(entity.getCategory())
                .content(entity.getContent())
                .enable(entity.getEnable())
                .createdUser(entity.getCreatedUser())
                .updatedUser(entity.getUpdatedUser())
                .createdAt(entity.getCreatedAt())
                .build();
    }
}
