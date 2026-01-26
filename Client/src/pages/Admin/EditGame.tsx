import { useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { object as yupObject, string as yupString, number as yupNumber } from 'yup';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { SearchableSelect } from '../../components/ui/searchable-select';
import { useGameById, useUpdateGame } from '../../backend/games.service';
import { useCategories } from '../../backend/category.service';
import { toast } from 'sonner';
import { RichTextEditor } from '../../components/ui/RichTextEditor';
import { GameBreadcrumb } from '../../components/single/GameBreadcrumb';
import UppyUpload from '../../components/single/UppyUpload';
import { X } from 'lucide-react';
import DOMPurify from 'dompurify';
import logger from '../../utils/logger';

interface UploadedFile {
  name: string;
  publicUrl: string;
  key: string;
}

interface FormValues {
  title: string;
  developer: string;
  platform: string;
  categoryId: string;
  position: number;
  config: number;
  description: string;
  howToPlay: string;
  tags: string[];
  thumbnailFile?: UploadedFile;
  gameFile?: UploadedFile;
}

const validationSchema = yupObject({
  title: yupString().required('Title is required').trim(),
  developer: yupString().trim(),
  categoryId: yupString(),
  position: yupNumber().min(0, 'Position must be a positive number'),
  config: yupNumber().required('Free game time is required').min(0, 'Must be a positive number'),
  description: yupString(),
  howToPlay: yupString(),
});

export default function EditGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const formikRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [newTag, setNewTag] = useState('');
  const { data: game, isLoading } = useGameById(gameId || '');
  const { data: categories } = useCategories();
  const updateGame = useUpdateGame();

  const [uploadedFiles, setUploadedFiles] = useState<{
    thumbnail: UploadedFile | null;
    game: UploadedFile | null;
  }>({
    thumbnail: null,
    game: null,
  });

  const [isUploading, setIsUploading] = useState({
    thumbnail: false,
    game: false,
  });

  // Upload handlers
  const handleThumbnailUploaded = useCallback((file: UploadedFile) => {
    logger.debug('Thumbnail uploaded');
    setUploadedFiles((prev) => ({ ...prev, thumbnail: file }));
    setIsUploading((prev) => ({ ...prev, thumbnail: false }));
    if (formikRef.current) {
      formikRef.current.setFieldValue('thumbnailFile', file);
    }
  }, []);

  const handleGameUploaded = useCallback((file: UploadedFile) => {
    logger.debug('Game file uploaded');
    setUploadedFiles((prev) => ({ ...prev, game: file }));
    setIsUploading((prev) => ({ ...prev, game: false }));
    if (formikRef.current) {
      formikRef.current.setFieldValue('gameFile', file);
    }
  }, []);

  const handleThumbnailReplaced = useCallback(() => {
    logger.debug('Thumbnail replaced');
    setUploadedFiles((prev) => ({ ...prev, thumbnail: null }));
    setIsUploading((prev) => ({ ...prev, thumbnail: false }));
    if (formikRef.current) {
      formikRef.current.setFieldValue('thumbnailFile', undefined);
    }
  }, []);

  const handleGameReplaced = useCallback(() => {
    logger.debug('Game file replaced');
    setUploadedFiles((prev) => ({ ...prev, game: null }));
    setIsUploading((prev) => ({ ...prev, game: false }));
    if (formikRef.current) {
      formikRef.current.setFieldValue('gameFile', undefined);
    }
  }, []);

  const handleThumbnailUploadStart = useCallback(() => {
    logger.debug('Thumbnail upload started');
    setIsUploading((prev) => ({ ...prev, thumbnail: true }));
  }, []);

  const handleGameUploadStart = useCallback(() => {
    logger.debug('Game upload started');
    setIsUploading((prev) => ({ ...prev, game: true }));
  }, []);

  const handleThumbnailUploadError = useCallback((error: string) => {
    console.error('❌ Thumbnail upload error:', error);
    setIsUploading((prev) => ({ ...prev, thumbnail: false }));
    toast.error(`Thumbnail upload failed: ${error}`);
  }, []);

  const handleGameUploadError = useCallback((error: string) => {
    console.error('❌ Game upload error:', error);
    setIsUploading((prev) => ({ ...prev, game: false }));
    toast.error(`Game upload failed: ${error}`);
  }, []);

  const handleSubmit = async (values: FormValues, { setSubmitting }: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    try {
      // Sanitize HTML content with DOMPurify before sending
      const gameData: any = { // eslint-disable-line @typescript-eslint/no-explicit-any
        title: values.title,
        description: values.description ? DOMPurify.sanitize(values.description, {
          ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote'],
          ALLOWED_ATTR: ['href', 'class'],
        }) : undefined,
        categoryId: values.categoryId || undefined,
        position: values.position || undefined,
        config: values.config,
        metadata: {
          developer: values.developer || undefined,
          platform: values.platform || 'desktop',
          howToPlay: values.howToPlay ? DOMPurify.sanitize(values.howToPlay, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'a', 'blockquote'],
            ALLOWED_ATTR: ['href', 'class'],
          }) : undefined,
          tags: values.tags.length > 0 ? values.tags : undefined,
        },
      };

      // Add file keys if new files were uploaded
      if (values.thumbnailFile) {
        gameData.thumbnailKey = values.thumbnailFile.key;
      }
      if (values.gameFile) {
        gameData.gameKey = values.gameFile.key;
      }

      await updateGame.mutateAsync({ id: gameId || '', data: gameData });
      toast.success('Game updated successfully!');
      navigate(`/admin/view-game/${gameId}`);
    } catch {
      toast.error('Failed to update game');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6A7282]"></div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="p-6">
        <p className="text-red-500">Game not found</p>
      </div>
    );
  }

  // Helper function to ensure tags is always an array
  const ensureArray = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    // If it's an object with numeric keys (converted from array), convert back to array
    if (typeof value === 'object') {
      return Object.values(value).filter((v): v is string => typeof v === 'string');
    }
    return [];
  };

  const initialValues: FormValues = {
    title: game.title || '',
    developer: game.metadata?.developer || '',
    platform: Array.isArray(game.metadata?.platform)
      ? game.metadata.platform
      : game.metadata?.platform
        ? [game.metadata.platform]
        : ['desktop'],
    categoryId: game.category?.id || '',
    position: game.position || 0,
    config: game.config || 1,
    description: game.description || '',
    howToPlay: game.metadata?.howToPlay || '',
    tags: ensureArray(game.metadata?.tags),
  };

  const categoryOptions = categories?.map((cat) => ({
    value: cat.id,
    label: cat.name,
  })) || [];

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <GameBreadcrumb
          categoryName={game.category?.name}
          categoryId={game.category?.id}
          gameTitle={game.title}
          overrideLink={`/admin/view-game/${gameId}`}
          overrideText="Game Detail"
        />
        <h1 className="text-2xl font-bold mt-4 text-gray-900 dark:text-white">
          Edit Game
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Update all game information and metadata
        </p>
      </div>

      {/* Form */}
      <Formik
        innerRef={formikRef}
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
        enableReinitialize
      >
        {({ values, setFieldValue, isSubmitting }) => (
          <Form className="space-y-6">
            {/* Thumbnail Upload */}
            <div className="space-y-2">
              <Label>Thumbnail Image</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {game.thumbnailUrl ? 'Current thumbnail will be replaced if you upload a new one' : 'Upload a new thumbnail'}
              </p>
              <div className="flex flex-col gap-4">
                {game.thumbnailUrl && !uploadedFiles.thumbnail && (
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm font-medium mb-2">Current Thumbnail:</p>
                    <img
                      src={game.thumbnailUrl}
                      alt="Current thumbnail"
                      className="max-w-xs rounded border"
                    />
                  </div>
                )}
                <UppyUpload
                  onFileUploaded={handleThumbnailUploaded}
                  onFileReplaced={handleThumbnailReplaced}
                  onUploadStart={handleThumbnailUploadStart}
                  onUploadError={handleThumbnailUploadError}
                  fileType="thumbnail"
                  accept={['image/*']}
                  maxFileSize={5 * 1024 * 1024}
                />
              </div>
            </div>

            {/* Game File Upload */}
            <div className="space-y-2">
              <Label>Game File</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {game.gameUrl ? 'Current game file will be replaced if you upload a new one' : 'Upload a new game file'}
              </p>
              <div className="flex flex-col gap-4">
                {game.gameUrl && !uploadedFiles.game && (
                  <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-800">
                    <p className="text-sm font-medium">Current Game File:</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{game.gameUrl}</p>
                  </div>
                )}
                <UppyUpload
                  onFileUploaded={handleGameUploaded}
                  onFileReplaced={handleGameReplaced}
                  onUploadStart={handleGameUploadStart}
                  onUploadError={handleGameUploadError}
                  fileType="game"
                  maxFileSize={100 * 1024 * 1024}
                />
              </div>
            </div>

            {/* Position/Order */}
            <div className="space-y-2">
              <Label htmlFor="position">Position/Order Number</Label>
              <Field
                as={Input}
                id="position"
                name="position"
                type="number"
                placeholder="Enter position number (e.g., 1, 2, 3...)"
                className="bg-white dark:bg-gray-800"
              />
              <ErrorMessage
                name="position"
                component="p"
                className="text-sm text-red-500"
              />
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Game Title *</Label>
              <Field
                as={Input}
                id="title"
                name="title"
                placeholder="Enter game title"
                className="bg-white dark:bg-gray-800"
              />
              <ErrorMessage
                name="title"
                component="p"
                className="text-sm text-red-500"
              />
            </div>

            {/* Developer */}
            <div className="space-y-2">
              <Label htmlFor="developer">Developer</Label>
              <Field
                as={Input}
                id="developer"
                name="developer"
                placeholder="Enter developer name (e.g., ArcadesBox)"
                className="bg-white dark:bg-gray-800"
              />
              <ErrorMessage
                name="developer"
                component="p"
                className="text-sm text-red-500"
              />
            </div>

            {/* Platform */}
            <div className="space-y-2">
              <Label>Platform</Label>
              <SearchableSelect
                options={[
                  { value: 'Desktop', label: 'Desktop' },
                  { value: 'Mobile', label: 'Mobile' },
                  { value: 'Tablet', label: 'Tablet' },
                ]}
                value={values.platform}
                onValueChange={(value) => setFieldValue('platform', value)}
                placeholder="Select platforms..."
                isMulti={true}
              />
              <ErrorMessage
                name="platform"
                component="p"
                className="text-sm text-red-500"
              />
            </div>

            {/* Release Date */}
            <div className="space-y-2">
              <Label htmlFor="releaseDate">Release Date</Label>
              <Field
                as={Input}
                id="releaseDate"
                name="releaseDate"
                type="date"
                placeholder="Select release date"
                className="bg-white dark:bg-gray-800"
              />
              <ErrorMessage
                name="releaseDate"
                component="p"
                className="text-sm text-red-500"
              />
            </div>

            {/* Game Category */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">Game Category</Label>
              <SearchableSelect
                options={categoryOptions}
                value={values.categoryId}
                onValueChange={(value) => setFieldValue('categoryId', value)}
                placeholder="Select a category"
              />
              <ErrorMessage
                name="categoryId"
                component="p"
                className="text-sm text-red-500"
              />
            </div>

            {/* Free Game Time / Config */}
            <div className="space-y-2">
              <Label htmlFor="config">Free Game Time (minutes) *</Label>
              <Field
                as={Input}
                id="config"
                name="config"
                type="number"
                placeholder="Enter free game time in minutes"
                className="bg-white dark:bg-gray-800"
              />
              <ErrorMessage
                name="config"
                component="p"
                className="text-sm text-red-500"
              />
            </div>

            {/* Game Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Game Description</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rich text editor - supports formatting, lists, and links
              </p>
              <RichTextEditor
                content={values.description}
                onChange={(html) => setFieldValue('description', html)}
                placeholder="Enter game description with formatting..."
              />
              <ErrorMessage
                name="description"
                component="p"
                className="text-sm text-red-500"
              />
            </div>

            {/* How to Play */}
            <div className="space-y-2">
              <Label htmlFor="howToPlay">How to Play</Label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rich text editor - supports formatting, lists, and links
              </p>
              <RichTextEditor
                content={values.howToPlay}
                onChange={(html) => setFieldValue('howToPlay', html)}
                placeholder="Enter instructions on how to play..."
              />
              <ErrorMessage
                name="howToPlay"
                component="p"
                className="text-sm text-red-500"
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newTag.trim() && !values.tags.includes(newTag.trim())) {
                        setFieldValue('tags', [...values.tags, newTag.trim()]);
                        setNewTag('');
                      }
                    }
                  }}
                  placeholder="Add a tag and press Enter"
                  className="bg-white dark:bg-gray-800"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newTag.trim() && !values.tags.includes(newTag.trim())) {
                      setFieldValue('tags', [...values.tags, newTag.trim()]);
                      setNewTag('');
                    }
                  }}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {values.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => {
                        setFieldValue(
                          'tags',
                          values.tags.filter((_, i) => i !== index)
                        );
                      }}
                      className="ml-1 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/admin/view-game/${gameId}`)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isUploading.thumbnail || isUploading.game}
                className="bg-[#6A7282] hover:bg-[#5A626F] text-white"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  );
}
