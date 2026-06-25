package com.recipe.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;

@Service
public class ImageStorageService {

    private final Cloudinary cloudinary;
    private final Path fileStorageLocation;

    public ImageStorageService(Cloudinary cloudinary) {
        this.cloudinary = cloudinary;
        this.fileStorageLocation = Paths.get("uploads").toAbsolutePath().normalize();

        try {
            Files.createDirectories(this.fileStorageLocation);
        } catch (Exception ex) {
            System.err.println("Could not create uploads directory: " + ex.getMessage());
        }
    }

    public String uploadImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return null;
        }

        // 1. Try uploading to Cloudinary
        try {
            // Check if credentials are set (if not, we skip Cloudinary immediately)
            String cloudName = (String) cloudinary.config.cloudName;
            if (cloudName != null && !cloudName.equals("your_cloud_name") && !cloudName.isBlank()) {
                Map<?, ?> uploadResult = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.emptyMap());
                String secureUrl = (String) uploadResult.get("secure_url");
                if (secureUrl != null && !secureUrl.isBlank()) {
                    System.out.println("Uploaded image to Cloudinary: " + secureUrl);
                    return secureUrl;
                }
            }
        } catch (Exception e) {
            System.err.println("Cloudinary upload failed: " + e.getMessage() + ". Falling back to local file storage.");
        }

        // 2. Fallback to Local Storage
        try {
            String originalFileName = file.getOriginalFilename();
            String fileExtension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                fileExtension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String fileName = UUID.randomUUID().toString() + fileExtension;
            Path targetLocation = this.fileStorageLocation.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String localUrl = "/api/images/" + fileName;
            System.out.println("Saved image locally: " + localUrl);
            return localUrl;
        } catch (IOException ex) {
            throw new RuntimeException("Could not store file. Please try again!", ex);
        }
    }
}
