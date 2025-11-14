package com.example.blog.config;

import com.google.api.client.auth.oauth2.Credential;
import com.google.api.client.extensions.java6.auth.oauth2.AuthorizationCodeInstalledApp;
import com.google.api.client.extensions.jetty.auth.oauth2.LocalServerReceiver;
import com.google.api.client.googleapis.auth.oauth2.GoogleAuthorizationCodeFlow;
import com.google.api.client.googleapis.auth.oauth2.GoogleClientSecrets;
import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequest;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.gson.GsonFactory;
import com.google.api.client.util.store.FileDataStoreFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.DriveScopes;

import lombok.extern.log4j.Log4j2;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Collections;
import java.util.List;

@Configuration
@Log4j2
public class GoogleDriveConfig {

    private static final String APPLICATION_NAME = "SpringBoot-GoogleDrive";
    private static final JsonFactory JSON_FACTORY = GsonFactory.getDefaultInstance();
    private static final java.io.File TOKENS_DIRECTORY = new java.io.File("tokens");
    private static final List<String> SCOPES = Collections.singletonList(DriveScopes.DRIVE);
    private static final String CREDENTIALS_FILE_PATH = "/credentials.json"; // in resources
    
    @Value("${gdrive.connection-timeout:30000}")
    private int connectionTimeout;
    
    @Value("${gdrive.read-timeout:300000}")
    private int readTimeout;
    
    @Value("${gdrive.retry-count:3}")
    private int retryCount;

    @Bean
    public Drive getDrive() throws IOException {
        HttpTransport httpTransport = createHttpTransportWithTimeouts();
        Credential credential = getCredentials(httpTransport);
        
        // Create HTTP request initializer with timeout and retry settings
        HttpRequestInitializer requestInitializer = new HttpRequestInitializer() {
            @Override
            public void initialize(HttpRequest request) throws IOException {
                credential.initialize(request);
                // Set connection timeout
                request.setConnectTimeout(connectionTimeout);
                // Set read timeout for large file uploads
                request.setReadTimeout(readTimeout);
                // Enable retry on failure
                request.setNumberOfRetries(retryCount);
                log.debug("Configured Google Drive client with connection timeout: {}ms, read timeout: {}ms, retry count: {}", 
                         connectionTimeout, readTimeout, retryCount);
            }
        };
        
        return new Drive.Builder(httpTransport, JSON_FACTORY, requestInitializer)
                .setApplicationName(APPLICATION_NAME)
                .build();
    }
    
    private HttpTransport createHttpTransportWithTimeouts() {
        try {
            // Use the default transport - timeouts will be set at the request level
            HttpTransport transport = GoogleNetHttpTransport.newTrustedTransport();
            log.info("Created HTTP transport with timeouts configured at request level: connection={}ms, read={}ms", 
                    connectionTimeout, readTimeout);
            return transport;
        } catch (Exception e) {
            log.error("Failed to create HTTP transport", e);
            throw new RuntimeException("Cannot create HTTP transport", e);
        }
    }

    private static Credential getCredentials(HttpTransport httpTransport) throws IOException {
        InputStream in = GoogleDriveConfig.class.getResourceAsStream(CREDENTIALS_FILE_PATH);
        if (in == null) {
            throw new RuntimeException("Resource not found: " + CREDENTIALS_FILE_PATH);
        }

        GoogleClientSecrets clientSecrets = GoogleClientSecrets.load(JSON_FACTORY, new InputStreamReader(in));

        GoogleAuthorizationCodeFlow flow = new GoogleAuthorizationCodeFlow.Builder(
                httpTransport, JSON_FACTORY, clientSecrets, SCOPES)
                .setDataStoreFactory(new FileDataStoreFactory(TOKENS_DIRECTORY))
                .setAccessType("offline")
                .build();

        LocalServerReceiver receiver = new LocalServerReceiver.Builder().setPort(8888).build();
        return new AuthorizationCodeInstalledApp(flow, receiver).authorize("user");
    }

}
