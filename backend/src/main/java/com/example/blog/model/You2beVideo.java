package com.example.blog.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.example.blog.enums.Ethnic;

import java.time.Instant;

/*
 * Use for saving u2be videos
 */

@Document("videos")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class You2beVideo {
    @Id
    private String id;
    private String name;
    private Ethnic ethnic;
    private String url;
    private String thumbnailUrl;
    private String note;
    private Instant createdAt;
}
