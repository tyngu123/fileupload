# 📁 FileManager



> A powerful, intuitive, and secure file management solution built with Spring Boot and modern web technologies.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.3.9-brightgreen.svg)](https://spring.io/projects/spring-boot)
[![Java](https://img.shields.io/badge/Java-17-orange.svg)](https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html)

## ✨ Features

- 🚀 **Modern Interface**: Clean, responsive design that works seamlessly on desktop and mobile
- 🔄 **Drag & Drop Uploads**: Intuitive file uploading with visual progress tracking
- 🔍 **Advanced File Management**: Search, sort, filter, and batch operations
- 🔐 **Secure Storage**: Files are securely stored with robust validation and error handling
- 📊 **Real-time Progress**: Visual feedback on upload progress with percentage indicators
- 🔔 **Toast Notifications**: Elegant notifications for all user actions
- 🌐 **RESTful API**: Well-designed API endpoints for seamless integration
- 📱 **Fully Responsive**: Adapts beautifully to any screen size
- 🧩 **Bulk Operations**: Select and delete multiple files at once

## 🖥️ Screenshots

![image](https://github.com/user-attachments/assets/9232c8d2-c667-467a-bb2d-1a1888eacc52)


## 🛠️ Tech Stack

### Backend
- **Spring Boot** - Framework for creating stand-alone, production-grade applications
- **Spring Data JPA** - Simplifies database operations with repository abstraction
- **H2 Database** - Lightweight in-memory database for development
- **MySQL** - Production-ready relational database support
- **Maven** - Dependency management and build tool

### Frontend
- **HTML5/CSS3** - Modern markup and styling
- **JavaScript (ES6+)** - Dynamic client-side scripting
- **Fetch API** - Modern AJAX request handling
- **Font Awesome** - Iconic font and CSS toolkit for beautiful icons

## 🚀 Quick Start

### Prerequisites
- JDK 17 or newer
- Maven 3.6.3 or newer
- MySQL (optional for production)

### Clone the Repository
```bash
git clone https://github.com/tyngu123/fileupload.git
```

### Run with Maven
```bash
# Run the application with the embedded H2 database
mvn spring-boot:run

# Build the application
mvn clean package
```

### Access the Application
Open your browser and navigate to:
```
http://localhost:8080
```

## 📋 API Documentation

### File Upload
```http
POST /api/files/upload
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `file`    | `multipart/form-data` | **Required**. File to upload |

### List All Files
```http
GET /api/files
```

### Get File
```http
GET /api/files/{fileId}
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `fileId`  | `long`   | **Required**. ID of the file to fetch |

### Delete File
```http
DELETE /api/files/{fileId}
```
| Parameter | Type     | Description                |
| :-------- | :------- | :------------------------- |
| `fileId`  | `long`   | **Required**. ID of the file to delete |

## 🏗️ Project Structure

```
📦 filemanager
 ┣ 📂 src
 ┃ ┣ 📂 main
 ┃ ┃ ┣ 📂 java/com/filemanager
 ┃ ┃ ┃ ┣ 📂 config
 ┃ ┃ ┃ ┣ 📂 controller
 ┃ ┃ ┃ ┣ 📂 dto
 ┃ ┃ ┃ ┣ 📂 exception
 ┃ ┃ ┃ ┣ 📂 model
 ┃ ┃ ┃ ┣ 📂 repository
 ┃ ┃ ┃ ┣ 📂 service
 ┃ ┃ ┣ 📂 resources
 ┃ ┃ ┃ ┣ 📂 pages
 ┃ ┃ ┃ ┣ 📄 application.properties
 ┃ ┣ 📂 test
 ┣ 📄 pom.xml
 ┣ 📄 README.md
```

## ⚙️ Configuration

### Application Properties
The application can be configured through the `application.properties` file:

```properties
# Database Configuration
spring.datasource.url=jdbc:h2:file:./fileuploaddb
spring.datasource.username=sa
spring.datasource.password=password

# File Upload Configuration
spring.servlet.multipart.max-file-size=100000MB
spring.servlet.multipart.max-request-size=100000MB

# Custom Application Properties
file.maxSize=100000
```

## 🧠 Advanced Usage

### Securing the Application
For production environments, consider:
1. Implementing Spring Security for authentication
2. Using HTTPS with a valid SSL certificate
3. Adding rate limiting to prevent abuse
4. Implementing file scanning for malware detection

### Database Migration
To switch from H2 to MySQL:

1. Add MySQL dependency in `pom.xml`
2. Update `application.properties` with MySQL connection details:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/filemanager
spring.datasource.username=your_mysql_username
spring.datasource.password=your_mysql_password
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQL8Dialect
```
