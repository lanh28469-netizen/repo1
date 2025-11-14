package com.example.blog.mapper;

import com.example.blog.dto.VideoDto;
import com.example.blog.model.You2beVideo;
import com.example.blog.service.impl.GgDriveServiceImpl;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class VideoMapper {

    private final GgDriveServiceImpl driveService;

    public VideoDto toDto(You2beVideo video) {
        if (video == null) {
            return null;
        }

        return VideoDto.builder()
                .id(video.getId())
                .name(video.getName())
                .ethnic(video.getEthnic())
                .url(video.getUrl())
                .thumbnailUrl(video.getThumbnailUrl() != null ? video.getThumbnailUrl() : driveService.convertToThumbnailUrl(video.getUrl()))
                .note(video.getNote())
                .createdAt(video.getCreatedAt())
                .build();
    }

}
