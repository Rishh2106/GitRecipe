package com.recipe.controller;

import com.recipe.service.ImageStorageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/images")
public class ImageUploadController {

    private final ImageStorageService imageStorageService;

    public ImageUploadController(ImageStorageService imageStorageService) {
        this.imageStorageService = imageStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) {
        String imageUrl = imageStorageService.uploadImage(file);
        Map<String, String> response = new HashMap<>();
        response.put("imageUrl", imageUrl);
        return ResponseEntity.ok(response);
    }
}
