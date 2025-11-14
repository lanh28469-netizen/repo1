package com.example.blog.service;

import java.util.List;

import com.example.blog.dto.PostDto;
import com.example.blog.enums.PostCategory;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface PostService {
    
    Page<PostDto> getList(PostCategory category, String searchQuery, String language, Pageable pageable);

    List<PostDto> getNews(String language);
    
    PostDto getById(String id);

    PostDto getHome(String language);

    PostDto getAbout(String language);

    PostDto create(PostDto request);
    
    PostDto update(String id, PostDto request);
    
    void delete(String id);

    void deleteList(List<String> ids);

    /*
     * Force delete all posts with enable = false
     */
    void forceDelete();
}
