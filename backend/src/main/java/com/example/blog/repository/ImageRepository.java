package com.example.blog.repository;

import com.example.blog.enums.Ethnic;
import com.example.blog.model.Image;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface ImageRepository extends MongoRepository<Image, String> {

    @Query(value = "{}", fields = "{ '_id': 1 }")
    List<String> findAllIds();

    @Query(value = "{}", sort = "{ 'createdAt': -1 }")
    Page<Image> findAllOrderByCreatedAtDesc(Pageable pageable);

    Page<Image> findByEthnicOrderByCreatedAtDesc(Ethnic ethnic, Pageable pageable);

    Page<Image> findByNameContainingIgnoreCaseOrderByCreatedAtDesc(String name, Pageable pageable);
}
