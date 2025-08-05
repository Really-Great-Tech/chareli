/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { SearchableSelect } from "../ui/searchable-select";
// import uploadImg from "../../assets/fetch-upload.svg";
import { useCreateGame } from "../../backend/games.service";
import { useCategories } from "../../backend/category.service";
import { toast } from "sonner";
import GameCreationProgress from "./GameCreationProgress";
import UppyUpload from "./UppyUpload";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

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

// Validation schema
const validationSchema = Yup.object({
  title: Yup.string().required("Title is required").trim(),
  description: Yup.string().required("Description is required").trim(),
  config: Yup.number()
    .required("Config is required")
    .min(0, "Config must be a positive number"),
  categoryId: Yup.string(),
  thumbnailFile: Yup.object()
    .required("Thumbnail image is required")
    .shape({
      name: Yup.string().required(),
      publicUrl: Yup.string().required(),
      key: Yup.string().required(),
    }),
  gameFile: Yup.object()
    .required("Game file is required")
    .shape({
      name: Yup.string().required(),
      publicUrl: Yup.string().required(),
      key: Yup.string().required(),
    }),
});

// Initial values
const initialValues: FormValues = {
  title: "",
  description: "",
  config: 1,
  categoryId: "",
};

export function CreateGameSheet({
  children,
  onOpenChange,
}: {
  children: React.ReactNode;
  onOpenChange?: (open: boolean) => void;
}) {
  const formikRef = useRef<any>(null);
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

  // Stable callback functions to prevent re-renders
  const handleThumbnailUploaded = React.useCallback((file: UploadedFile) => {
    console.log('📸 Thumbnail uploaded:', file);
    setUploadedFiles(prev => ({ ...prev, thumbnail: file }));
    setIsUploading(prev => ({ ...prev, thumbnail: false }));
    if (formikRef.current) {
      formikRef.current.setFieldValue("thumbnailFile", file);
    }
  }, []);

  const handleGameUploaded = React.useCallback((file: UploadedFile) => {
    console.log('🎮 Game uploaded:', file);
    setUploadedFiles(prev => ({ ...prev, game: file }));
    setIsUploading(prev => ({ ...prev, game: false }));
    if (formikRef.current) {
      formikRef.current.setFieldValue("gameFile", file);
    }
  }, []);

  const handleThumbnailReplaced = React.useCallback(() => {
    console.log('🗑️ Thumbnail replaced');
    setUploadedFiles(prev => ({ ...prev, thumbnail: null }));
    setIsUploading(prev => ({ ...prev, thumbnail: false }));
    if (formikRef.current) {
      formikRef.current.setFieldValue("thumbnailFile", undefined);
    }
  }, []);

  const handleGameReplaced = React.useCallback(() => {
    console.log('🗑️ Game replaced');
    setUploadedFiles(prev => ({ ...prev, game: null }));
    setIsUploading(prev => ({ ...prev, game: false }));
    if (formikRef.current) {
      formikRef.current.setFieldValue("gameFile", undefined);
    }
  }, []);

  const handleThumbnailUploadStart = React.useCallback(() => {
    console.log('🚀 Thumbnail upload started');
    setIsUploading(prev => ({ ...prev, thumbnail: true }));
  }, []);

  const handleGameUploadStart = React.useCallback(() => {
    console.log('🚀 Game upload started');
    setIsUploading(prev => ({ ...prev, game: true }));
  }, []);

  const handleThumbnailUploadError = React.useCallback((error: string) => {
    console.error('❌ Thumbnail upload error:', error);
    setIsUploading(prev => ({ ...prev, thumbnail: false }));
    toast.error(`Thumbnail upload failed: ${error}`);
  }, []);

  const handleGameUploadError = React.useCallback((error: string) => {
    console.error('❌ Game upload error:', error);
    setIsUploading(prev => ({ ...prev, game: false }));
    toast.error(`Game upload failed: ${error}`);
  }, []);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const createGame = useCreateGame();
  const { data: categories } = useCategories();
  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      // Show progress bar
      setShowProgress(true);
      setProgress(0);
      setCurrentStep("Processing game...");

      // Send file keys instead of files
      const gameData = {
        title: values.title,
        description: values.description,
        config: values.config,
        categoryId: values.categoryId,
        position: values.position,
        thumbnailFileKey: values.thumbnailFile?.key,
        gameFileKey: values.gameFile?.key,
      };

      setProgress(50);
      setCurrentStep("Creating game...");

      await createGame.mutateAsync(gameData);

      setProgress(100);
      setCurrentStep("Complete!");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Game created successfully!");
      resetForm();
      setUploadedFiles({ thumbnail: null, game: null });
      setShowProgress(false);
      setProgress(0);
      setCurrentStep("");
      onOpenChange?.(false);
    } catch (error) {
      setShowProgress(false);
      setProgress(0);
      setCurrentStep("");
      toast.error("Failed to create game");
      console.error("Error creating game:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet
      onOpenChange={(open) => {
        if (!open && formikRef.current) {
          formikRef.current.resetForm();
          setUploadedFiles({ thumbnail: null, game: null });
        }
        onOpenChange?.(open);
      }}
    >
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="font-dmmono dark:bg-[#0F1621] max-w-xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-xl font-medium tracking-wider mt-6 mb-2">
            Create New Game
          </SheetTitle>
          <div className="border border-b-gray-200 mb-2"></div>
        </SheetHeader>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          innerRef={formikRef}
        >
          {({ isSubmitting, isValid, dirty }) => (
            <Form className="grid grid-cols-1 gap-6 pl-4 pr-4">
              {/* Thumbnail Upload - Full Width */}
              <div>
                <Label className="text-base mb-3 block dark:text-white">
                  Game Thumbnail
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
                      <span className="font-medium">{uploadedFiles.thumbnail.name}</span>
                      <span className="text-xs bg-green-100 dark:bg-green-800 px-2 py-1 rounded-full">Uploaded</span>
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

              {/* Order Number - Separate Row */}
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
                  className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white bg-[#F1F5F9] dark:bg-[#121C2D] px-3 text-gray-700 focus:border-[#D946EF] focus:outline-none font-worksans tracking-wider text-sm"
                  placeholder="e.g., 1, 2, 3..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-worksans">
                  Position in the games list (leave empty for auto-assignment)
                </p>
                <ErrorMessage
                  name="position"
                  component="div"
                  className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                />
              </div>

              {/* Title Input */}
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
                  className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white bg-[#F1F5F9] dark:bg-[#121C2D] px-3 text-gray-700 focus:border-[#D946EF] focus:outline-none font-worksans tracking-wider text-sm"
                  placeholder="Enter game title"
                />
                <ErrorMessage
                  name="title"
                  component="div"
                  className="text-red-500  mt-1 font-worksans text-sm tracking-wider"
                />
              </div>

              {/* Description */}
              <div>
                <Label
                  htmlFor="description"
                  className="text-base mb-2 block dark:text-white"
                >
                  Short Description
                </Label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  className="w-full min-h-[80px] rounded-md border border-[#CBD5E0] dark:text-white dark:bg-[#121C2D] bg-[#F1F5F9] px-3 py-2 font-worksans text-sm tracking-wider  text-gray-700 focus:border-[#D946EF] focus:outline-none resize-none"
                  placeholder="Description"
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="text-red-500  mt-1 font-worksans text-sm tracking-wider"
                />
              </div>

              {/* Game Upload */}
              <div>
                <Label className="text-base mb-2 block">Game Upload .zip</Label>
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
                      <span className="font-medium">{uploadedFiles.game.name}</span>
                      <span className="text-xs bg-green-100 dark:bg-green-800 px-2 py-1 rounded-full">Uploaded</span>
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
                  className="text-red-500  mt-1 font-worksans text-sm tracking-wider"
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <Label className="text-base mb-2 block dark:text-white">
                  Game Category
                </Label>
                <Field name="categoryId">
                  {({ field, form }: any) => (
                    <SearchableSelect
                      value={field.value}
                      onValueChange={(value: string) => form.setFieldValue("categoryId", value)}
                      options={categories?.map((category) => ({
                        value: category.id,
                        label: category.name
                      })) || []}
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

              {/* Config Input */}
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
                  min="1"
                  className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white dark:bg-[#121C2D] bg-[#F1F5F9] px-3 font-worksans text-sm tracking-wider  text-gray-700 focus:border-[#D946EF] focus:outline-none"
                  placeholder="Enter config number eg. (1)"
                />
                <ErrorMessage
                  name="config"
                  component="div"
                  className="text-red-500  mt-1 font-worksans text-sm tracking-wider"
                />
              </div>

              <div className="flex gap-3 justify-end px-2 mt-4">
                <SheetClose asChild>
                  <Button
                    type="button"
                    className="w-24 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0] dark:text-gray-300 dark:bg-[#1E293B] dark:border-[#334155] dark:hover:bg-[#334155] cursor-pointer"
                    onClick={() => {
                      formikRef.current?.resetForm();
                      setUploadedFiles({ thumbnail: null, game: null });
                    }}
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || 
                    !isValid || 
                    !dirty || 
                    !uploadedFiles.thumbnail || 
                    !uploadedFiles.game ||
                    isUploading.thumbnail ||
                    isUploading.game
                  }
                  className="w-24 h-12 bg-[#D946EF] text-white hover:bg-[#C026D3] dark:text-white dark:hover:bg-[#C026D3] cursor-pointer"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </Button>
              </div>
            </Form>
          )}
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
    </Sheet>
  );
}
