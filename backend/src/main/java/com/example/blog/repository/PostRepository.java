package com.example.blog.repository;

import com.example.blog.enums.PostCategory;
import com.example.blog.model.Post;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PostRepository extends MongoRepository<Post, String> {

    Optional<Post> findFirstByCategoryAndLanguageAndEnableIn(
        PostCategory category,
        String language,
        List<Boolean> enable
    );

    List<Post> findByCategoryInAndLanguageAndEnableIn(
        List<PostCategory> categories,
        String language,
        List<Boolean> enable
    );
    
    Page<Post> findByEnableTrueOrEnableNull(Pageable pageable);

    void deleteAllByEnableFalse();
}
