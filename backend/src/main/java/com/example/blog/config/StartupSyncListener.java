package com.example.blog.config;

import java.io.IOException;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import com.example.blog.service.GgDriveService;
import com.example.blog.service.U2beService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

@Component
@RequiredArgsConstructor
@Log4j2
public class StartupSyncListener {

    private final GgDriveService ggDriveService;
    private final U2beService u2beService;

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        try {
            log.info("Start sync images from Google Drive");
            // ggDriveService.resetSyncGoogleDriveImages();
            ggDriveService.syncGoogleDriveImages(null);

            log.info("Start sync clips from Google Drive");
            ggDriveService.resetSyncGoogleDriveClips();
            ggDriveService.syncGoogleDriveClips(null);

            log.info("Start sync videos from YouTube playlist");
            u2beService.resetSyncVideosFromPlaylist();
            u2beService.syncVideosFromPlaylist();
        } catch (IOException e) {
            log.error("Error sync Google Drive images", e);
            log.error("Error sync Google Drive clips", e);
            log.error("Error sync YouTube playlist", e);
        }
    }
}
