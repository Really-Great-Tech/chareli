import React, { useState } from 'react';
import { useFrontendUpload } from '../hooks/useFrontendUpload';

export const FrontendUploadDemo: React.FC = () => {
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const { uploadGame, progress, isUploading, isCompleted, hasError, reset } = useFrontendUpload();

  const handleUpload = async () => {
    if (!thumbnailFile || !gameFile || !title) {
      alert('Please select both files and enter a title');
      return;
    }

    try {
      const result = await uploadGame(thumbnailFile, gameFile, {
        title,
        description,
      });
      
      console.log('Upload completed!', result);
      alert(`Game uploaded successfully! Game ID: ${result.gameId}`);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleReset = () => {
    reset();
    setThumbnailFile(null);
    setGameFile(null);
    setTitle('');
    setDescription('');
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Frontend-Only Game Upload Demo</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          <strong>Game Title:</strong>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            disabled={isUploading}
          />
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          <strong>Description (optional):</strong>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px', height: '80px' }}
            disabled={isUploading}
          />
        </label>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          <strong>Thumbnail Image:</strong>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            disabled={isUploading}
          />
        </label>
        {thumbnailFile && (
          <p style={{ fontSize: '12px', color: '#666' }}>
            Selected: {thumbnailFile.name} ({Math.round(thumbnailFile.size / 1024)}KB)
          </p>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label>
          <strong>Game ZIP File:</strong>
          <input
            type="file"
            accept=".zip"
            onChange={(e) => setGameFile(e.target.files?.[0] || null)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            disabled={isUploading}
          />
        </label>
        {gameFile && (
          <p style={{ fontSize: '12px', color: '#666' }}>
            Selected: {gameFile.name} ({Math.round(gameFile.size / 1024 / 1024)}MB)
          </p>
        )}
      </div>

      {/* Progress Display */}
      {(isUploading || isCompleted || hasError) && (
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          border: '1px solid #ddd', 
          borderRadius: '5px',
          backgroundColor: hasError ? '#ffebee' : isCompleted ? '#e8f5e8' : '#f5f5f5'
        }}>
          <h4>Upload Progress</h4>
          
          <div style={{ marginBottom: '10px' }}>
            <div style={{ 
              width: '100%', 
              height: '20px', 
              backgroundColor: '#e0e0e0', 
              borderRadius: '10px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                width: `${progress.progress}%`, 
                height: '100%', 
                backgroundColor: hasError ? '#f44336' : isCompleted ? '#4caf50' : '#2196f3',
                transition: 'width 0.3s ease'
              }} />
            </div>
            <p style={{ margin: '5px 0', fontSize: '14px' }}>
              {progress.progress}% - {progress.message}
            </p>
          </div>

          {progress.filesUploaded !== undefined && progress.totalFiles !== undefined && (
            <p style={{ fontSize: '12px', color: '#666' }}>
              Files uploaded: {progress.filesUploaded} / {progress.totalFiles}
            </p>
          )}

          <p style={{ fontSize: '12px', color: '#666' }}>
            Phase: {progress.phase}
          </p>

          {hasError && progress.error && (
            <p style={{ color: '#f44336', fontSize: '14px' }}>
              Error: {progress.error}
            </p>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          onClick={handleUpload}
          disabled={isUploading || !thumbnailFile || !gameFile || !title}
          style={{
            padding: '10px 20px',
            backgroundColor: isUploading ? '#ccc' : '#2196f3',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isUploading ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
        >
          {isUploading ? 'Uploading...' : 'Upload Game'}
        </button>

        {(isCompleted || hasError) && (
          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Reset
          </button>
        )}
      </div>

      {/* Info */}
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f0f8ff', borderRadius: '5px' }}>
        <h4>How it works:</h4>
        <ul style={{ fontSize: '14px', lineHeight: '1.6' }}>
          <li><strong>Frontend Processing:</strong> ZIP file is extracted in your browser using JSZip</li>
          <li><strong>Direct Upload:</strong> All files upload directly to R2 cloud storage (no server bottleneck)</li>
          <li><strong>Parallel Uploads:</strong> Multiple files upload simultaneously for speed</li>
          <li><strong>Real-time Progress:</strong> See actual upload progress (no polling needed)</li>
          <li><strong>No Timeouts:</strong> Large games upload reliably without browser timeouts</li>
        </ul>
      </div>
    </div>
  );
};
