/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { SearchableSelect } from "../../components/ui/searchable-select";
import uploadImg from "../../assets/fetch-upload.svg";
import { useCategories } from "../../backend/category.service";
import { useAsyncGameUpload } from "../../hooks/useAsyncGameUpload";
import { toast } from "sonner";
import GameCreationProgress from "../../components/single/GameCreationProgress";

interface FormValues {
  title: string;
  description: string;
  config: number;
  categoryId: string;
  position?: number;
  thumbnailFile?: File;
  gameFile?: File;
}

// Validation schema
const validationSchema = Yup.object({
  title: Yup.string().required("Title is required").trim(),
  description: Yup.string().required("Description is required").trim(),
  config: Yup.number()
    .required("Config is required")
    .min(0, "Config must be a positive number"),
  categoryId: Yup.string(),
  thumbnailFile: Yup.mixed<File>()
    .required("Thumbnail image is required")
    .test("fileType", "Only image files are allowed", (value) => {
      if (!value) return false;
      return value instanceof File && value.type.startsWith("image/");
    }),
  gameFile: Yup.mixed<File>()
    .required("Game file is required")
    .test("fileType", "Only ZIP files are allowed", (value) => {
      if (!value) return false;
      return value instanceof File && value.name.toLowerCase().endsWith(".zip");
    }),
});

// Initial values
const initialValues: FormValues = {
  title: "",
  description: "",
  config: 1,
  categoryId: "",
};

export default function TestAsyncUpload() {
  const formikRef = useRef<any>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [gameFileName, setGameFileName] = useState<string | null>(null);
  const { data: categories } = useCategories();
  
  // Use the async upload hook
  const { state: asyncState, uploadGame, reset: resetAsync, isLoading, isCompleted } = useAsyncGameUpload();

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      if (!values.thumbnailFile || !values.gameFile) {
        toast.error("Please select both thumbnail and game files");
        return;
      }

      await uploadGame(values.thumbnailFile, values.gameFile, {
        title: values.title,
        description: values.description,
        categoryId: values.categoryId || undefined,
        config: values.config,
        position: values.position
      });

      // Handle success
      if (isCompleted) {
        toast.success("Game uploaded successfully!");
        resetForm();
        setThumbnailPreview(null);
        setGameFileName(null);
        resetAsync();
      }
    } catch (error) {
      console.error("Error uploading game:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    formikRef.current?.resetForm();
    setThumbnailPreview(null);
    setGameFileName(null);
    resetAsync();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Main Content - Styled like Sheet */}
        <div className="bg-white dark:bg-[#0F1621] rounded-lg shadow-lg max-w-xl mx-auto">
          {/* Header like SheetHeader */}
          <div className="p-6 pb-4">
            <h2 className="text-xl font-medium tracking-wider font-dmmono dark:text-white">
              Create New Game
            </h2>
            <div className="border border-b-gray-200 mt-2"></div>
          </div>

          {/* Form Content */}
          <div className="px-6 pb-6">
            <Formik
              initialValues={initialValues}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
              innerRef={formikRef}
            >
              {({ setFieldValue, isSubmitting, isValid, dirty }) => (
                <Form className="grid grid-cols-1 gap-6 pl-4 pr-4">
                  {/* Thumbnail Upload and Order Number */}
                  <div className="grid grid-cols-2 gap-4">
                    {/* Thumbnail Upload */}
                    <div>
                      <Label className="text-base mb-2 block">
                        Add Thumbnail icon
                      </Label>
                      <div className="flex items-center gap-4">
                        <label className="w-40 h-38 flex flex-col items-center justify-center border border-[#CBD5E0] rounded-lg cursor-pointer hover:border-[#D946EF] transition">
                          {thumbnailPreview ? (
                            <img
                              src={thumbnailPreview}
                              alt="thumbnail preview"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <img
                              src={uploadImg}
                              alt="upload"
                              className="dark:text-white"
                            />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            disabled={isLoading}
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
                      </div>
                      <ErrorMessage
                        name="thumbnailFile"
                        component="div"
                        className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                      />
                    </div>

                    {/* Order Number */}
                    <div>
                      <Label
                        htmlFor="position"
                        className="text-base mb-2 block dark:text-white"
                      >
                        Order Number
                      </Label>
                      <Field
                        as={Input}
                        type="number"
                        id="position"
                        name="position"
                        min="1"
                        disabled={isLoading}
                        className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white bg-[#F1F5F9] dark:bg-[#121C2D] px-3 text-gray-700 focus:border-[#D946EF] focus:outline-none font-worksans tracking-wider text-sm"
                        placeholder="e.g., #234"
                      />
                      <ErrorMessage
                        name="position"
                        component="div"
                        className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                      />
                    </div>
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
                      disabled={isLoading}
                      className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white bg-[#F1F5F9] dark:bg-[#121C2D] px-3 text-gray-700 focus:border-[#D946EF] focus:outline-none font-worksans tracking-wider text-sm"
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
                      Short Description
                    </Label>
                    <Field
                      as="textarea"
                      id="description"
                      name="description"
                      disabled={isLoading}
                      className="w-full min-h-[80px] rounded-md border border-[#CBD5E0] dark:text-white dark:bg-[#121C2D] bg-[#F1F5F9] px-3 py-2 font-worksans text-sm tracking-wider text-gray-700 focus:border-[#D946EF] focus:outline-none resize-none"
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
                    <Label className="text-base mb-2 block">Game Upload .zip</Label>
                    <div className="flex items-center gap-4">
                      <label className="w-40 h-38 flex flex-col items-center justify-center border border-[#CBD5E0] rounded-lg cursor-pointer hover:border-[#D946EF] transition">
                        <img src={uploadImg} alt="upload" />
                        <input
                          type="file"
                          accept=".zip"
                          className="hidden"
                          disabled={isLoading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setFieldValue("gameFile", file);
                              setGameFileName(file.name);
                            }
                          }}
                        />
                      </label>
                      {gameFileName && (
                        <span className="font-worksans text-xl tracking-wider text-gray-600 dark:text-gray-300">
                          {gameFileName}
                        </span>
                      )}
                    </div>
                    <ErrorMessage
                      name="gameFile"
                      component="div"
                      className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
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
                          disabled={isLoading}
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
                      disabled={isLoading}
                      className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white dark:bg-[#121C2D] bg-[#F1F5F9] px-3 font-worksans text-sm tracking-wider text-gray-700 focus:border-[#D946EF] focus:outline-none"
                      placeholder="Enter config number eg. (1)"
                    />
                    <ErrorMessage
                      name="config"
                      component="div"
                      className="text-red-500 mt-1 font-worksans text-sm tracking-wider"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 justify-end px-2 mt-4">
                    <Button
                      type="button"
                      className="w-24 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#E2E8F0] dark:text-gray-300 dark:bg-[#1E293B] dark:border-[#334155] dark:hover:bg-[#334155] cursor-pointer"
                      disabled={isLoading}
                      onClick={handleReset}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !isValid || !dirty || isLoading}
                      className="w-24 h-12 bg-[#D946EF] text-white hover:bg-[#C026D3] dark:text-white dark:hover:bg-[#C026D3] cursor-pointer"
                    >
                      {isLoading ? "Creating..." : "Create"}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>

        {/* Progress Bar - Using the same GameCreationProgress component */}
        {isLoading && (
          <GameCreationProgress
            progress={asyncState.progress}
            currentStep={asyncState.message}
            isComplete={isCompleted}
          />
        )}

      </div>
    </div>
  );
}
