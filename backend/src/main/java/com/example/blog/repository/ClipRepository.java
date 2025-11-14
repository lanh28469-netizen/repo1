package com.example.blog.repository;

import com.example.blog.enums.Ethnic;
import com.example.blog.model.Clip;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface ClipRepository extends MongoRepository<Clip, String> {

    @Query(value = "{}", fields = "{ '_id': 1 }")
    List<String> findAllIds();

    Page<Clip> findByEthnic(Ethnic ethnic, Pageable pageable);

    Page<Clip> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
