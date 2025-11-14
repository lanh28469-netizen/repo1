package com.example.blog.controller;

import com.example.blog.dto.ClipDto;
import com.example.blog.dto.ImageDto;
import com.example.blog.enums.Ethnic;
import com.example.blog.service.GgDriveService;

import lombok.RequiredArgsConstructor;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import java.io.IOException;
import java.io.InputStream;

@RestController
@RequestMapping("/api/ggdrive")
@RequiredArgsConstructor
public class GgDriveController {

    private final GgDriveService ggDriveService;

    @GetMapping("3d-images")
    public ResponseEntity<Page<ImageDto>> get3dImages(@RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "10") int size) throws IOException {
        return ResponseEntity.ok(ggDriveService.get3dImages(PageRequest.of(Math.max(page, 0), Math.min(size, 100))));
    }

    @GetMapping("360-images")
    public ResponseEntity<Page<ImageDto>> get360Images(@RequestParam(defaultValue = "0") int page,
                                                       @RequestParam(defaultValue = "10") int size) throws IOException {
        return ResponseEntity.ok(ggDriveService.get360Images(PageRequest.of(Math.max(page, 0), Math.min(size, 100))));
    }

    /*
     * Admin API retrive all images from Google Drive folder
     */
    @GetMapping("sync-images")
    public void syncGoogleDrive(@RequestParam(required = false) Ethnic ethnic) throws IOException {
        ggDriveService.syncGoogleDriveImages(ethnic);
    }

    /*
     * Get direct videos from a google drive folder
     */
    @GetMapping("videos")
    public ResponseEntity<Page<ClipDto>> getListVideoMp4(@RequestParam(defaultValue = "0") int page,
                                                         @RequestParam(defaultValue = "10") int size) throws IOException {
        return ResponseEntity.ok(ggDriveService.getListVideoMp4(PageRequest.of(Math.max(page, 0), Math.min(size, 100))));
    }

    @GetMapping("/proxy/drive")
    @CrossOrigin(origins = "*")
    public ResponseEntity<InputStreamResource> proxyDriveFile(@RequestParam String id, 
                                                            @RequestParam(required = false) String name) throws IOException {
        InputStream inputStream = ggDriveService.getFileContent(id);
        InputStreamResource resource = new InputStreamResource(inputStream);
        // Determine content type based on file extension or name
        MediaType contentType = MediaType.APPLICATION_OCTET_STREAM;
        if (name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".jpeg")) {
            contentType = MediaType.IMAGE_JPEG;
        } else if (name.toLowerCase().endsWith(".png")) {
            contentType = MediaType.IMAGE_PNG;
        } else if (name.toLowerCase().endsWith(".glb")) {
            contentType = MediaType.parseMediaType("model/gltf-binary");
        } else if (name.toLowerCase().endsWith(".mp4")) {
            contentType = MediaType.parseMediaType("video/mp4");
        }
        return ResponseEntity.ok()
                .contentType(contentType)
                .body(resource);
    }
}
