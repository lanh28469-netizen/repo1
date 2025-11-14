package com.example.blog.mapper;

import com.example.blog.dto.ClipDto;
import com.example.blog.model.Clip;
import com.example.blog.service.impl.GgDriveServiceImpl;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ClipMapper {

    private final GgDriveServiceImpl driveService;

    public ClipDto toDto(Clip clip) {
        if (clip == null) {
            return null;
        }

        return ClipDto.builder()
                .id(clip.getId())
                .name(clip.getName())
                .ethnic(clip.getEthnic())
                .url(clip.getUrl())
                .thumbnailUrl(clip.getThumbnailUrl() != null ? clip.getThumbnailUrl() : driveService.convertToThumbnailUrl(clip.getUrl()))
                .note(clip.getNote())
                .createdAt(clip.getCreatedAt())
                .build();
    }

}
