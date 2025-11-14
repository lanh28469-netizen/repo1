package com.example.blog.service.impl;

import com.example.blog.service.GgDriveService;
import com.example.blog.dto.ClipDto;
import com.example.blog.enums.Ethnic;
import com.example.blog.enums.ImageType;
import com.example.blog.model.Image;
import com.example.blog.model.Clip;
import com.example.blog.repository.ClipRepository;
import com.example.blog.repository.ImageRepository;
import com.example.blog.dto.ImageDto;
import com.google.api.client.http.FileContent;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.google.api.services.drive.model.Permission;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.regex.Matcher;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

@Service
@Log4j2
@RequiredArgsConstructor
public class GgDriveServiceImpl implements GgDriveService {

    private final Drive googleDrive;
    private final ImageRepository imageRepository;
    private final ClipRepository clipRepository;

    @Value("${gdrive.folder-3d}")
    private String folder3d;

    @Value("${gdrive.folder-360}")
    private String folder360;

    @Value("${gdrive.folder-ede}")
    private String folderEde;

    @Value("${gdrive.folder-jrai}")
    private String folderJrai;

    @Value("${gdrive.folder-mnong}")
    private String folderMnong;

    @Value("${gdrive.folder-video}")
    private String folderVideo;

    private static final int MAX_PAGE_SIZE = 200;
    private static final int MAX_UPLOAD_RETRIES_TIMES = 4;
    private static final String APP_PROPERTIES_TYPE = "type";

    private static final Set<String> IMAGE_TYPES = Set.of(
        MediaType.IMAGE_JPEG_VALUE,
        MediaType.IMAGE_PNG_VALUE,
        MediaType.IMAGE_GIF_VALUE,
        "image/webp",
        "model/gltf-binary"
    );

    private static final Set<String> VIDEO_TYPES = Set.of(
        "video/mp4"
    );

    @Override
    public String uploadImage(java.io.File image, ImageDto imageDto) throws Exception {
        return uploadImageWithRetry(image, imageDto, MAX_UPLOAD_RETRIES_TIMES);
    }
    
