package com.example.blog.service.impl;

import com.example.blog.dto.PostDto;
import com.example.blog.enums.PostCategory;
import com.example.blog.mapper.PostMapper;
import com.example.blog.model.Post;
import com.example.blog.repository.PostRepository;
import com.example.blog.service.PostService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.CacheEvict;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Log4j2
public class PostServiceImpl implements PostService {

    private final PostRepository postRepository;
    private final PostMapper postMapper;
    private final MongoTemplate mongoTemplate;

    @Override
    @Transactional(readOnly = true)
    public Page<PostDto> getList(PostCategory category, String searchQuery, String language, Pageable pageable) {
        Page<Post> posts;
        if (category != null || language != null || (searchQuery != null && !searchQuery.isBlank())) {
            Query query = new Query();
            Criteria criteria = Criteria.where("enable").in(null, true);
            if (category != null) {
                criteria.and("category").is(category);
            }
            if (language != null) {
                criteria.and("language").is(language);
            }
            if (searchQuery != null && !searchQuery.isBlank()) {
                criteria.orOperator(
                    Criteria.where("title").regex(searchQuery, "i"),
                    Criteria.where("titleNoAccent").regex(searchQuery.toLowerCase(), "i"),
                    Criteria.where("content").regex(searchQuery, "i")
                );
            }
            query.addCriteria(criteria);
            
            // Create separate query for counting (without pagination)
            Query countQuery = new Query();
            countQuery.addCriteria(criteria);
            long total = mongoTemplate.count(countQuery, Post.class);
            
            // Apply pagination only to the data query
            query.with(pageable);
            List<Post> postList = mongoTemplate.find(query, Post.class);
            posts = new PageImpl<>(postList, pageable, total);
        } else {
            posts = postRepository.findByEnableTrueOrEnableNull(pageable);
        }
        return posts.map(postMapper::toDto);
    }


    @Override
    @Transactional(readOnly = true)
    public List<PostDto> getNews(String language) {
        return postRepository.findByCategoryInAndLanguageAndEnableIn(Arrays.asList(PostCategory.NEWS, PostCategory.OTHER), language, Arrays.asList(true, null))
            .stream().map(postMapper::toDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public PostDto getById(String id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found with id: " + id));
        return postMapper.toDto(post);
    }

    @Override
    @Cacheable(value = "homeCache", key = "#language ?: 'default'")
    public PostDto getHome(String language) {
        Post post = postRepository.findFirstByCategoryAndLanguageAndEnableIn(PostCategory.HOME, language, Arrays.asList(true, null))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Home post not found"));
        return postMapper.toDto(post);
    }

    @Override
    @Cacheable(value = "aboutCache", key = "#language ?: 'default'")
    public PostDto getAbout(String language) {
        Post post = postRepository.findFirstByCategoryAndLanguageAndEnableIn(PostCategory.ABOUT, language, Arrays.asList(true, null))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "About post not found"));
        return postMapper.toDto(post);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"homeCache", "aboutCache"}, allEntries = true)
    public PostDto create(PostDto request) {
        var post = postMapper.toEntity(request);

        String currentUsername = getCurrentUsername();
        if (currentUsername != null && !currentUsername.isBlank()) {
            post.setCreatedUser(currentUsername);
        }
        if (request.getLanguage() == null || request.getLanguage().equals("vn")) {
            post.setLanguage(null);
        }

        post.setCreatedAt(Instant.now());
        post = postRepository.save(post);
        log.info("A post saved successfully with ID: {}", post.getId());
        return postMapper.toDto(post);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"homeCache", "aboutCache"}, allEntries = true)
    public PostDto update(String id, PostDto request) {
        Post existingPost = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found with id: " + id));
        
        postMapper.toEntity(request, existingPost);

        String currentUsername = getCurrentUsername();
        if (currentUsername != null && !currentUsername.isBlank()) {
            existingPost.setUpdatedUser(currentUsername);
        }

        if (request.getLanguage() == null || request.getLanguage().equals("vn")) {
            existingPost.setLanguage(null);
        }
        
        existingPost.setUpdatedAt(Instant.now());        
        Post updatedPost = postRepository.save(existingPost);
        return postMapper.toDto(updatedPost);
    }

    @Override
    @Transactional
    @CacheEvict(value = {"homeCache", "aboutCache"}, allEntries = true)
    public void delete(String id) {
        Post post = postRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Post not found with id: " + id));

        post.setEnable(false);
        post.setUpdatedAt(Instant.now());
        String currentUsername = getCurrentUsername();
        if (currentUsername != null && !currentUsername.isBlank()) {
            post.setUpdatedUser(currentUsername);
        }
        postRepository.save(post);
    }

    @Override
    @CacheEvict(value = {"homeCache", "aboutCache"}, allEntries = true)
    public void deleteList(List<String> ids) {
        List<Post> posts = postRepository.findAllById(ids);
        if (posts.isEmpty()) {
            return;
        }
        String currentUsername = getCurrentUsername();
        Instant now = Instant.now();
        for (Post p : posts) {
            p.setEnable(false);
            p.setUpdatedAt(now);
            if (currentUsername != null && !currentUsername.isBlank()) {
                p.setUpdatedUser(currentUsername);
            }
        }
        postRepository.saveAll(posts);
    }

    @Override
    @CacheEvict(value = {"homeCache", "aboutCache"}, allEntries = true)
    public void forceDelete() {
        postRepository.deleteAllByEnableFalse();
    }

    private String getCurrentUsername() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return null;
        }
        return authentication.getName();
    }

}
