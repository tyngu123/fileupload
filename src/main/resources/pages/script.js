// script.js
/**
 * File Manager Application
 *
 * This script provides functionality for a file management system that integrates with
 * a Spring Boot REST API. Features include:
 * - File listing and management
 * - Drag and drop file uploads with progress tracking
 * - File downloads
 * - File deletion with confirmation
 * - Responsive design
 * - Toast notifications
 *
 * @author File Manager
 * @version 1.0.0
 */
document.addEventListener('DOMContentLoaded', () => {
    // Configuration
    const config = {
        API_URL: 'http://localhost:8080/api/files',
        TOAST_DURATION: 3000,
        AUTO_REFRESH_INTERVAL: 60000 // 1 minute
    };

    // API URL configuration
    const API_URL = config.API_URL;

    // DOM Elements
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view');
    const fileListBody = document.getElementById('file-list-body');
    const noFilesMessage = document.getElementById('no-files-message');
    const fileListContainer = document.getElementById('file-list');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const browseBtn = document.getElementById('browse-btn');
    const selectedFileContainer = document.getElementById('selected-file-container');
    const selectedFileName = document.getElementById('selected-file-name');
    const selectedFileSize = document.getElementById('selected-file-size');
    const uploadBtn = document.getElementById('upload-btn');
    const cancelUploadBtn = document.getElementById('cancel-upload-btn');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBarInner = document.getElementById('progress-bar-inner');
    const progressPercentage = document.getElementById('progress-percentage');
    const loadingSpinner = document.getElementById('loading-spinner');
    const navigateToUploadBtns = document.querySelectorAll('#navigate-to-upload, #navigate-to-upload-empty');
    const confirmDialog = document.getElementById('confirm-dialog');
    const dialogTitle = document.getElementById('dialog-title');
    const dialogMessage = document.getElementById('dialog-message');
    const dialogConfirm = document.getElementById('dialog-confirm');
    const dialogCancel = document.getElementById('dialog-cancel');

    // State
    let selectedFile = null;
    let currentUploadXHR = null;
    let activeView = 'files';
    let fileToDelete = null;

    // Navigation between views
    function navigateToView(viewName) {
        // Clear any auto-refresh timers
        clearTimeout(window.autoRefreshTimeout);

        views.forEach(view => {
            view.classList.add('hidden');
        });

        document.getElementById(`${viewName}-view`).classList.remove('hidden');

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.view === viewName) {
                link.classList.add('active');
            }
        });

        activeView = viewName;

        // Update URL hash without triggering page reload
        history.pushState(null, '', `#${viewName}`);

        if (viewName === 'files') {
            loadFiles();
        }
    }

    // Handle browser back/forward navigation
    window.addEventListener('popstate', () => {
        const hash = window.location.hash.substring(1);
        if (hash === 'files' || hash === 'upload') {
            navigateToView(hash);
        } else {
            navigateToView('files');
        }
    });

    // Navigation event listeners
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToView(link.dataset.view);
        });
    });

    navigateToUploadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            navigateToView('upload');
        });
    });

    // File Upload Logic
    // Set up drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, () => {
            dropzone.classList.remove('drag-over');
        });
    });

    dropzone.addEventListener('drop', handleFileDrop);
    fileInput.addEventListener('change', handleFileSelect);
    browseBtn.addEventListener('click', () => fileInput.click());
    uploadBtn.addEventListener('click', uploadFile);
    cancelUploadBtn.addEventListener('click', cancelFileSelection);

    // Handle file drop
    function handleFileDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length) {
            selectFile(files[0]);
        }
    }

    // Handle file selection
    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length) {
            selectFile(files[0]);
        }
    }

    // Select a file for upload
    function selectFile(file) {
        selectedFile = file;

        selectedFileName.textContent = file.name;
        selectedFileSize.textContent = formatFileSize(file.size);

        selectedFileContainer.classList.remove('hidden');
        progressContainer.classList.add('hidden');
        progressBarInner.style.width = '0%';
        progressPercentage.textContent = '0%';
    }

    // Cancel file selection
    function cancelFileSelection() {
        if (currentUploadXHR) {
            currentUploadXHR.abort();
            currentUploadXHR = null;
        }

        selectedFile = null;
        fileInput.value = '';
        selectedFileContainer.classList.add('hidden');
    }

    // Upload the selected file
    function uploadFile() {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        const xhr = new XMLHttpRequest();

        // Setup progress tracking
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const percentComplete = Math.round((e.loaded / e.total) * 100);
                progressBarInner.style.width = percentComplete + '%';
                progressPercentage.textContent = percentComplete + '%';
            }
        });

        // Setup event listeners
        xhr.addEventListener('loadstart', () => {
            progressContainer.classList.remove('hidden');
            uploadBtn.disabled = true;
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                showToast('File uploaded successfully!', 'success');
                cancelFileSelection();
                navigateToView('files');
            } else {
                let errorMessage = 'Upload failed.';
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMessage = response.message || errorMessage;
                } catch (e) {
                    console.error('Error parsing error response:', e);
                }
                showToast(errorMessage, 'error');
            }
        });

        xhr.addEventListener('error', () => {
            showToast('Upload failed. Please try again.', 'error');
        });

        xhr.addEventListener('abort', () => {
            showToast('Upload cancelled.', 'info');
        });

        xhr.addEventListener('loadend', () => {
            uploadBtn.disabled = false;
            currentUploadXHR = null;
        });

        // Send the request
        xhr.open('POST', `${API_URL}/upload`);
        xhr.send(formData);

        currentUploadXHR = xhr;
    }

    // File Listing Logic
    // Load files from the API
    function loadFiles() {
        setLoading(true);

        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch files. Status: ${response.status}`);
                }
                return response.json();
            })
            .then(files => {
                renderFiles(files);
                setLoading(false);

                // Set up automatic refresh
                if (activeView === 'files') {
                    clearTimeout(window.autoRefreshTimeout);
                    window.autoRefreshTimeout = setTimeout(() => {
                        if (activeView === 'files') {
                            loadFiles();
                        }
                    }, config.AUTO_REFRESH_INTERVAL);
                }
            })
            .catch(error => {
                console.error('Error fetching files:', error);
                showToast('Failed to load files. Please try again.', 'error');
                setLoading(false);
            });
    }

    // Render files in the UI
    function renderFiles(files) {
        fileListBody.innerHTML = '';

        if (files.length === 0) {
            noFilesMessage.classList.remove('hidden');
            fileListContainer.classList.add('hidden');
            return;
        }

        noFilesMessage.classList.add('hidden');
        fileListContainer.classList.remove('hidden');

        files.forEach(file => {
            const fileRow = document.createElement('div');
            fileRow.className = 'file-row';

            fileRow.innerHTML = `
                <div class="file-cell file-name" title="${file.fileName}">${file.fileName}</div>
                <div class="file-cell file-type">${getFileTypeLabel(file.fileType)}</div>
                <div class="file-cell file-size">${formatFileSize(file.fileSize)}</div>
                <div class="file-cell file-date">${formatDate(file.uploadDateTime)}</div>
                <div class="file-cell file-actions">
                    <button class="btn btn-icon btn-secondary download-btn" title="Download" data-id="${file.id}">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="btn btn-icon btn-danger delete-btn" title="Delete" data-id="${file.id}" data-name="${file.fileName}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;

            fileListBody.appendChild(fileRow);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.addEventListener('click', () => downloadFile(btn.dataset.id));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                fileToDelete = {
                    id: btn.dataset.id,
                    name: btn.dataset.name
                };
                showDeleteConfirmDialog();
            });
        });
    }

    // Download a file
    function downloadFile(id) {
        window.location.href = `${API_URL}/${id}`;
    }

    // Delete a file
    function deleteFile(id) {
        setLoading(true);

        fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to delete file.');
                }
                showToast('File deleted successfully!', 'success');
                loadFiles();
            })
            .catch(error => {
                console.error('Error deleting file:', error);
                showToast('Failed to delete file. Please try again.', 'error');
                setLoading(false);
            });
    }

    // Confirm Dialog Logic
    function showDeleteConfirmDialog() {
        dialogTitle.textContent = 'Delete File';
        dialogMessage.textContent = `Are you sure you want to delete "${fileToDelete.name}"?`;
        confirmDialog.classList.remove('hidden');
    }

    dialogConfirm.addEventListener('click', () => {
        confirmDialog.classList.add('hidden');
        if (fileToDelete) {
            deleteFile(fileToDelete.id);
            fileToDelete = null;
        }
    });

    dialogCancel.addEventListener('click', () => {
        confirmDialog.classList.add('hidden');
        fileToDelete = null;
    });

    // Utility Functions
    // Format file size for display
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Format date for display
    function formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        return date.toLocaleString();
    }

    // Get a friendly label for file types
    function getFileTypeLabel(mimeType) {
        if (!mimeType) return 'Unknown';

        if (mimeType.startsWith('image/')) {
            return mimeType.replace('image/', '').toUpperCase();
        } else if (mimeType === 'application/pdf') {
            return 'PDF';
        } else if (mimeType.includes('word')) {
            return 'Word';
        } else if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) {
            return 'Excel';
        } else if (mimeType.includes('presentation')) {
            return 'PowerPoint';
        } else if (mimeType.includes('text/')) {
            return mimeType.replace('text/', '').toUpperCase();
        } else {
            return mimeType.split('/').pop().toUpperCase();
        }
    }

    // Show/hide loading spinner
    function setLoading(isLoading) {
        if (isLoading) {
            loadingSpinner.classList.remove('hidden');
        } else {
            loadingSpinner.classList.add('hidden');
        }
    }

    // Show a toast notification
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        const toastContainer = document.getElementById('toast-container');
        toastContainer.appendChild(toast);

        // Remove the toast after a delay
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, config.TOAST_DURATION);
    }
});