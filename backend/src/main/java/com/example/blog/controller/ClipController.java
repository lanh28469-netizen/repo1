package com.example.blog.controller;

import com.example.blog.dto.ClipDto;
import com.example.blog.enums.Ethnic;
import com.example.blog.service.ClipService;
import lombok.RequiredArgsConstructor;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/videos")
@RequiredArgsConstructor
public class ClipController {
    
    private final ClipService clipService;
   
    @GetMapping
    public Page<ClipDto> list(@RequestParam(required = false) Ethnic ethnic,
                            @RequestParam(required = false) String search,
                            @RequestParam(required = false) String language,
                            Pageable pageable) {
        return clipService.getList(ethnic, search, language, pageable);
    }
    
    @GetMapping("{id}")
    public ResponseEntity<ClipDto> get(@PathVariable String id) {
        ClipDto clip = clipService.getById(id);
        if (clip != null) {
            return ResponseEntity.ok(clip);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("{id}")
    public ResponseEntity<ClipDto> update(@PathVariable String id, @RequestBody ClipDto clipDto) {
        try {
            ClipDto updatedClip = clipService.update(id, clipDto);
            return ResponseEntity.ok(updatedClip);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
    
}