package com.example.blog.service;

import java.io.IOException;
import java.io.InputStream;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.blog.dto.ClipDto;
import com.example.blog.dto.ImageDto;
import com.example.blog.enums.Ethnic;

public interface GgDriveService {

    String uploadImage(java.io.File image, ImageDto imageDto) throws Exception;

    Page<ImageDto> get3dImages(Pageable pageable) throws IOException;

    Page<ImageDto> get360Images(Pageable pageable) throws IOException;

    /*
     * Sync Google Drive images folder to DB
     */
    void syncGoogleDriveImages(Ethnic ethnic) throws IOException;

    /*
     * Remove synchronized images from DB
     */
    void resetSyncGoogleDriveImages();

    /*
     * Sync Google Drive clips folder to DB
     */
    void syncGoogleDriveClips(Ethnic ethnic) throws IOException;

    /*
     * Remove synchronized clips from DB
     */
    void resetSyncGoogleDriveClips();

    Page<ClipDto> getListVideoMp4(Pageable pageable) throws IOException;

    InputStream getFileContent(String fileId) throws IOException;
    
    String getThumbnailUrlForFile(String fileUrl) throws IOException;
    
    /**
     * Delete a file from Google Drive by its ID
     * @param fileId The Google Drive file ID to delete
     * @throws IOException if the file cannot be deleted or doesn't exist
     */
    void deleteFileById(String fileId) throws IOException;
}
