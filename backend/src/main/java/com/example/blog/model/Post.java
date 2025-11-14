package com.example.blog.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.CompoundIndexes;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import com.example.blog.enums.PostCategory;

import java.text.Normalizer;
import java.time.Instant;

@Document("posts")
@CompoundIndexes({
    @CompoundIndex(name = "category_lang_enable_idx", def = "{'category': 1, 'language': 1, 'enable': 1}")
})
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Post {
    @Id
    private String id;
    
    @Indexed
    private String title;

    @Indexed
    private String titleNoAccent;

    private String language;
    private PostCategory category;

    @Indexed
    private String content; // HTML from CKEditor

    private Boolean enable;
    
    private String createdUser;
    private String updatedUser;
    private Instant createdAt;
    private Instant updatedAt;

    public static String unaccent(String s) {
        if (s == null) return null;
        String normalized = Normalizer.normalize(s, Normalizer.Form.NFD);
        // Xóa toàn bộ dấu (combining marks)
        String noMarks = normalized.replaceAll("\\p{M}+", "");
        // Chuẩn hóa thêm các ký tự riêng (đ/Đ)
        noMarks = noMarks.replace('đ', 'd').replace('Đ', 'D');
        return noMarks.toLowerCase();
    }
}
