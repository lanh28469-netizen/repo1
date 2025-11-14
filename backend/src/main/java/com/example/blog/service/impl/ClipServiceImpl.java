package com.example.blog.service.impl;

import com.example.blog.dto.ClipDto;
import com.example.blog.enums.Ethnic;
import com.example.blog.mapper.ClipMapper;
import com.example.blog.model.Clip;
import com.example.blog.repository.ClipRepository;
import com.example.blog.service.ClipService;

import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Log4j2
public class ClipServiceImpl implements ClipService {
    
    private final ClipMapper  clipMapper;
    private final ClipRepository clipRepository;
    
    @Override
    public Page<ClipDto> getList(Ethnic ethnic, String searchQuery, String language, Pageable pageable) {
        Page<Clip> clips;
        
        if (searchQuery != null && !searchQuery.trim().isEmpty()) {
            clips = clipRepository.findByNameContainingIgnoreCase(searchQuery.trim(), pageable);
        } else if (ethnic != null) {
            clips = clipRepository.findByEthnic(ethnic, pageable);
        } else {
            clips = clipRepository.findAll(pageable);
        }
        return clips.map(clipMapper::toDto);
    }
    
    @Override
    public ClipDto getById(String id) {
        Optional<Clip> clip = clipRepository.findById(id);
        
        if (clip.isPresent()) {
            return clipMapper.toDto(clip.get());
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Clip not found with id: " + id);
        }
    }
    
    @Override
    public ClipDto update(String id, ClipDto clipDto) {
        Optional<Clip> existingClip = clipRepository.findById(id);
        
        if (existingClip.isPresent()) {
            Clip clip = existingClip.get();
            
            // Update fields if provided in the DTO
            if (clipDto.getName() != null) {
                clip.setName(clipDto.getName());
            }
            if (clipDto.getEthnic() != null) {
                clip.setEthnic(clipDto.getEthnic());
            }
            if (clipDto.getNote() != null) {
                clip.setNote(clipDto.getNote());
            }
            
            Clip savedClip = clipRepository.save(clip);
            return clipMapper.toDto(savedClip);
        } else {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Clip not found with id: " + id);
        }
    }
    
}