    private String uploadImageWithRetry(java.io.File image, ImageDto imageDto, int maxRetries) throws Exception {
        Exception lastException = null;
        
        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                log.info("Uploading image: {} (attempt {}/{})", imageDto.getName(), attempt, maxRetries);
                return performImageUpload(image, imageDto);
            } catch (java.net.SocketTimeoutException e) {
                lastException = e;
                log.warn("Upload attempt {} failed with SocketTimeoutException for file: {} - {}", 
                        attempt, imageDto.getName(), e.getMessage());
                
                if (attempt < maxRetries) {
                    long waitTime = attempt * 3000; // Exponential backoff: 3s, 6s, 9s, 12s
                    log.info("Retrying upload in {}ms...", waitTime);
                    Thread.sleep(waitTime);
                }
            } catch (Exception e) {
                lastException = e;
                if (attempt < maxRetries) {
                    long waitTime = attempt * 1000; // Shorter wait for non-timeout errors
                    log.info("Retrying upload in {}ms...", waitTime);
                    Thread.sleep(waitTime);
                }
            }
        }
        
        log.error("All {} upload attempts failed for file: {}", maxRetries, imageDto.getName());
        throw new Exception("Failed to upload file after " + maxRetries + " attempts. Last error: " + 
                           (lastException != null ? lastException.getMessage() : "Unknown error"));
    }
    
    private String performImageUpload(java.io.File image, ImageDto imageDto) throws Exception {
        Drive driveService = googleDrive;

        // Detect MIME type with fallback for GLB
        String mimeType = Files.probeContentType(image.toPath());
        if (mimeType == null || !IMAGE_TYPES.contains(mimeType)) {
            String filename = imageDto.getName() != null ? imageDto.getName() : image.getName();
            String lowerName = filename != null ? filename.toLowerCase() : "";
            if (lowerName.endsWith(".glb")) {
                mimeType = "model/gltf-binary";
            }
        }
        log.info("Image MIME type: " + mimeType + ", filename: " + imageDto.getName());
        if (mimeType == null || !IMAGE_TYPES.contains(mimeType)) {
            throw new IllegalArgumentException("Only image files are allowed. Detected type: " + mimeType);
        }

        File fileMetadata = new File();
        fileMetadata.setName(imageDto.getName());
        if (imageDto.getNote() != null && !imageDto.getNote().isBlank()) {
            fileMetadata.setDescription(imageDto.getNote());
        }

        // Set image type for appProperties
        Map<String, String> appProperties = new HashMap<>();
        String imageType = (imageDto.getType() == ImageType.PHOTO_360) ? ImageType.PHOTO_360.getValue() : (imageDto.getType() == ImageType.MODEL_3D) ? ImageType.MODEL_3D.getValue() : null;
        if (imageType != null) {
            appProperties.put(APP_PROPERTIES_TYPE, imageType);
        }
        fileMetadata.setAppProperties(appProperties);

        String folderId = switch (imageDto.getEthnic()) {
            case EDE -> folderEde;
            case JRAI -> folderJrai;
            case MNONG -> folderMnong;
            default -> folderEde;
        };

        fileMetadata.setParents(Collections.singletonList(folderId));

        FileContent mediaContent = new FileContent(mimeType, image);

        log.info("Starting file upload to Google Drive for: {} (size: {} bytes)", 
                imageDto.getName(), image.length());

        File file = driveService.files().create(fileMetadata, mediaContent)
                .setFields("id, parents")
                .execute();

        log.info("File uploaded successfully with ID: {}", file.getId());

        // Make file publicly readable
        Permission anyoneReader = new Permission()
                .setType("anyone")
                .setRole("reader");
        driveService.permissions().create(file.getId(), anyoneReader)
                .setFields("id")
                .execute();

        // Return URL in the same format as collectFilesRecursively
        return "http://localhost:9090/api/ggdrive/proxy/drive?id=" + file.getId() + "&name=" + fileMetadata.getName();
    }

    @Override
    public Page<ImageDto> get3dImages(Pageable pageable) throws IOException {
        String query = "'" + folder3d + "' in parents and (mimeType='image/jpeg' or mimeType='image/png' or mimeType='image/webp' or mimeType='model/gltf-binary') and trashed=false";
        FileList result = googleDrive.files().list()
                .setQ(query)
                .setFields("files(id, name, webViewLink, thumbnailLink, description)")
                .setPageSize(MAX_PAGE_SIZE) // Fetch up to 100 files
                .execute();
        List<ImageDto> allImages = result.getFiles().stream()
            .map(file -> ImageDto.builder()
                .id(file.getId())
                .name(file.getName())
                .url(file.getWebViewLink())
                .thumbnailUrl(file.getThumbnailLink() != null ? file.getThumbnailLink() : convertToThumbnailUrl(file.getWebViewLink()))
                .note(file.getDescription())
                .type(ImageType.MODEL_3D)
                .build())
            .collect(Collectors.toList());
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allImages.size());
        List<ImageDto> pageContent = allImages.subList(start, end);
        return new PageImpl<>(pageContent, pageable, allImages.size());
    }

    @Override
    public Page<ImageDto> get360Images(Pageable pageable) throws IOException {
        List<ImageDto> allImages = new ArrayList<>();
        collectImagesRecursively(folder360, allImages);
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allImages.size());
        List<ImageDto> pageContent = allImages.subList(start, end);
        return new PageImpl<>(pageContent, pageable, allImages.size());
    }

    @Override
    public void syncGoogleDriveImages(Ethnic ethnic) throws IOException { 
        if (ethnic == null) {
            collectFilesRecursively(Ethnic.EDE, folderEde);
            collectFilesRecursively(Ethnic.JRAI, folderJrai);
            collectFilesRecursively(Ethnic.MNONG, folderMnong);
        } else if (ethnic.equals(Ethnic.JRAI)) {
            collectFilesRecursively(ethnic, folderJrai);
        } else if (ethnic.equals(Ethnic.MNONG)) {
            collectFilesRecursively(ethnic, folderMnong);
        } else {
            collectFilesRecursively(ethnic, folderEde);
        }
    }

    @Override
    public Page<ClipDto> getListVideoMp4(Pageable pageable) throws IOException {
        String query = "'" + folderVideo + "' in parents and mimeType='video/mp4' and trashed=false";
        FileList result = googleDrive.files().list()
                .setQ(query)
                .setFields("files(id, name, webViewLink, thumbnailLink, description)")
                .setPageSize(MAX_PAGE_SIZE) // Fetch up to 100 files
                .execute();
        List<ClipDto> allClips = result.getFiles().stream()
            .map(file -> {
                try {
                    // Make file publicly readable
                    Permission anyoneReader = new Permission()
                            .setType("anyone")
                            .setRole("reader");
                    googleDrive.permissions().create(file.getId(), anyoneReader)
                            .setFields("id")
                            .execute();
                } catch (Exception e) {
                    // Ignore if already public
                }
                return ClipDto.builder()
                    .name(file.getName())
                    .url("http://localhost:9090/api/ggdrive/proxy/drive?id=" + file.getId() + "&name=" + file.getName())
                    .thumbnailUrl(file.getThumbnailLink() != null ? file.getThumbnailLink() : convertToThumbnailUrl(file.getWebViewLink()))
                    .note(file.getDescription())
                    .build();
            })
            .collect(Collectors.toList());
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), allClips.size());
        List<ClipDto> pageContent = allClips.subList(start, end);
        return new PageImpl<>(pageContent, pageable, allClips.size());
    }

    @Override
    public InputStream getFileContent(String fileId) throws IOException {
        return googleDrive.files().get(fileId).executeMediaAsInputStream();
    }
    
    @Override
    public String getThumbnailUrlForFile(String fileUrl) throws IOException {
        // Extract file ID from URL
        String fileId = null;
        Pattern pattern = Pattern.compile("[-\\w]{25,}");
        Matcher matcher = pattern.matcher(fileUrl);
        if (matcher.find()) {
            fileId = matcher.group();
        }
        
        if (fileId == null) {
            return convertToThumbnailUrl(fileUrl);
        }
        
        // Get file details from Google Drive API to get thumbnailLink
        File file = googleDrive.files().get(fileId)
                .setFields("thumbnailLink")
                .execute();
        
        // Use the same logic as collectFilesRecursively
        return file.getThumbnailLink() != null 
                ? file.getThumbnailLink() 
                : convertToThumbnailUrl(fileUrl);
    }

    @Override
    public void resetSyncGoogleDriveImages() {
        imageRepository.deleteAll();
    }

    @Override
    public void syncGoogleDriveClips(Ethnic ethnic) throws IOException {
        collectClipsRecursively(ethnic, folderVideo);
    }

    @Override
    public void resetSyncGoogleDriveClips() {
        clipRepository.deleteAll();
    }

    private void collectFilesRecursively(Ethnic ethnic, String folderId) throws IOException {
        // 1️⃣ Lấy tất cả file từ Google Drive
        List<File> driveFiles = listFilesInFolder(folderId);

        // 2️⃣ Lấy danh sách ID từ MongoDB 
        Set<String> existingIds = new HashSet<>(imageRepository.findAllIds());

        // 3️⃣ Gom ID hiện có trên Drive
        Set<String> driveIds = driveFiles.stream()
                .filter(f -> IMAGE_TYPES.contains(f.getMimeType()))
                .map(File::getId)
                .collect(Collectors.toSet());

        // 4️⃣ Tìm ID bị xóa khỏi Drive → cần xóa khỏi DB
        Set<String> removedIds = existingIds.stream()
                .filter(id -> !driveIds.contains(id))
                .collect(Collectors.toSet());

        // 5️⃣ Chuẩn bị danh sách ảnh mới hoặc cập nhật
        List<Image> upsertImages = new ArrayList<>();

        for (File file : driveFiles) {
            if (!IMAGE_TYPES.contains(file.getMimeType())) continue;

            ImageType imageType = ImageType.NORMAL;
            if ("model/gltf-binary".equals(file.getMimeType())) {
                imageType = ImageType.MODEL_3D;
            } else if (file.getName().contains("360")) {
                imageType = ImageType.PHOTO_360;
            } else if (file.getAppProperties() != null &&
                       file.getAppProperties().containsKey("type")) {
                try {
                    imageType = ImageType.valueOf(file.getAppProperties().get("type"));
                } catch (IllegalArgumentException ignored) {}
            }

            Image image = new Image();
            image.setId(file.getId()); // dùng ID của Drive làm _id Mongo
            image.setName(file.getName());
            image.setEthnic(ethnic);
            image.setUrl("http://localhost:9090/api/ggdrive/proxy/drive?id=" +
                         file.getId() + "&name=" + file.getName());
            image.setThumbnailUrl(file.getThumbnailLink() != null
                    ? file.getThumbnailLink()
                    : convertToThumbnailUrl(file.getWebViewLink()));
            image.setType(imageType);
            image.setNote(file.getDescription());
            image.setCreatedAt(Instant.ofEpochMilli(file.getCreatedTime().getValue()));

            upsertImages.add(image);
        }

        // 6️⃣ Thực hiện xóa các ảnh không còn trên Drive
        if (!removedIds.isEmpty()) {
            imageRepository.deleteAllById(removedIds);
        }

        // 7️⃣ Lưu hoặc cập nhật các ảnh mới
        imageRepository.saveAll(upsertImages);
        log.info("Done sync " + upsertImages.size() + " images from Google Drive.");
    }

    // --- Lấy toàn bộ file trong folder (bao gồm phân trang & folder con)
    private List<File> listFilesInFolder(String folderId) throws IOException {
        List<File> allFiles = new ArrayList<>();
        String query = "'" + folderId + "' in parents and trashed=false";
        String nextPageToken = null;

        do {
            Drive.Files.List request = googleDrive.files().list()
                    .setQ(query)
                    .setFields("nextPageToken, files(id, name, mimeType, description, webViewLink, thumbnailLink, createdTime, appProperties)")
                    .setPageSize(MAX_PAGE_SIZE)
                    .setOrderBy("createdTime desc, name asc");

            if (nextPageToken != null) {
                request.setPageToken(nextPageToken);
            }

            FileList fileList = request.execute();
            allFiles.addAll(fileList.getFiles());
            nextPageToken = fileList.getNextPageToken();

        } while (nextPageToken != null);

        // Quét folder con (nếu có)
        for (File subfolder : allFiles.stream()
                .filter(f -> "application/vnd.google-apps.folder".equals(f.getMimeType()))
                .collect(Collectors.toList())) {
            allFiles.addAll(listFilesInFolder(subfolder.getId()));
        }

        return allFiles;
    }

    private void collectClipsRecursively(Ethnic ethnic, String folderId) throws IOException {
        // 1️⃣ Lấy tất cả file từ Google Drive
        List<File> driveFiles = listFilesInFolder(folderId);

        // 2️⃣ Lấy danh sách ID từ MongoDB 
        Set<String> existingIds = new HashSet<>(clipRepository.findAllIds());

        // 3️⃣ Gom ID hiện có trên Drive
        Set<String> driveIds = driveFiles.stream()
                .filter(f -> VIDEO_TYPES.contains(f.getMimeType()))
                .map(File::getId)
                .collect(Collectors.toSet());

        // 4️⃣ Tìm ID bị xóa khỏi Drive → cần xóa khỏi DB
        Set<String> removedIds = existingIds.stream()
                .filter(id -> !driveIds.contains(id))
                .collect(Collectors.toSet());

        // 5️⃣ Chuẩn bị danh sách clip mới hoặc cập nhật
        List<Clip> upsertClips = new ArrayList<>();

        for (File file : driveFiles) {
            if (!VIDEO_TYPES.contains(file.getMimeType())) continue;

            try {
                // Make file publicly readable
                Permission anyoneReader = new Permission()
                        .setType("anyone")
                        .setRole("reader");
                googleDrive.permissions().create(file.getId(), anyoneReader)
                        .setFields("id")
                        .execute();
            } catch (Exception e) {
                // Ignore if already public
            }

            Clip clip = new Clip();
            clip.setId(file.getId()); // dùng ID của Drive làm _id Mongo
            clip.setName(file.getName());
            clip.setEthnic(ethnic);
            clip.setUrl("http://localhost:9090/api/ggdrive/proxy/drive?id=" +
                       file.getId() + "&name=" + file.getName());
            clip.setThumbnailUrl(file.getThumbnailLink() != null
                    ? file.getThumbnailLink()
                    : convertToThumbnailUrl(file.getWebViewLink()));
            clip.setNote(file.getDescription());
            clip.setCreatedAt(Instant.ofEpochMilli(file.getCreatedTime().getValue()));

            upsertClips.add(clip);
        }

        // 6️⃣ Thực hiện xóa các clip không còn trên Drive
        if (!removedIds.isEmpty()) {
            clipRepository.deleteAllById(removedIds);
        }

        // 7️⃣ Lưu hoặc cập nhật các clip mới
        clipRepository.saveAll(upsertClips);
        log.info("Done sync " + upsertClips.size() + " clips from Google Drive.");
    }

    private void collectImagesRecursively(String folderId, List<ImageDto> images) throws IOException {
        String query = "'" + folderId + "' in parents and trashed=false";
        String nextPageToken = null;
        
        // Use a Set to track already processed file IDs to prevent duplicates
        Set<String> processedFileIds = images.stream()
                .map(ImageDto::getId)
                .collect(Collectors.toSet());
        
        do {
            Drive.Files.List request = googleDrive.files().list()
                    .setQ(query)
                    .setFields("files(id, name, webViewLink, thumbnailLink, mimeType, description, createdTime), nextPageToken")
                    .setPageSize(MAX_PAGE_SIZE);
            
            if (nextPageToken != null) {
                request.setPageToken(nextPageToken);
            }
            
            FileList result = request.execute();
            
            for (File file : result.getFiles()) {
                if (file.getMimeType().equals("application/vnd.google-apps.folder")) {
                    collectImagesRecursively(file.getId(), images);
                } else if (IMAGE_TYPES.contains(file.getMimeType())) {
                    // Check if this file has already been processed to prevent duplicates
                    if (processedFileIds.contains(file.getId())) {
                        continue;
                    }
                    
                    try {
                        // Make file publicly readable
                        Permission anyoneReader = new Permission()
                                .setType("anyone")
                                .setRole("reader");
                        googleDrive.permissions().create(file.getId(), anyoneReader)
                                .setFields("id")
                                .execute();
                    } catch (Exception e) {
                        // Ignore if already public
                    }
                    
                    ImageDto imageDto = ImageDto.builder()
                        .id(file.getId())
                        .name(file.getName())
                        .url("http://localhost:9090/api/ggdrive/proxy/drive?id=" + file.getId() + "&name=" + file.getName())
                        .thumbnailUrl(file.getThumbnailLink() != null ? file.getThumbnailLink() : convertToThumbnailUrl(file.getWebViewLink()))
                        .note(file.getDescription())
                        .createdAt(Instant.ofEpochMilli(file.getCreatedTime().getValue()))
                        .build();
                    
                    images.add(imageDto);
                    processedFileIds.add(file.getId());
                }
            }
            
            nextPageToken = result.getNextPageToken();
        } while (nextPageToken != null);
    }

    @Override
    public void deleteFileById(String fileId) throws IOException {
        try {
            log.info("Attempting to delete file with ID: {}", fileId);
            
            // Check if file exists before attempting to delete
            File file = googleDrive.files().get(fileId)
                    .setFields("id, name")
                    .execute();
            
            if (file == null) {
                throw new IOException("File with ID " + fileId + " not found");
            }
            
            log.info("Found file to delete: {} (ID: {})", file.getName(), fileId);
            
            // Delete the file
            googleDrive.files().delete(fileId).execute();
            
            log.info("Successfully deleted file: {} (ID: {})", file.getName(), fileId);
            
        } catch (com.google.api.client.googleapis.json.GoogleJsonResponseException e) {
            if (e.getStatusCode() == 404) {
                throw new IOException("File with ID " + fileId + " not found", e);
            } else {
                throw new IOException("Failed to delete file with ID " + fileId + ": " + e.getMessage(), e);
            }
        } catch (Exception e) {
            throw new IOException("Failed to delete file with ID " + fileId + ": " + e.getMessage(), e);
        }
    }

    public String convertToThumbnailUrl(String url) {
        String fileId = null;
        Pattern pattern = Pattern.compile("[-\\w]{25,}");
        Matcher matcher = pattern.matcher(url);
        if (matcher.find()) {
            fileId = matcher.group();
            // Use Google CDN URL for better compatibility and direct access
            return "https://lh3.googleusercontent.com/drive-storage/" + fileId + "=s220";
        }
        return url;
    }

}
