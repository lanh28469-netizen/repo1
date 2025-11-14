package com.example.blog.dto;

import java.time.Instant;

import com.example.blog.enums.Ethnic;
import com.example.blog.enums.ImageType;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class ImageDto {
    private String id;

    private String name;
    
    private String url;

    private String thumbnailUrl;

    private Ethnic ethnic;

    private ImageType type;

    private String note;

    private Instant createdAt;
}
