package com.example.blog.dto;

import java.time.Instant;

import com.example.blog.enums.Ethnic;

import lombok.Builder;
import lombok.Data;

@Data @Builder
public class VideoDto {

    private String id;
    
    private String name;
    
    private String url;

    private String thumbnailUrl;

    private Ethnic ethnic;

    private String note;

    private Instant createdAt;
}
