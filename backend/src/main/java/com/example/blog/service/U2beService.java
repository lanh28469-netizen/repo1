package com.example.blog.service;

import java.io.IOException;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.blog.dto.VideoDto;

public interface U2beService {

    Page<VideoDto> getVideosFromPlaylist(Pageable pageable) throws IOException;

    void resetSyncVideosFromPlaylist();

    List<VideoDto> syncVideosFromPlaylist() throws IOException;
    
    VideoDto getVideoById(String id);
    
    String getYouTubeEmbedUrl(String clipId);
    
}
