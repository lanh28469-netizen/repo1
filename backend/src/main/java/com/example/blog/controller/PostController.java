package com.example.blog.controller;

import com.example.blog.dto.PostDto;
import com.example.blog.enums.PostCategory;
import com.example.blog.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {
    private final PostService postService;

    // GET /api/posts?page=0&size=10&category=ede&q=keyword&language=en
    @GetMapping
    public Page<PostDto> list(@RequestParam(defaultValue = "0") int page,
                           @RequestParam(defaultValue = "10") int size,
                           @RequestParam(required = false) PostCategory category,
                           @RequestParam(required = false) String q,
                           @RequestParam(required = false) String lang) {
        Pageable pageable = PageRequest.of(Math.max(page,0), Math.min(size,100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return postService.getList(category, q, lang, pageable);
    }

    @GetMapping("news")
    public List<PostDto> getNews(@RequestParam(required = false) String lang) {
        return postService.getNews(lang);
    }

    @GetMapping("/{id}")
    public PostDto get(@PathVariable String id) {
        return postService.getById(id);
    }

    @GetMapping("home")
    public PostDto getHome(@RequestParam(required = false) String lang) {
        return postService.getHome(lang);
    }

    @GetMapping("about")
    public PostDto getAbout(@RequestParam(required = false) String lang) {
        return postService.getAbout(lang);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public PostDto create(@Valid @RequestBody PostDto req) {
        return postService.create(req);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public PostDto update(@PathVariable String id, @RequestBody PostDto req) {
        return postService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        postService.delete(id);
    }

    @DeleteMapping("force-delete")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forceDelete() {
        postService.forceDelete();
    }

}
