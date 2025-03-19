package com.yago.fileuploadd.service;

import com.yago.fileuploadd.model.FileEntity;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

public interface FileStorageService {
    FileEntity storeFile(MultipartFile file) throws IOException;
    FileEntity getFile(Long fileId);
    List<FileEntity> getAllFiles();
    void deleteFile(Long fileId);
    boolean fileExists(String fileName);
}

