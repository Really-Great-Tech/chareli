import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import {
  number as yupNumber,
  object as yupObject,
  string as yupString,
} from 'yup';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from '../ui/sheet';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { SearchableSelect } from '../ui/searchable-select';
import { DeleteConfirmationModal } from '../modals/DeleteConfirmationModal';
import {
  useGameById,
  useUpdateGame,
  useDeleteGame,
} from '../../backend/games.service';
import { useCategories } from '../../backend/category.service';
import { toast } from 'sonner';
import logger from '../../utils/logger';
import GameCreationProgress from './GameCreationProgress';
import UppyUpload from './UppyUpload';

interface EditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
}

interface UploadedFile {
  name: string;
  publicUrl: string;
  key: string;
}

interface FormValues {
  title: string;
  description: string;
  config: number;
  categoryId: string;
  position?: number;
  thumbnailFile?: UploadedFile;
  gameFile?: UploadedFile;
}

const validationSchema = yupObject({
  title: yupString().required('Title is required'),
  description: yupString(),
  config: yupNumber()
    .required('Config is required')
    .min(0, 'Config must be a positive number'),
  categoryId: yupString(),
  // For editing, file uploads are completely optional - no validation needed
});

export function EditSheet({ open, onOpenChange, gameId }: EditSheetProps) {
  const formikRef = useRef<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

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

  const { data: game, error } = useGameById(gameId);
  const { data: categories } = useCategories();
  const updateGame = useUpdateGame();
  const deleteGame = useDeleteGame();

  // Close sheet if game is not found
  useEffect(() => {
    const axiosError = error as { response?: { status: number } };
    if (axiosError?.response?.status === 404) {
      onOpenChange(false);
    }
  }, [error, onOpenChange]);

  // Stable callback functions to prevent re-renders
  const handleThumbnailUploaded = React.useCallback((file: UploadedFile) => {
    logger.debug('Thumbnail uploaded');
    setUploadedFiles((prev) => ({ ...prev, thumbnail: file }));
    setIsUploading((prev) => ({ ...prev, thumbnail: false }));
    if (formikRef.current) {
      formikRef.current.setFieldValue('thumbnailFile', file);
    }
  }, []);

  const handleGameUploaded = React.useCallback((file: UploadedFile) => {
    logger.debug('Game file uploaded');
    setUploadedFiles((prev) => ({ ...prev, game: file }));
    setIsUploading((prev) => ({ ...prev, game: false }));
    if (formikRef.current) {
      formikRef.current.setFieldValue('gameFile', file);
    }
  }, []);

  const handleThumbnailReplaced = React.useCallback(() => {
    logger.debug('Thumbnail replaced');
    setUploadedFiles((prev) => ({ ...prev, thumbnail: null }));
    setIsUploading((prev) => ({ ...prev, thumbnail: false }));
    if (formikRef.current) {
      formikRef.current.setFieldValue('thumbnailFile', undefined);
    }
  }, []);

  const handleGameReplaced = React.useCallback(() => {
    logger.debug('Game file replaced');
    setUploadedFiles((prev) => ({ ...prev, game: null }));
    setIsUploading((prev) => ({ ...prev, game: false }));
    if (formikRef.current) {
      formikRef.current.setFieldValue('gameFile', undefined);
    }
  }, []);

  const handleThumbnailUploadStart = React.useCallback(() => {
    logger.debug('Thumbnail upload started');
    setIsUploading((prev) => ({ ...prev, thumbnail: true }));
  }, []);

  const handleGameUploadStart = React.useCallback(() => {
    logger.debug('Game upload started');
    setIsUploading((prev) => ({ ...prev, game: true }));
  }, []);

  const handleThumbnailUploadError = React.useCallback((error: string) => {
    console.error('❌ Thumbnail upload error:', error);
    setIsUploading((prev) => ({ ...prev, thumbnail: false }));
    toast.error(`Thumbnail upload failed: ${error}`);
  }, []);

  const handleGameUploadError = React.useCallback((error: string) => {
    console.error('❌ Game upload error:', error);
    setIsUploading((prev) => ({ ...prev, game: false }));
    toast.error(`Game upload failed: ${error}`);
  }, []);

  const handleSubmit = async (values: FormValues, { setSubmitting }: any) => {
    logger.debug('Edit form submitted');

    try {
      // Show progress bar
      setShowProgress(true);
      setProgress(0);
      setCurrentStep('Processing update...');

      // Send file keys instead of files (similar to CreateGame)
      const gameData = {
        title: values.title,
        description: values.description,
        config: values.config,
        categoryId: values.categoryId,
        position: values.position,
        thumbnailFileKey: values.thumbnailFile?.key,
        gameFileKey: values.gameFile?.key,
      };

      // Don't log game data - may contain sensitive information

      setProgress(50);
      setCurrentStep('Updating game...');

      await updateGame.mutateAsync({ id: gameId, data: gameData });

      setProgress(100);
      setCurrentStep('Update complete!');
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Show different message based on whether game file was updated
      if (values.gameFile?.key) {
        toast.success(
          'Game updated successfully! ZIP processing will continue in the background.',
          { duration: 4000 }
        );
      } else {
        toast.success('Game updated successfully!');
      }
      setUploadedFiles({ thumbnail: null, game: null });
      setShowProgress(false);
      setProgress(0);
      setCurrentStep('');
      onOpenChange(false);
    } catch (err) {
      setShowProgress(false);
      setProgress(0);
      setCurrentStep('');
      toast.error('Failed to update game');
      logger.error('Error updating game');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGame.mutateAsync(gameId);
      toast.success('Game deleted successfully');
      setShowDeleteModal(false);
      onOpenChange(false);
    } catch (err) {
      toast.error('Failed to delete game');
    }
  };

  if (!game) return null;

  const initialValues: FormValues = {
    title: game.title,
    description: game.description || '',
    config: game.config,
    categoryId: game.categoryId || '',
    position: game.position || undefined,
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          // Reset all states when sheet closes
          setUploadedFiles({ thumbnail: null, game: null });
          setShowProgress(false);
          setProgress(0);
          setCurrentStep('');
          if (formikRef.current) {
            formikRef.current.resetForm();
          }
        }
        onOpenChange(isOpen);
      }}
    >
      <SheetContent
        side="right"
        className="max-w-xl w-full overflow-y-auto p-6 font-dmmono dark:bg-[#0F1621]"
      >
        <div className="mb-4">
          <SheetTitle className="text-lg mt-8 tracking-wider border-b">
            Edit Game
          </SheetTitle>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          innerRef={formikRef}
        >
          {({ isSubmitting }) => {
            // Form state available in React DevTools
            return (
              <Form className="space-y-6">
                {/* Thumbnail Upload */}
                <div>
                  <Label className="text-base mb-3 block dark:text-white">
                    Update Thumbnail
                  </Label>
                  <UppyUpload
                    fileType="thumbnail"
                    accept={['image/*']}
                    onFileUploaded={handleThumbnailUploaded}
                    onFileReplaced={handleThumbnailReplaced}
                    onUploadStart={handleThumbnailUploadStart}
                    onUploadError={handleThumbnailUploadError}
                  />
                  {uploadedFiles.thumbnail && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 font-worksans">
                        <span className="font-medium">
                          {uploadedFiles.thumbnail.name}
                        </span>
                        <span className="text-xs bg-green-100 dark:bg-green-800 px-2 py-1 rounded-full">
                          Uploaded
                        </span>
                      </div>
                    </div>
                  )}
                  {isUploading.thumbnail && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 font-worksans">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span>Uploading thumbnail...</span>
                      </div>
                    </div>
                  )}
                  <ErrorMessage
                    name="thumbnailFile"
                    component="div"
                    className="text-red-500 mt-2 font-worksans text-sm tracking-wider"
                  />
                </div>

                {/* Order Number */}
                <div>
                  <Label
                    htmlFor="position"
                    className="text-base mb-2 block dark:text-white"
                  >
                    Order Number (Optional)
                  </Label>
                  <Field
                    as={Input}
                    type="number"
                    id="position"
                    name="position"
                    min="1"
                    className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white bg-[#F1F5F9] dark:bg-[#121C2D] px-3 text-gray-700 focus:border-[#6A7282] focus:outline-none font-worksans tracking-wider text-sm"
                    placeholder="e.g., 1, 2, 3..."
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-worksans">
                    Position in the games list
                  </p>
                  <ErrorMessage
                    name="position"
                    component="div"
                    className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                  />
                </div>

                {/* Title */}
                <div>
                  <Label
                    htmlFor="title"
                    className="text-base mb-2 block dark:text-white"
                  >
                    Title
                  </Label>
                  <Field
                    as={Input}
                    id="title"
                    name="title"
                    className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white bg-[#F1F5F9] dark:bg-[#121C2D] px-3 text-gray-700 focus:border-[#6A7282] focus:outline-none font-worksans tracking-wider text-sm"
                    placeholder="Enter game title"
                  />
                  <ErrorMessage
                    name="title"
                    component="div"
                    className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label
                    htmlFor="description"
                    className="text-base mb-2 block dark:text-white"
                  >
                    Short Description (Optional)
                  </Label>
                  <Field
                    as="textarea"
                    id="description"
                    name="description"
                    className="w-full min-h-[80px] rounded-md border border-[#CBD5E0] dark:text-white dark:bg-[#121C2D] bg-[#F1F5F9] px-3 py-2 font-worksans text-sm tracking-wider text-gray-700 focus:border-[#6A7282] focus:outline-none resize-none"
                    placeholder="Description"
                  />
                  <ErrorMessage
                    name="description"
                    component="div"
                    className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                  />
                </div>

                {/* Game Upload */}
                <div>
                  <Label className="text-base mb-2 block">
                    Update Game File (.zip)
                  </Label>
                  <UppyUpload
                    fileType="game"
                    accept={['.zip']}
                    onFileUploaded={handleGameUploaded}
                    onFileReplaced={handleGameReplaced}
                    onUploadStart={handleGameUploadStart}
                    onUploadError={handleGameUploadError}
                  />
                  {uploadedFiles.game && (
                    <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                      <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 font-worksans">
                        <span className="font-medium">
                          {uploadedFiles.game.name}
                        </span>
                        <span className="text-xs bg-green-100 dark:bg-green-800 px-2 py-1 rounded-full">
                          Uploaded
                        </span>
                      </div>
                    </div>
                  )}
                  {isUploading.game && (
                    <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
                      <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-400 font-worksans">
                        <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        <span>Uploading game file...</span>
                      </div>
                    </div>
                  )}
                  <ErrorMessage
                    name="gameFile"
                    component="div"
                    className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                  />
                </div>

                {/* Category */}
                <div>
                  <Label className="text-base mb-2 block dark:text-white">
                    Game Category
                  </Label>
                  <Field name="categoryId">
                    {({ field, form }: any) => (
                      <SearchableSelect
                        value={field.value}
                        onValueChange={(value: string) =>
                          form.setFieldValue('categoryId', value)
                        }
                        options={
                          categories?.map((category) => ({
                            value: category.id,
                            label: category.name,
                          })) || []
                        }
                        placeholder="Select category (optional)"
                        searchPlaceholder="Search categories..."
                        emptyText="No categories found"
                      />
                    )}
                  </Field>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-worksans">
                    Leave empty to auto-assign to default category
                  </p>
                  <ErrorMessage
                    name="categoryId"
                    component="div"
                    className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                  />
                </div>

                {/* Config */}
                <div>
                  <Label
                    htmlFor="config"
                    className="text-base mb-2 block dark:text-white"
                  >
                    Free Game Time (mins)
                  </Label>
                  <Field
                    as={Input}
                    type="number"
                    id="config"
                    name="config"
                    min="0"
                    className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white dark:bg-[#121C2D] bg-[#F1F5F9] px-3 font-worksans text-sm tracking-wider text-gray-700 focus:border-[#6A7282] focus:outline-none"
                    placeholder="Enter config number eg. (1)"
                  />
                  <ErrorMessage
                    name="config"
                    component="div"
                    className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                  />
                </div>

                <SheetFooter className="flex flex-row justify-between mt-6">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteModal(true)}
                    className="dark:bg-[#EF4444]"
                  >
                    Delete
                  </Button>
                  <div className="flex gap-2">
                    <SheetClose asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="dark:text-black dark:bg-white cursor-pointer"
                      >
                        Cancel
                      </Button>
                    </SheetClose>
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting ||
                        isUploading.thumbnail ||
                        isUploading.game
                      }
                      variant="default"
                      className="bg-[#6A7282] hover:bg-[#5A626F] dark:text-white cursor-pointer"
                      onClick={() => {
                        // Don't log button clicks - use React DevTools
                        // Don't prevent default - let form handle submission
                      }}
                    >
                      {isSubmitting ? 'Updating...' : 'Update'}
                    </Button>
                  </div>
                </SheetFooter>
              </Form>
            );
          }}
        </Formik>

        {/* Progress Bar */}
        {showProgress && (
          <GameCreationProgress
            progress={progress}
            currentStep={currentStep}
            isComplete={progress === 100}
          />
        )}
      </SheetContent>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onConfirm={handleDelete}
        isDeleting={deleteGame.isPending}
      />
    </Sheet>
  );
}
