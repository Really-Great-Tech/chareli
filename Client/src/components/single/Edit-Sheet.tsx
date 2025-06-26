import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetFooter,
  SheetClose,
} from "../ui/sheet";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";
import { XIcon } from "lucide-react";
import {
  useGameById,
  useUpdateGame,
  useDeleteGame,
} from "../../backend/games.service";
import { useCategories } from "../../backend/category.service";
import { toast } from "sonner";
import uploadImg from "../../assets/fetch-upload.svg";
import GameCreationProgress from "./GameCreationProgress";
// import type { GameResponse } from "../../backend/types";

interface EditSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gameId: string;
}

interface FormValues {
  title: string;
  description: string;
  config: number;
  categoryId: string;
  position?: number;
  thumbnailFile?: File;
  gameFile?: File;
}

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  description: Yup.string(),
  config: Yup.number()
    .required("Config is required")
    .min(0, "Config must be a positive number"),
  categoryId: Yup.string().required("Category is required"),
  thumbnailFile: Yup.mixed<File>(),
  gameFile: Yup.mixed<File>(),
});

export function EditSheet({ open, onOpenChange, gameId }: EditSheetProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [gameFileName, setGameFileName] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");

  const { data: game, error } = useGameById(gameId);

  console.log("games by id", gameFileName);

  // Close sheet if game is not found
  useEffect(() => {
    const axiosError = error as { response?: { status: number } };
    if (axiosError?.response?.status === 404) {
      onOpenChange(false);
    }
  }, [error, onOpenChange]);
  const { data: categories } = useCategories();

  // Set initial thumbnail and file name when game data loads
  useEffect(() => {
    if (game) {
      // Reset states when game changes
      setThumbnailPreview(null);
      setGameFileName(null);

      // Set thumbnail preview if available
      if (game.thumbnailFile?.s3Key) {
        setIsImageLoading(true);
        setThumbnailPreview(game.thumbnailFile.s3Key);
      }

      // Set game file name if available
      if (game.gameFile?.name) {
        setGameFileName(game.gameFile.name);
      }
    }
  }, [game?.id]); // Only run when game ID changes to prevent unnecessary updates
  const updateGame = useUpdateGame();
  const deleteGame = useDeleteGame();

  const handleSubmit = async (values: FormValues, { setSubmitting }: any) => {
    try {
      // Show progress bar
      setShowProgress(true);
      setProgress(0);
      setCurrentStep("Preparing update...");

      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("description", values.description);
      formData.append("config", String(values.config));
      formData.append("categoryId", values.categoryId);

      if (values.position) {
        formData.append("position", String(values.position));
      }

      if (values.thumbnailFile) {
        formData.append("thumbnailFile", values.thumbnailFile);
      }
      if (values.gameFile) {
        formData.append("gameFile", values.gameFile);
      }

      // Simulate progress steps
      setProgress(20);
      setCurrentStep("Updating thumbnail...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      setProgress(50);
      setCurrentStep("Updating game file...");
      await new Promise((resolve) => setTimeout(resolve, 500));

      setProgress(80);
      setCurrentStep("Processing update...");

      await updateGame.mutateAsync({ id: gameId, data: formData });

      setProgress(100);
      setCurrentStep("Update complete!");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast.success("Game updated successfully!");
      setShowProgress(false);
      setProgress(0);
      setCurrentStep("");
      onOpenChange(false);
    } catch (error) {
      setShowProgress(false);
      setProgress(0);
      setCurrentStep("");

      console.log("error", error);
      // toast.error('Failed to update game');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteGame.mutateAsync(gameId);
      toast.success("Game deleted successfully");
      setShowDeleteModal(false);
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete game");
    }
  };

  if (!game) return null;

  const initialValues: FormValues = {
    title: game.title,
    description: game.description || "",
    config: game.config,
    categoryId: game.categoryId || "",
    position: game.position || undefined,
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="max-w-md w-full overflow-y-auto p-6 font-dmmono dark:bg-[#0F1621]"
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
        >
          {({ setFieldValue, isSubmitting }) => (
            <Form className="space-y-4">
              {/* Thumbnail Upload and Order Number */}
              <div className="grid grid-cols-2 gap-4">
                {/* Thumbnail Upload */}
                <div>
                  <Label className="text-base">Update Thumbnail icon</Label>
                  <div className="mt-2 relative w-36 h-36">
                    {thumbnailPreview ? (
                      <label className="relative w-36 h-36 cursor-pointer group">
                        <img
                          src={thumbnailPreview}
                          alt="Thumbnail"
                          className={`w-36 h-36 rounded-lg object-cover transition-opacity duration-200 group-hover:opacity-75 ${
                            isImageLoading ? "opacity-0" : "opacity-100"
                          }`}
                          onLoad={() => setIsImageLoading(false)}
                          onError={(e) => {
                            // If image fails to load, clear the preview
                            setThumbnailPreview(null);
                            e.currentTarget.onerror = null; // Prevent infinite loop
                          }}
                        />
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            Click to change
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFieldValue("thumbnailFile", file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setThumbnailPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setThumbnailPreview(null);
                            setFieldValue("thumbnailFile", undefined);
                          }}
                          className="absolute top-2 right-2 bg-[#C026D3] text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-[#a21caf] transition-colors"
                          title="Remove thumbnail"
                        >
                          <XIcon className="w-4 h-4" />
                        </button>
                      </label>
                    ) : isImageLoading ? (
                      <div className="w-36 h-36 rounded-lg bg-[#F1F5F9] dark:bg-[#121C2D] animate-pulse flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-[#D946EF] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <label className="w-36 h-36 flex flex-col items-center justify-center border border-[#e5e7eb] rounded-lg cursor-pointer hover:bg-[#f3e8ff] transition">
                        <span className="flex items-center justify-center">
                          <img src={uploadImg} alt="upload" />
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFieldValue("thumbnailFile", file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setThumbnailPreview(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                  <ErrorMessage
                    name="thumbnailFile"
                    component="div"
                    className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                  />
                </div>

                {/* Order Number */}
                <div>
                  <Label htmlFor="position" className="text-base">
                    Order Number
                  </Label>
                  <Field
                    as={Input}
                    type="number"
                    id="position"
                    name="position"
                    min="1"
                    className="mt-1 font-worksans text-sm tracking-wider bg-[#F1F5F9] shadow-none dark:bg-[#121C2D]"
                    placeholder="e.g., #234"
                  />
                  <ErrorMessage
                    name="position"
                    component="div"
                    className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                  />
                </div>
              </div>

              <div className="mt-8">
                <Label htmlFor="title" className="text-base">
                  Title
                </Label>
                <Field
                  as={Input}
                  id="title"
                  name="title"
                  className="mt-1 font-worksans text-sm tracking-wider bg-[#F1F5F9] shadow-none dark:bg-[#121C2D]"
                />
                <ErrorMessage
                  name="title"
                  component="div"
                  className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                />
              </div>

              <div className="mt-8">
                <Label htmlFor="description" className="text-base">
                  Short Description
                </Label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  className="w-full mt-1 rounded-md border bg-transparent p-2 font-worksans text-sm tracking-wider dark:text-white dark:bg-[#121C2D]"
                  rows={3}
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                />
              </div>

              <div className="mt-8">
                <Label className="text-base mb-2 block">Game Upload .zip</Label>
                <div className="mt-2 relative w-36 h-36">
                  {gameFileName || game.gameFile ? (
                    <label className="relative w-36 h-36 cursor-pointer group">
                      {/* Show game thumbnail as visual representation */}
                      <img
                        src={
                          thumbnailPreview ||
                          game.thumbnailFile?.s3Key ||
                          uploadImg
                        }
                        alt="Game File"
                        className="w-36 h-36 rounded-lg object-cover transition-opacity duration-200 group-hover:opacity-75"
                        onError={(e) => {
                          // If thumbnail fails to load, show upload icon
                          e.currentTarget.src = uploadImg;
                        }}
                      />
                      {/* Overlay on hover */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          Click to change
                        </span>
                      </div>
                      {/* ZIP badge overlay */}
                      <div className="absolute top-2 left-2 bg-[#D946EF] text-white rounded px-2 py-1 text-xs font-bold">
                        ZIP
                      </div>
                      <input
                        type="file"
                        accept=".zip"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFieldValue("gameFile", file);
                            setGameFileName(file.name);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setGameFileName(null);
                          setFieldValue("gameFile", undefined);
                        }}
                        className="absolute top-2 right-2 bg-[#C026D3] text-white rounded-full w-6 h-6 flex items-center justify-center shadow hover:bg-[#a21caf] transition-colors"
                        title="Remove game file"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </label>
                  ) : (
                    <label className="w-36 h-36 flex flex-col items-center justify-center border border-[#e5e7eb] rounded-lg cursor-pointer hover:bg-[#f3e8ff] transition">
                      <span className="flex items-center justify-center">
                        <img src={uploadImg} alt="upload" />
                      </span>
                      <input
                        type="file"
                        accept=".zip"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setFieldValue("gameFile", file);
                            setGameFileName(file.name);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
                {/* Show game title as file name */}
                {(gameFileName || game.gameFile) && (
                  <div className="mt-2 text-sm font-worksans tracking-wider text-gray-600 dark:text-gray-300">
                    📁 {gameFileName || `${game.title}.zip`}
                  </div>
                )}
                <ErrorMessage
                  name="gameFile"
                  component="div"
                  className="text-red-500 mt-1 font-worksans text-xl tracking-wider"
                />
              </div>

              <div className="mt-8">
                <Label htmlFor="categoryId" className="text-base">
                  Game Category
                </Label>
                <div className="relative">
                  <Field
                    as="select"
                    id="categoryId"
                    name="categoryId"
                    className="mt-1 w-full rounded-lg dark:bg-[#121C2D] dark:text-white bg-[#F1F5F9] text-[#64748b] px-4 py-3 font-worksans text-sm tracking-wider outline-none border-none appearance-none pr-10"
                  >
                    <option value="">Select category</option>
                    {categories?.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </Field>
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]">
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20">
                      <path
                        d="M6 8l4 4 4-4"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </div>
                <ErrorMessage
                  name="categoryId"
                  component="div"
                  className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                />
              </div>

              <div>
                <Label htmlFor="config" className="mt-8 text-base">
                  Game Config
                </Label>
                <Field
                  as={Input}
                  type="number"
                  id="config"
                  name="config"
                  min="0"
                  className="mt-1 bg-[#F1F5F9] shadow-none border-none text-sm dark:bg-[#121C2D]"
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
                      className="dark:text-black dark:bg-white"
                    >
                      Cancel
                    </Button>
                  </SheetClose>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    variant="default"
                    className="bg-[#D946EF] hover:bg-accent dark:text-white"
                  >
                    {isSubmitting ? "Updating..." : "Update"}
                  </Button>
                </div>
              </SheetFooter>
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
