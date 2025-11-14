package com.example.blog.mapper;

import com.example.blog.dto.ImageDto;
import com.example.blog.model.Image;
import com.example.blog.service.impl.GgDriveServiceImpl;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ImageMapper {

    private final GgDriveServiceImpl driveService;

    public ImageDto toDto(Image image) {
        if (image == null) {
            return null;
        }

        return ImageDto.builder()
                .id(image.getId())
                .name(image.getName())
                .ethnic(image.getEthnic())
                .url(image.getUrl())
                .thumbnailUrl(image.getThumbnailUrl() != null ? image.getThumbnailUrl() : driveService.convertToThumbnailUrl(image.getUrl()))
                .type(image.getType())
                .note(image.getNote())
                .createdAt(image.getCreatedAt())
                .build();
    }

    public Image toEntity(ImageDto imageDto) {
        if (imageDto == null) {
            return null;
        }

        return Image.builder()
                .id(imageDto.getId())
                .name(imageDto.getName())   
                .ethnic(imageDto.getEthnic())
                .url(imageDto.getUrl())
                .type(imageDto.getType())
                .note(imageDto.getNote())
                .createdAt(imageDto.getCreatedAt())
                .build();
    }

    public void updateEntityFromDto(ImageDto imageDto, Image image) {
        if (imageDto == null || image == null) {
            return;
        }

        image.setName(imageDto.getName());
        image.setEthnic(imageDto.getEthnic());
        image.setUrl(imageDto.getUrl());
        image.setThumbnailUrl(imageDto.getThumbnailUrl());
        image.setType(imageDto.getType());
        image.setNote(imageDto.getNote());
        // createdAt is typically not updated as it represents the creation time
    }
}
