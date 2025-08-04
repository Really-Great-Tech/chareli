import React, { useState } from 'react';
import { useAsyncGameUpload } from '../hooks/useAsyncGameUpload';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle, AlertCircle, Upload, Loader2 } from 'lucide-react';

export const AsyncGameUpload: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [gameFile, setGameFile] = useState<File | null>(null);
  
  const { state, uploadGame, reset, isLoading, isCompleted, hasError } = useAsyncGameUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !thumbnailFile || !gameFile) {
      alert('Please fill in all required fields');
      return;
    }

    await uploadGame(thumbnailFile, gameFile, {
      title,
      description
    });
  };

  const handleReset = () => {
    reset();
    setTitle('');
    setDescription('');
    setThumbnailFile(null);
    setGameFile(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Upload New Game</h2>
        <p className="text-gray-600 mt-2">Fast, direct upload to cloud storage</p>
      </div>

      {/* Upload Form */}
      {!isCompleted && !hasError && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Game Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter game title"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter game description"
              disabled={isLoading}
            />
          </div>

          <div>
            <Label htmlFor="thumbnail">Thumbnail Image *</Label>
            <Input
              id="thumbnail"
              type="file"
              accept="image/*"
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              disabled={isLoading}
              required
            />
            {thumbnailFile && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {thumbnailFile.name} ({(thumbnailFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="gameFile">Game ZIP File *</Label>
            <Input
              id="gameFile"
              type="file"
              accept=".zip"
              onChange={(e) => setGameFile(e.target.files?.[0] || null)}
              disabled={isLoading}
              required
            />
            {gameFile && (
              <p className="text-sm text-gray-600 mt-1">
                Selected: {gameFile.name} ({(gameFile.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            )}
          </div>

          <Button 
            type="submit" 
            disabled={isLoading || !title || !thumbnailFile || !gameFile}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Game
              </>
            )}
          </Button>
        </form>
      )}

      {/* Progress Display */}
      {isLoading && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold">{state.message}</h3>
          </div>

          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{state.progress}%</span>
            </div>
            <Progress value={state.progress} className="w-full" />
          </div>

          {/* File Upload Progress */}
          {state.phase === 'uploading' && (
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Thumbnail</span>
                  <span>{state.uploadProgress.thumbnail}%</span>
                </div>
                <Progress value={state.uploadProgress.thumbnail} className="w-full h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Game File</span>
                  <span>{state.uploadProgress.game}%</span>
                </div>
                <Progress value={state.uploadProgress.game} className="w-full h-2" />
              </div>
            </div>
          )}

          {/* Phase Indicators */}
          <div className="flex justify-center space-x-4 text-sm">
            <div className={`flex items-center ${state.phase === 'preparing' ? 'text-blue-600' : state.phase === 'uploading' || state.phase === 'processing' || state.phase === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${state.phase === 'preparing' ? 'bg-blue-600 animate-pulse' : state.phase === 'uploading' || state.phase === 'processing' || state.phase === 'completed' ? 'bg-green-600' : 'bg-gray-400'}`} />
              Prepare
            </div>
            <div className={`flex items-center ${state.phase === 'uploading' ? 'text-blue-600' : state.phase === 'processing' || state.phase === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${state.phase === 'uploading' ? 'bg-blue-600 animate-pulse' : state.phase === 'processing' || state.phase === 'completed' ? 'bg-green-600' : 'bg-gray-400'}`} />
              Upload
            </div>
            <div className={`flex items-center ${state.phase === 'processing' ? 'text-blue-600' : state.phase === 'completed' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-2 h-2 rounded-full mr-2 ${state.phase === 'processing' ? 'bg-blue-600 animate-pulse' : state.phase === 'completed' ? 'bg-green-600' : 'bg-gray-400'}`} />
              Process
            </div>
          </div>
        </div>
      )}

      {/* Success State */}
      {isCompleted && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <div className="space-y-2">
              <p className="font-semibold">Upload completed successfully!</p>
              <p>Your game "{title}" has been uploaded and is now available.</p>
              {state.gameId && (
                <p className="text-sm">Game ID: {state.gameId}</p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Error State */}
      {hasError && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <div className="space-y-2">
              <p className="font-semibold">Upload failed</p>
              <p>{state.error}</p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Reset Button */}
      {(isCompleted || hasError) && (
        <Button onClick={handleReset} variant="outline" className="w-full">
          Upload Another Game
        </Button>
      )}
    </div>
  );
};
