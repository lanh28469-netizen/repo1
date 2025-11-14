package com.example.blog.service;

import com.example.blog.dto.ClipDto;
import com.example.blog.enums.Ethnic;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ClipService {
    
    Page<ClipDto> getList(Ethnic ethnic, String searchQuery, String language, Pageable pageable);
    
    ClipDto getById(String id);
    
    ClipDto update(String id, ClipDto clipDto);

}
