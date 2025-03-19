package com.yago.fileuploadd.repository;

import com.yago.fileuploadd.model.FileEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;


@Repository
public interface FileRepository extends JpaRepository<FileEntity, Long> {

    Optional<FileEntity> findByFileName(String fileName);
    List<FileEntity> findByFileType(String fileType);
    boolean existsByFileName(String fileName);
}
