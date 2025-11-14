package com.example.blog.controller;

import com.example.blog.dto.VideoDto;
import com.example.blog.service.U2beService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/u2be")
@RequiredArgsConstructor
public class U2beController {

    private final U2beService u2beService;

    /*
     * Get all videos from a playlist 
     */
    @GetMapping("playlist")
    public ResponseEntity<Page<VideoDto>> getVideosFromPlaylist(@RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "10") int size) throws IOException {
        return ResponseEntity.ok(u2beService.getVideosFromPlaylist(PageRequest.of(Math.max(page, 0), Math.min(size, 100))));
    }
    
    /*
     * Sync videos from YouTube playlist and store them in database
     */
    @PostMapping("sync")
    public ResponseEntity<List<VideoDto>> syncVideosFromPlaylist() throws IOException {
        List<VideoDto> syncedVideos = u2beService.syncVideosFromPlaylist();
        return ResponseEntity.ok(syncedVideos);
    }
    
    /*
     * Reset/clear all synced videos from database
     */
    @DeleteMapping("reset")
    public ResponseEntity<String> resetSyncVideosFromPlaylist() {
        u2beService.resetSyncVideosFromPlaylist();
        return ResponseEntity.ok("All synced videos have been removed from database");
    }
    
    /*
     * Get individual clip details by ID
     */
    @GetMapping("clip/{id}")
    public ResponseEntity<VideoDto> getClipById(@PathVariable String id) {
        VideoDto clip = u2beService.getVideoById(id);
        if (clip != null) {
            return ResponseEntity.ok(clip);
        }
        return ResponseEntity.notFound().build();
    }
    
    /*
     * Get YouTube embed URL for video playback
     */
    @GetMapping("clip/{id}/embed")
    public ResponseEntity<String> getYouTubeEmbedUrl(@PathVariable String id) {
        VideoDto clip = u2beService.getVideoById(id);
        if (clip != null) {
            String embedUrl = u2beService.getYouTubeEmbedUrl(clip.getUrl());
            if (embedUrl != null) {
                return ResponseEntity.ok(embedUrl);
            }
        }
        return ResponseEntity.notFound().build();
    }
   
}
