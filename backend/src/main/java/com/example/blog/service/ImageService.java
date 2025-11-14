package com.example.blog.service;

import java.util.List;

import com.example.blog.dto.ImageDto;
import com.example.blog.enums.Ethnic;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface ImageService {
    
    Page<ImageDto> getList(Ethnic ethnic, String searchQuery, String language, Pageable pageable);
    
    ImageDto getById(String id);

    ImageDto upload(MultipartFile file, ImageDto imageDto) throws Exception;
    
    // List<ImageDto> uploadMultiple(List<MultipartFile> files, ImageType type) throws Exception;
    
    ImageDto update(String id, ImageDto request);
    
    void delete(String id);

    void deleteList(List<String> ids);
}
