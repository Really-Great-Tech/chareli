/* eslint-disable @typescript-eslint/no-explicit-any */
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

  console.log(isUploading)

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
    <div className="uppy-upload-container relative">
      <div className="uppy-dashboard-wrapper relative overflow-hidden rounded-lg">
        <Dashboard
          uppy={uppy}
          width="100%"
          height={fileType === 'thumbnail' ? 220 : 200}
          proudlyDisplayPoweredByUppy={false}
          note={fileType === 'thumbnail' 
            ? 'Drag & drop your game thumbnail or click to browse' 
            : 'Drag & drop your game ZIP file or click to browse'
          }
          showProgressDetails={true}
          theme="light"
        />
        
        {/* Gradient overlay for better visual appeal */}
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-orange-50/30 to-amber-50/30 dark:from-orange-900/10 dark:to-amber-900/10 rounded-lg"></div>
      </div>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          .uppy-upload-container .uppy-Dashboard {
            border-radius: 12px !important;
            border: 2px dashed #D1D5DB !important;
            background: linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%) !important;
            font-family: 'Work Sans', sans-serif !important;
            transition: all 0.3s ease !important;
            position: relative !important;
            overflow: hidden !important;
          }
          
          .uppy-upload-container .uppy-Dashboard:hover {
            border-color: #6A7282 !important;
            background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%) !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 8px 25px rgba(106, 114, 130, 0.15) !important;
          }
          
          .uppy-upload-container .uppy-Dashboard.uppy-Dashboard--isDraggingOver {
            border-color: #6A7282 !important;
            background: linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%) !important;
            transform: scale(1.02) !important;
            box-shadow: 0 12px 35px rgba(106, 114, 130, 0.25) !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-inner {
            background-color: transparent !important;
            padding: 20px !important;
            min-height: 180px !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-AddFiles {
            border: none !important;
            background: none !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-AddFiles-title {
            color: #374151 !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            margin-bottom: 8px !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-dropFilesHereHint {
            color: #6B7280 !important;
            font-size: 14px !important;
            font-weight: 400 !important;
            margin-bottom: 12px !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-browse {
            color: #6A7282 !important;
            font-weight: 600 !important;
            text-decoration: none !important;
            padding: 8px 16px !important;
            background: rgba(106, 114, 130, 0.1) !important;
            border-radius: 6px !important;
            transition: all 0.2s ease !important;
            display: inline-block !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-browse:hover {
            color: #FFFFFF !important;
            background: #6A7282 !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(106, 114, 130, 0.3) !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-note {
            color: #9CA3AF !important;
            font-size: 12px !important;
            margin-top: 8px !important;
            font-style: italic !important;
          }
          
          /* Dark mode styles */
          .dark .uppy-upload-container .uppy-Dashboard {
            background: linear-gradient(135deg, #1E293B 0%, #0F172A 100%) !important;
            border-color: #475569 !important;
          }
          
          .dark .uppy-upload-container .uppy-Dashboard:hover {
            border-color: #6A7282 !important;
            background: linear-gradient(135deg, #475569 0%, #334155 100%) !important;
          }
          
          .dark .uppy-upload-container .uppy-Dashboard.uppy-Dashboard--isDraggingOver {
            border-color: #6A7282 !important;
            background: linear-gradient(135deg, #475569 0%, #334155 100%) !important;
          }
          
          .dark .uppy-upload-container .uppy-Dashboard-AddFiles-title {
            color: #F9FAFB !important;
          }
          
          .dark .uppy-upload-container .uppy-Dashboard-dropFilesHereHint {
            color: #D1D5DB !important;
          }
          
          .dark .uppy-upload-container .uppy-Dashboard-note {
            color: #9CA3AF !important;
          }
          
          .dark .uppy-upload-container .uppy-Dashboard-browse {
            background: rgba(106, 114, 130, 0.2) !important;
          }
          
          /* Progress bar styling */
          .uppy-upload-container .uppy-ProgressBar {
            background-color: #E5E7EB !important;
            border-radius: 8px !important;
            height: 8px !important;
            overflow: hidden !important;
            margin-top: 12px !important;
          }
          
          .uppy-upload-container .uppy-ProgressBar-inner {
            background: linear-gradient(90deg, #6A7282 0%, #5A626F 100%) !important;
            border-radius: 8px !important;
            transition: width 0.3s ease !important;
          }
          
          /* File item styling */
          .uppy-upload-container .uppy-Dashboard-Item {
            border-radius: 8px !important;
            border: 1px solid #E5E7EB !important;
            background: linear-gradient(135deg, #FFFFFF 0%, #F9FAFB 100%) !important;
            margin: 8px 0 !important;
            transition: all 0.2s ease !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-Item:hover {
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
          }
          
          .dark .uppy-upload-container .uppy-Dashboard-Item {
            border-color: #374151 !important;
            background: linear-gradient(135deg, #1F2937 0%, #111827 100%) !important;
          }
          
          /* Animation for upload success */
          @keyframes uploadSuccess {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
          
          .uppy-upload-container .uppy-Dashboard-Item--success {
            animation: uploadSuccess 0.6s ease !important;
          }
          
          /* File preview styling */
          .uppy-upload-container .uppy-Dashboard-Item-preview {
            width: 80px !important;
            height: 80px !important;
            border-radius: 6px !important;
            overflow: hidden !important;
            flex-shrink: 0 !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-Item-previewImg {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            border-radius: 6px !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-Item-fileInfo {
            flex: 1 !important;
            padding-left: 12px !important;
            min-width: 0 !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-Item-name {
            font-size: 14px !important;
            font-weight: 600 !important;
            color: #374151 !important;
            margin-bottom: 4px !important;
            word-break: break-word !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-Item-status {
            font-size: 12px !important;
            color: #6B7280 !important;
          }
          
          .dark .uppy-upload-container .uppy-Dashboard-Item-name {
            color: #F9FAFB !important;
          }
          
          .dark .uppy-upload-container .uppy-Dashboard-Item-status {
            color: #D1D5DB !important;
          }
          
          /* Ensure files list has proper spacing */
          .uppy-upload-container .uppy-Dashboard-files {
            margin-top: 16px !important;
            max-height: 200px !important;
            overflow-y: auto !important;
          }
          
          /* Custom scrollbar for files list */
          .uppy-upload-container .uppy-Dashboard-files::-webkit-scrollbar {
            width: 6px !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-files::-webkit-scrollbar-track {
            background: #F3F4F6 !important;
            border-radius: 3px !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-files::-webkit-scrollbar-thumb {
            background: #D1D5DB !important;
            border-radius: 3px !important;
          }
          
          .uppy-upload-container .uppy-Dashboard-files::-webkit-scrollbar-thumb:hover {
            background: #9CA3AF !important;
          }
          
          .dark .uppy-upload-container .uppy-Dashboard-files::-webkit-scrollbar-track {
            background: #374151 !important;
          }
          
          .dark .uppy-upload-container .uppy-Dashboard-files::-webkit-scrollbar-thumb {
            background: #6B7280 !important;
          }
          
          .dark .uppy-upload-container .uppy-Dashboard-files::-webkit-scrollbar-thumb:hover {
            background: #9CA3AF !important;
          }
        `
      }} />
    </div>
  );
};

export default UppyUpload;
