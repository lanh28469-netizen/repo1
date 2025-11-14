package com.example.blog.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import com.example.blog.enums.Ethnic;

import java.time.Instant;

@Document("clips")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Clip {
    @Id
    private String id;
    private String name;
    private Ethnic ethnic;
    private String url;
    private String thumbnailUrl;
    private String note;
    private Instant createdAt;
}
