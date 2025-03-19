package com.yago.fileuploadd;

import com.yago.fileuploadd.config.FileStorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties({
        FileStorageProperties.class
})
public class FileuploaddApplication {

    public static void main(String[] args) {
        SpringApplication.run(FileuploaddApplication.class, args);
    }

}
