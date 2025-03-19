// script.js
/**
 * File Manager Application
 *
 * This script provides functionality for a file management system that integrates with
 * a Spring Boot REST API. Features include:
 * - File listing and management
 * - Multiple file selection and bulk delete
 * - Drag and drop file uploads with progress tracking
 * - File downloads
 * - File deletion with confirmation
 * - Responsive design
 * - Toast notifications
 *
 * @author File Manager
 * @version 1.1.0
 */
document.addEventListener('DOMContentLoaded', () => {

    const config = {
        API_URL: 'http://localhost:8080/api/files',
        TOAST_DURATION: 3000,
        AUTO_REFRESH_INTERVAL: 60000 // 1 minute
    };


    const API_URL = config.API_URL;


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
    const selectAllCheckbox = document.getElementById('select-all-checkbox');
    const deleteSelectedBtn = document.getElementById('delete-selected-btn');


    let selectedFile = null;
    let currentUploadXHR = null;
    let activeView = 'files';
    let fileToDelete = null;
    let selectedFileIds = new Set();
    let allFiles = [];


    function navigateToView(viewName) {

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


        history.pushState(null, '', `#${viewName}`);

        if (viewName === 'files') {
            loadFiles();
        }
    }


    window.addEventListener('popstate', () => {
        const hash = window.location.hash.substring(1);
        if (hash === 'files' || hash === 'upload') {
            navigateToView(hash);
        } else {
            navigateToView('files');
        }
    });


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


    selectAllCheckbox.addEventListener('change', function() {
        const checkboxes = document.querySelectorAll('.file-row-checkbox');
        checkboxes.forEach(checkbox => {
            checkbox.checked = this.checked;
            const fileId = checkbox.dataset.id;

            if (this.checked) {
                selectedFileIds.add(fileId);
                checkbox.closest('.file-row').classList.add('selected');
            } else {
                selectedFileIds.delete(fileId);
                checkbox.closest('.file-row').classList.remove('selected');
            }
        });

        updateDeleteSelectedButtonVisibility();
    });

    deleteSelectedBtn.addEventListener('click', () => {
        if (selectedFileIds.size > 0) {
            const fileCount = selectedFileIds.size;
            dialogTitle.textContent = 'Delete Selected Files';
            dialogMessage.textContent = `Are you sure you want to delete ${fileCount} selected file${fileCount !== 1 ? 's' : ''}?`;
            confirmDialog.classList.remove('hidden');
            dialogConfirm.onclick = () => {
                confirmDialog.classList.add('hidden');
                deleteSelectedFiles();
            };
        }
    });

    function updateDeleteSelectedButtonVisibility() {
        if (selectedFileIds.size > 0) {
            deleteSelectedBtn.classList.remove('hidden');
        } else {
            deleteSelectedBtn.classList.add('hidden');
        }
    }

    function toggleFileSelection(checkbox, fileId) {
        if (checkbox.checked) {
            selectedFileIds.add(fileId);
            checkbox.closest('.file-row').classList.add('selected');
        } else {
            selectedFileIds.delete(fileId);
            checkbox.closest('.file-row').classList.remove('selected');

            // Update select all checkbox
            if (selectedFileIds.size < allFiles.length) {
                selectAllCheckbox.checked = false;
            }
        }

        updateDeleteSelectedButtonVisibility();
    }

    function deleteSelectedFiles() {
        if (selectedFileIds.size === 0) return;

        setLoading(true);

        const deletePromises = Array.from(selectedFileIds).map(id =>
            fetch(`${API_URL}/${id}`, { method: 'DELETE' })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to delete file with ID ${id}`);
                    }
                    return id;
                })
        );

        Promise.all(deletePromises)
            .then(deletedIds => {
                const fileCount = deletedIds.length;
                showToast(`Successfully deleted ${fileCount} file${fileCount !== 1 ? 's' : ''}.`, 'success');
                selectedFileIds.clear();
                updateDeleteSelectedButtonVisibility();
                loadFiles();
            })
            .catch(error => {
                console.error('Error deleting files:', error);
                showToast('Error occurred while deleting files. Please try again.', 'error');
                setLoading(false);
            });
    }


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


    function handleFileDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length) {
            selectFile(files[0]);
        }
    }


    function handleFileSelect(e) {
        const files = e.target.files;
        if (files.length) {
            selectFile(files[0]);
        }
    }


    function selectFile(file) {
        selectedFile = file;

        selectedFileName.textContent = file.name;
        selectedFileSize.textContent = formatFileSize(file.size);

        selectedFileContainer.classList.remove('hidden');
        progressContainer.classList.add('hidden');
        progressBarInner.style.width = '0%';
        progressPercentage.textContent = '0%';
    }


    function cancelFileSelection() {
        if (currentUploadXHR) {
            currentUploadXHR.abort();
            currentUploadXHR = null;
        }

        selectedFile = null;
        fileInput.value = '';
        selectedFileContainer.classList.add('hidden');
    }


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


        xhr.open('POST', `${API_URL}/upload`);
        xhr.send(formData);

        currentUploadXHR = xhr;
    }


    function loadFiles() {
        setLoading(true);
        selectedFileIds.clear();
        updateDeleteSelectedButtonVisibility();

        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Failed to fetch files. Status: ${response.status}`);
                }
                return response.json();
            })
            .then(files => {
                allFiles = files; // Store all files for reference
                renderFiles(files);
                setLoading(false);
                selectAllCheckbox.checked = false;

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


            const isSelected = selectedFileIds.has(file.id.toString());
            if (isSelected) {
                fileRow.classList.add('selected');
            }

            fileRow.innerHTML = `
                <div class="file-cell file-checkbox">
                    <input type="checkbox" class="checkbox file-row-checkbox" 
                           data-id="${file.id}" ${isSelected ? 'checked' : ''}>
                </div>
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


        document.querySelectorAll('.file-row-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                toggleFileSelection(this, this.dataset.id);
            });
        });
    }


    function downloadFile(id) {
        window.location.href = `${API_URL}/${id}`;
    }


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
                // Remove from selected files if it was selected
                selectedFileIds.delete(id.toString());
                updateDeleteSelectedButtonVisibility();
                loadFiles();
            })
            .catch(error => {
                console.error('Error deleting file:', error);
                showToast('Failed to delete file. Please try again.', 'error');
                setLoading(false);
            });
    }


    function showDeleteConfirmDialog() {
        dialogTitle.textContent = 'Delete File';
        dialogMessage.textContent = `Are you sure you want to delete "${fileToDelete.name}"?`;
        confirmDialog.classList.remove('hidden');


        dialogConfirm.onclick = () => {
            confirmDialog.classList.add('hidden');
            if (fileToDelete) {
                deleteFile(fileToDelete.id);
                fileToDelete = null;
            }
        };
    }

    dialogConfirm.addEventListener('click', () => {

    });

    dialogCancel.addEventListener('click', () => {
        confirmDialog.classList.add('hidden');
        fileToDelete = null;
    });


    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';

        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }


    function formatDate(dateString) {
        if (!dateString) return '';

        const date = new Date(dateString);
        return date.toLocaleString();
    }


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


    function setLoading(isLoading) {
        if (isLoading) {
            loadingSpinner.classList.remove('hidden');
        } else {
            loadingSpinner.classList.add('hidden');
        }
    }


    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        const toastContainer = document.getElementById('toast-container');
        toastContainer.appendChild(toast);


        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, config.TOAST_DURATION);
    }


    navigateToView(window.location.hash.substring(1) || 'files');


    updateDeleteSelectedButtonVisibility();
});