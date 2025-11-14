package com.example.blog.service.impl;

import com.example.blog.dto.ImageDto;
import com.example.blog.enums.Ethnic;
import com.example.blog.enums.ImageType;
import com.example.blog.mapper.ImageMapper;
import com.example.blog.model.Image;
import com.example.blog.repository.ImageRepository;
import com.example.blog.service.ImageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;

@Service
@RequiredArgsConstructor
@Log4j2
public class ImageServiceImpl implements ImageService {
    
    private final GgDriveServiceImpl driveService;
    private final ImageMapper  imageMapper;
    private final ImageRepository imageRepository;
    
    @Override
    public Page<ImageDto> getList(Ethnic ethnic, String searchQuery, String language, Pageable pageable) {
        Page<Image> images;
        
        if (searchQuery != null && !searchQuery.trim().isEmpty()) {
            images = imageRepository.findByNameContainingIgnoreCaseOrderByCreatedAtDesc(searchQuery.trim(), pageable);
        } else if (ethnic != null) {
            images = imageRepository.findByEthnicOrderByCreatedAtDesc(ethnic, pageable);
        } else {
            images = imageRepository.findAllOrderByCreatedAtDesc(pageable);
        }
        return images.map(imageMapper::toDto);
    }
    
    @Override
    public ImageDto getById(String id) {
        Optional<Image> image = imageRepository.findById(id);
        
        if (image.isPresent()) {
            return imageMapper.toDto(image.get());
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found with id: " + id);
        }
    }
    
    @Override
    public ImageDto upload(MultipartFile image, ImageDto imageDto) throws Exception {
        java.io.File imageFile = java.io.File.createTempFile("upload-", image.getOriginalFilename());
        image.transferTo(imageFile);

        try {
            String imageName = imageDto.getName();
            // Determine image type based on file extension and content type
            String contentType = image.getContentType();
            String originalFilename = image.getOriginalFilename();
            imageDto.setName(originalFilename);
            log.info("Content type: {}, Original filename: {}", contentType, originalFilename);
            
            // Auto-detect GLB files and set type to MODEL_3D
            ImageType imageType = imageDto.getType();
            if (originalFilename != null && originalFilename.toLowerCase().endsWith(".glb")) {
                imageType = ImageType.MODEL_3D;
            }
            imageDto.setType(imageType);
            
            // Upload file to Google Drive
            String url = driveService.uploadImage(imageFile, imageDto);
            
            // Get thumbnail URL using the same logic as collectFilesRecursively
            String thumbnailUrl = driveService.getThumbnailUrlForFile(url);
            
            Image imageModel = Image.builder()
                    .name(imageName != null ? imageName : image.getOriginalFilename())
                    .url(url)
                    .thumbnailUrl(thumbnailUrl)
                    .type(imageType)
                    .note(imageDto.getNote())
                    .ethnic(imageDto.getEthnic())
                    .createdAt(Instant.now())
                    .build();
            
            Image savedImage = imageRepository.save(imageModel);
            log.info("Image saved successfully with ID: {}", savedImage.getId());
            
            return imageMapper.toDto(savedImage);
        } catch (Exception e) {
            log.error("Failed to upload file: {} - {}", image.getOriginalFilename(), e.getMessage(), e);
            throw e;
        } finally {
            imageFile.delete();
        }
    }
    
    // @Override
    // public List<ImageDto> uploadMultiple(List<MultipartFile> files, ImageType type) throws Exception {
    //     if (files == null || files.isEmpty()) {
    //         throw new IllegalArgumentException("Files list cannot be null or empty");
    //     }
        
    //     List<ImageDto> uploadedImages = new ArrayList<>();
    //     int successCount = 0;
    //     int failureCount = 0;
        
    //     for (MultipartFile file : files) {
    //         if (file != null && !file.isEmpty()) {
    //             try {
    //                 ImageDto uploadedImage = upload(file, type);
    //                 uploadedImages.add(uploadedImage);
    //                 successCount++;
    //             } catch (IOException e) {
    //                 log.error("Failed to upload file: {} - {}", file.getOriginalFilename(), e.getMessage(), e);
    //                 failureCount++;
    //             }
    //         } else {
    //             log.warn("Skipping null or empty file");
    //             failureCount++;
    //         }
    //     }
        
    //     log.info("Bulk upload completed - Success: {}, Failed: {}", successCount, failureCount);
    //     return uploadedImages;
    // }
    
    @Override
    public ImageDto update(String id, ImageDto request) {
        try {
            Image image = imageRepository.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found with id: " + id));
            
            image.setName(request.getName());
            image.setNote(request.getNote());
            
            Image updatedImage = imageRepository.save(image);
            
            return imageMapper.toDto(updatedImage);
        } catch (RuntimeException e) {
            log.error("Failed to update image with ID: {} - {}", id, e.getMessage(), e);
            throw e;
        }
    }
    
    @Override
    public void delete(String id) {
        try {
            if (imageRepository.existsById(id)) {
                // Delete from database first
                imageRepository.deleteById(id);
                log.info("Image deleted from database with ID: {}", id);
                
                // Delete from Google Drive asynchronously
                deleteFileFromGoogleDriveAsync(id);
            } else {
                log.warn("Attempted to delete non-existent image with ID: {}", id);
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Image not found with id: " + id);
            }
        } catch (Exception e) {
            log.error("Failed to delete image with ID: {} - {}", id, e.getMessage(), e);
            throw e;
        }
    }
    
    @Override
    public void deleteList(List<String> ids) {
        try {
            // Delete from database first
            imageRepository.deleteAllById(ids);
            log.info("Images deleted from database with IDs: {}", ids);
            
            // Delete from Google Drive asynchronously for each ID
            for (String id : ids) {
                deleteFileFromGoogleDriveAsync(id);
            }
        } catch (Exception e) {
            log.error("Failed to delete images with IDs: {} - {}", ids, e.getMessage(), e);
            throw e;
        }
    }
    
    /**
     * Asynchronously delete a file from Google Drive by its ID
     * @param fileId The Google Drive file ID to delete
     * @return CompletableFuture that completes when the deletion is done
     */
    @Async
    public CompletableFuture<Void> deleteFileFromGoogleDriveAsync(String fileId) {
        return CompletableFuture.runAsync(() -> {
            try {
                log.info("Starting async deletion of file from Google Drive with ID: {}", fileId);
                driveService.deleteFileById(fileId);
                log.info("Successfully deleted file from Google Drive with ID: {}", fileId);
            } catch (Exception e) {
                log.error("Failed to delete file from Google Drive with ID: {} - {}", fileId, e.getMessage(), e);
                // Note: We don't rethrow the exception here as this is async and we don't want to affect the main flow
                // The database deletion has already succeeded, so this is a cleanup operation
            }
        });
    }
    
    private ImageType determineImageType(String contentType) {
        
        if (contentType == null) {
            return ImageType.NORMAL;
        }
        
        ImageType type = switch (contentType.toLowerCase()) {
            case "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" -> ImageType.NORMAL;
            case "image/3d", "model/3d" -> ImageType.MODEL_3D;
            case "image/360", "image/panorama" -> ImageType.PHOTO_360;
            default -> ImageType.NORMAL;
        };
        
        return type;
    }
}
