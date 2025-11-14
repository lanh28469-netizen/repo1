package com.example.blog.controller;

import com.example.blog.dto.ImageDto;
import com.example.blog.enums.Ethnic;
import com.example.blog.service.ImageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/images")
@RequiredArgsConstructor
public class ImageController {
    
    private final ImageService imageService;

    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    @PostMapping(value = "upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ImageDto upload(@RequestPart("file") MultipartFile file,
                        @RequestPart("meta") ImageDto imageDto) throws Exception {
        return imageService.upload(file, imageDto);
    }
    
    // @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    // @PostMapping(value = "upload/multiple", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    // public List<ImageDto> uploadMultiple(@RequestParam("files") List<MultipartFile> files,
    //                                     @RequestParam("type") ImageType type) throws Exception {
    //     return imageService.uploadMultiple(files, type);
    // }

    @GetMapping
    public Page<ImageDto> list(@RequestParam(required = false) Ethnic ethnic,
                            @RequestParam(required = false) String search,
                            @RequestParam(required = false) String language,
                            Pageable pageable) {
        return imageService.getList(ethnic, search, language, pageable);
    }
    
    @GetMapping("{id}")
    public ResponseEntity<ImageDto> get(@PathVariable String id) {
        ImageDto image = imageService.getById(id);
        if (image != null) {
            return ResponseEntity.ok(image);
        }
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ImageDto> update(
            @PathVariable String id,
            @Valid @RequestBody ImageDto request) {
        try {
            ImageDto updatedImage = imageService.update(id, request);
            return ResponseEntity.ok(updatedImage);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        imageService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/bulk")
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<Void> deleteList(@RequestBody List<String> ids) {
        imageService.deleteList(ids);
        return ResponseEntity.noContent().build();
    }
}