import React, { useEffect, useState } from 'react';
import Uppy from '@uppy/core';
import AwsS3 from '@uppy/aws-s3';
import { Dashboard } from '@uppy/react';
import '@uppy/core/dist/style.min.css';
import '@uppy/dashboard/dist/style.min.css';

interface UploadedFile {
  name: string;
  publicUrl: string;
  key: string;
}

interface UppyUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
  onFileReplaced?: () => void;
  fileType: 'thumbnail' | 'game';
  accept?: string[];
  maxFileSize?: number;
  onUploadStart?: () => void;
  onUploadError?: (error: string) => void;
}

export const UppyUpload: React.FC<UppyUploadProps> = ({
  onFileUploaded,
  onFileReplaced,
  fileType,
  accept = ['*'],
  maxFileSize,
  onUploadStart,
  onUploadError
}) => {
  const [uppy, setUppy] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Initialize Uppy
    const uppyInstance = new Uppy({
      id: `uppy-${fileType}-${Date.now()}`, // Make ID unique to prevent conflicts
      restrictions: {
        allowedFileTypes: accept,
        maxFileSize: maxFileSize || (fileType === 'thumbnail' ? 10 * 1024 * 1024 : Infinity),
        maxNumberOfFiles: 1,
      },
      allowMultipleUploads: false,
      debug: true, // Enable debug mode
    }).use(AwsS3, {
      getUploadParameters: async (file: any) => {
        try {
          console.log(`🔄 Getting presigned URL for: ${file.name}, fileType: ${fileType}`);
          
          const token = localStorage.getItem('token');
          console.log('🔑 Token exists:', !!token);
          
          const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';
          const response = await fetch(`${baseURL}/api/games/presigned-url`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              filename: file.name,
              contentType: file.type || 'application/octet-stream',
              fileType
            }),
          });
          
          console.log('📡 Response status:', response.status);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Response error:', errorText);
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
          }
          
          const result = await response.json();
          console.log('📦 Response data:', result);
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to get presigned URL');
          }
          
          const { uploadUrl, publicUrl, key } = result.data;
          
          // Store metadata for success callback
          file.meta.publicUrl = publicUrl;
          file.meta.key = key;
          
          console.log(`✅ Got presigned URL for: ${file.name}, key: ${key}`);
          
          return {
            method: 'PUT',
            url: uploadUrl,
            fields: {},
            headers: {
              'Content-Type': file.type || 'application/octet-stream'
            }
          };
        } catch (error: any) {
          console.error('❌ Error fetching presigned URL:', error);
          onUploadError?.(error.message || 'Failed to get upload URL');
          throw error;
        }
      },
    } as any);

    // Handle upload start
    uppyInstance.on('upload', () => {
      console.log(`🚀 Starting upload for ${fileType}`);
      setIsUploading(true);
      onUploadStart?.();
    });

    // Handle successful uploads
    uppyInstance.on('upload-success', (file: any) => {
      if (!file) return;
      
      console.log(`✅ Upload successful: ${file.name}`, file.meta);
      setIsUploading(false);
      
      const uploadedFile: UploadedFile = {
        name: file.name || '',
        publicUrl: file.meta?.publicUrl || '',
        key: file.meta?.key || ''
      };

      console.log('📤 Calling onFileUploaded with:', uploadedFile);
      onFileUploaded(uploadedFile);
    });

    // Handle file removal (for replacement functionality)
    uppyInstance.on('file-removed', (file: any) => {
      if (!file) return;
      console.log(`🗑️ File removed: ${file.name}`);
      setIsUploading(false);
      onFileReplaced?.();
    });

    // Handle upload errors
    uppyInstance.on('upload-error', (file: any, error: any) => {
      console.error(`❌ Upload failed: ${file?.name}`, error);
      setIsUploading(false);
      onUploadError?.(error?.message || 'Upload failed');
    });

    // Handle complete uploads
    uppyInstance.on('complete', (result: any) => {
      const successfulCount = result?.successful?.length || 0;
      console.log(`🎉 Upload complete! Files: ${successfulCount}`);
      setIsUploading(false);
    });

    setUppy(uppyInstance);

    // Cleanup on unmount
    return () => {
      if (uppyInstance) {
        uppyInstance.destroy();
      }
    };
  }, []); // Remove dependencies to prevent re-initialization

  if (!uppy) {
    return <div>Loading uploader...</div>;
  }

  return (
    <div className="uppy-upload-container">
      <Dashboard
        uppy={uppy}
        width="100%"
        height={200}
        proudlyDisplayPoweredByUppy={false}
        note={`📎 Drag or select ${fileType === 'thumbnail' ? 'an image' : 'a ZIP file'}`}
        showProgressDetails={true}
        theme="light"
      />
      
      {isUploading && (
        <div className="mt-2 text-sm text-blue-600 dark:text-blue-400">
          📤 Uploading {fileType}...
        </div>
      )}
    </div>
  );
};

export default UppyUpload;
