package com.example.blog.repository;

import com.example.blog.enums.Ethnic;
import com.example.blog.model.You2beVideo;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface VideoRepository extends MongoRepository<You2beVideo, String> {

    @Query(value = "{}", fields = "{ '_id': 1 }")
    List<String> findAllIds();

    Page<You2beVideo> findByEthnic(Ethnic ethnic, Pageable pageable);

    Page<You2beVideo> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
