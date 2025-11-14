package com.example.blog.service.impl;

import com.example.blog.service.U2beService;
import com.example.blog.repository.VideoRepository;
import org.springframework.stereotype.Service;
import com.example.blog.dto.VideoDto;
import com.example.blog.mapper.VideoMapper;
import com.example.blog.model.You2beVideo;
import com.example.blog.enums.Ethnic;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.model.PlaylistItem;
import com.google.api.services.youtube.model.PlaylistItemListResponse;
import com.google.api.services.youtube.model.Video;
import com.google.api.services.youtube.model.VideoListResponse;

@Service
@Log4j2
@RequiredArgsConstructor
public class U2beServiceImpl implements U2beService {

    private final VideoMapper  videoMapper;
    private final VideoRepository videoRepository;

    @Value("${u2be.playlist-url}")
    private String playlistUrl;
    
    @Value("${u2be.api-key}")
    private String apiKey;

    @Override
    public Page<VideoDto> getVideosFromPlaylist(Pageable pageable) throws IOException {
        return videoRepository.findAll(pageable).map(videoMapper::toDto);
    }

    @Override
    public void resetSyncVideosFromPlaylist() {
        videoRepository.deleteAll();
    }

    @Override
    public List<VideoDto> syncVideosFromPlaylist() throws IOException {
        log.info("Starting sync of videos from playlist: {}", playlistUrl);
        
        try {
            // Extract playlist ID from URL
            String playlistId = extractPlaylistId(playlistUrl);
            if (playlistId == null) {
                throw new IOException("Invalid playlist URL: " + playlistUrl);
            }
            
            // Initialize YouTube API client
            YouTube youtube = new YouTube.Builder(
                GoogleNetHttpTransport.newTrustedTransport(),
                GsonFactory.getDefaultInstance(),
                null
            ).setApplicationName("Daklak Blog").build();
            
            List<VideoDto> syncedClips = new ArrayList<>();
            String nextPageToken = null;
            
            do {
                // Get playlist items
                YouTube.PlaylistItems.List playlistItemsRequest = youtube.playlistItems()
                    .list(java.util.Arrays.asList("snippet", "contentDetails"))
                    .setPlaylistId(playlistId)
                    .setKey(apiKey)
                    .setMaxResults(50L);
                
                if (nextPageToken != null) {
                    playlistItemsRequest.setPageToken(nextPageToken);
                }
                
                PlaylistItemListResponse playlistItemsResponse = playlistItemsRequest.execute();
                List<PlaylistItem> playlistItems = playlistItemsResponse.getItems();
                
                if (playlistItems != null && !playlistItems.isEmpty()) {
                    // Extract video IDs
                    List<String> videoIds = new ArrayList<>();
                    for (PlaylistItem item : playlistItems) {
                        if (item.getContentDetails() != null && item.getContentDetails().getVideoId() != null) {
                            videoIds.add(item.getContentDetails().getVideoId());
                        }
                    }
                    
                    if (!videoIds.isEmpty()) {
                        // Get video details
                        YouTube.Videos.List videosRequest = youtube.videos()
                            .list(java.util.Arrays.asList("snippet", "statistics"))
                            .setId(videoIds)
                            .setKey(apiKey);
                        
                        VideoListResponse videosResponse = videosRequest.execute();
                        List<Video> videos = videosResponse.getItems();
                        
                        if (videos != null) {
                            for (Video video : videos) {
                                try {
                                    You2beVideo clip = createEntityFromVideo(video);
                                    You2beVideo savedClip = videoRepository.save(clip);
                                    syncedClips.add(videoMapper.toDto(savedClip));
                                    log.info("Synced video: {}", video.getSnippet().getTitle());
                                } catch (Exception e) {
                                    log.error("Error saving video for video {}: {}", 
                                        video.getId(), e.getMessage());
                                }
                            }
                        }
                    }
                }
                
                nextPageToken = playlistItemsResponse.getNextPageToken();
            } while (nextPageToken != null);
            
            log.info("Successfully synced {} videos from playlist", syncedClips.size());
            return syncedClips;
            
        } catch (Exception e) {
            log.error("Error syncing videos from playlist: {}", e.getMessage(), e);
            throw new IOException("Failed to sync videos from playlist", e);
        }
    }
    
    private String extractPlaylistId(String playlistUrl) {
        Pattern pattern = Pattern.compile("list=([a-zA-Z0-9_-]+)");
        Matcher matcher = pattern.matcher(playlistUrl);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }
    
    private You2beVideo createEntityFromVideo(Video video) {
        String videoId = video.getId();
        String title = video.getSnippet().getTitle();
        String thumbnailUrl = null;
        
        if (video.getSnippet().getThumbnails() != null) {
            if (video.getSnippet().getThumbnails().getHigh() != null) {
                thumbnailUrl = video.getSnippet().getThumbnails().getHigh().getUrl();
            } else if (video.getSnippet().getThumbnails().getMedium() != null) {
                thumbnailUrl = video.getSnippet().getThumbnails().getMedium().getUrl();
            } else if (video.getSnippet().getThumbnails().getDefault() != null) {
                thumbnailUrl = video.getSnippet().getThumbnails().getDefault().getUrl();
            }
        }
        
        return You2beVideo.builder()
            .name(title)
            .url("https://www.youtube.com/watch?v=" + videoId)
            .thumbnailUrl(thumbnailUrl)
            .ethnic(Ethnic.EDE) // Default ethnic group, can be updated later
            .note("Synced from YouTube playlist")
            .createdAt(Instant.now())
            .build();
    }
    
    @Override
    public VideoDto getVideoById(String id) {
        Optional<You2beVideo> clip = videoRepository.findById(id);
        if (clip.isPresent()) {
            return videoMapper.toDto(clip.get());
        }
        return null;
    }
    
    @Override
    public String getYouTubeEmbedUrl(String clipId) {
        // Extract YouTube video ID from the clip URL
        String videoId = extractVideoIdFromUrl(clipId);
        if (videoId != null) {
            return "https://www.youtube.com/embed/" + videoId;
        }
        return null;
    }
    
    private String extractVideoIdFromUrl(String url) {
        // Handle both direct video IDs and full YouTube URLs
        if (url.startsWith("https://www.youtube.com/watch?v=")) {
            return url.substring(url.indexOf("v=") + 2);
        } else if (url.startsWith("https://youtu.be/")) {
            return url.substring(url.lastIndexOf("/") + 1);
        } else if (!url.contains("/") && !url.contains("=")) {
            // Assume it's already a video ID
            return url;
        }
        return null;
    }

}
