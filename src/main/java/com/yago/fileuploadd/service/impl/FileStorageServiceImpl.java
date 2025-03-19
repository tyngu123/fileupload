package com.yago.fileuploadd.service.impl;

import com.yago.fileuploadd.config.FileStorageProperties;
import com.yago.fileuploadd.exception.FileNotFoundException;
import com.yago.fileuploadd.exception.FileUploadException;
import com.yago.fileuploadd.model.FileEntity;
import com.yago.fileuploadd.repository.FileRepository;
import com.yago.fileuploadd.service.FileStorageService;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final Logger logger = LoggerFactory.getLogger(FileStorageServiceImpl.class);

    private final FileRepository fileRepository;
    private final FileStorageProperties fileStorageProperties;

    @Autowired
    public FileStorageServiceImpl(FileRepository fileRepository, FileStorageProperties fileStorageProperties) {
        this.fileRepository = fileRepository;
        this.fileStorageProperties = fileStorageProperties;
    }

    @Override
    public FileEntity storeFile(MultipartFile file) throws IOException {
        // Validate file
        if (file.isEmpty()) {
            throw new FileUploadException("Cannot store empty file");
        }

        // Check file size
        if (file.getSize() > fileStorageProperties.getMaxSize() * 1024 * 1024) {
            throw new FileUploadException("File size exceeds maximum allowed size of "
                    + fileStorageProperties.getMaxSize() + "MB");
        }

        // Normalize file name
        String fileName = StringUtils.cleanPath(file.getOriginalFilename());

        // Check if the file's name contains invalid characters
        if (fileName.contains("..")) {
            throw new FileUploadException("Filename contains invalid path sequence: " + fileName);
        }

        logger.info("Storing file: {}", fileName);

        try {
            // Create new file entity
            FileEntity fileEntity = new FileEntity(
                    fileName,
                    file.getContentType(),
                    file.getSize(),
                    file.getBytes()
            );

            // Save to database
            return fileRepository.save(fileEntity);
        } catch (IOException ex) {
            logger.error("Could not store file {}. Error: {}", fileName, ex.getMessage());
            throw new FileUploadException("Failed to store file " + fileName, ex);
        }
    }

    @Override
    public FileEntity getFile(Long fileId) {
        return fileRepository.findById(fileId)
                .orElseThrow(() -> {
                    logger.error("File not found with id: {}", fileId);
                    return new FileNotFoundException("File not found with id " + fileId);
                });
    }

    @Override
    public List<FileEntity> getAllFiles() {
        logger.info("Retrieving all files");
        return fileRepository.findAll();
    }

    @Override
    public void deleteFile(Long fileId) {
        FileEntity file = getFile(fileId);
        logger.info("Deleting file: {}", file.getFileName());
        fileRepository.delete(file);
    }

    @Override
    public boolean fileExists(String fileName) {
        logger.debug("Checking if file exists: {}", fileName);
        return fileRepository.existsByFileName(fileName);
    }
}
