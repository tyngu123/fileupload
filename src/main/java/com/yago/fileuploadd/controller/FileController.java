package com.yago.fileuploadd.controller;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import com.yago.fileuploadd.dto.FileResponseDTO;
import com.yago.fileuploadd.model.FileEntity;
import com.yago.fileuploadd.service.FileStorageService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/files")
@CrossOrigin(origins = "*")
public class FileController {

    private static final Logger logger = LoggerFactory.getLogger(FileController.class);

    private final FileStorageService fileStorageService;

    @Autowired
    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<FileResponseDTO> uploadFile(@RequestParam("file") MultipartFile file) {
        logger.info("Received file upload request: {}", file.getOriginalFilename());

        try {
            FileEntity savedFile = fileStorageService.storeFile(file);

            String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                    .path("/api/files/")
                    .path(savedFile.getId().toString())
                    .toUriString();

            FileResponseDTO response = new FileResponseDTO(
                    savedFile.getId(),
                    savedFile.getFileName(),
                    savedFile.getFileType(),
                    savedFile.getFileSize(),
                    fileDownloadUri,
                    savedFile.getUploadDateTime()
            );

            logger.info("File uploaded successfully: {}", savedFile.getFileName());
            return new ResponseEntity<>(response, HttpStatus.CREATED);
        } catch (IOException ex) {
            logger.error("Error occurred during file upload", ex);
            throw new com.yago.fileuploadd.exception.FileUploadException("Could not upload the file: " + file.getOriginalFilename(), ex);
        }
    }

    @GetMapping("/{fileId}")
    public ResponseEntity<byte[]> downloadFile(@PathVariable Long fileId) {
        logger.info("Received file download request for id: {}", fileId);

        FileEntity fileEntity = fileStorageService.getFile(fileId);

        logger.info("Serving file: {}", fileEntity.getFileName());

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(fileEntity.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileEntity.getFileName() + "\"")
                .body(fileEntity.getData());
    }

    @GetMapping
    public ResponseEntity<List<FileResponseDTO>> getAllFiles() {
        logger.info("Received request to list all files");

        List<FileResponseDTO> files = fileStorageService.getAllFiles().stream()
                .map(file -> {
                    String fileDownloadUri = ServletUriComponentsBuilder.fromCurrentContextPath()
                            .path("/api/files/")
                            .path(file.getId().toString())
                            .toUriString();

                    return new FileResponseDTO(
                            file.getId(),
                            file.getFileName(),
                            file.getFileType(),
                            file.getFileSize(),
                            fileDownloadUri,
                            file.getUploadDateTime()
                    );
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok().body(files);
    }

    @DeleteMapping("/{fileId}")
    public ResponseEntity<Void> deleteFile(@PathVariable Long fileId) {
        logger.info("Received request to delete file with id: {}", fileId);

        fileStorageService.deleteFile(fileId);

        logger.info("File with id {} successfully deleted", fileId);
        return ResponseEntity.noContent().build();
    }
}
