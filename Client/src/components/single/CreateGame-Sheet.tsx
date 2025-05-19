import { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import uploadImg from "../../assets/Fetch-upload.svg";
import { useCreateGame } from "../../backend/games.service";
import { useCategories } from "../../backend/category.service";
import { toast } from "sonner";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

interface FormValues {
  title: string;
  description: string;
  config: number;
  categoryId: string;
  thumbnailFile?: File;
  gameFile?: File;
}

// Validation schema
const validationSchema = Yup.object({
  title: Yup.string().required('Title is required'),
  description: Yup.string(),
  config: Yup.number()
    .required('Config is required')
    .min(0, 'Config must be a positive number'),
  categoryId: Yup.string().required('Category is required'),
  thumbnailFile: Yup.mixed<File>(),
  gameFile: Yup.mixed<File>()
});

// Initial values
const initialValues: FormValues = {
  title: '',
  description: '',
  config: 0,
  categoryId: '',
};

export function CreateGameSheet({ children, onOpenChange }: { children: React.ReactNode; onOpenChange?: (open: boolean) => void }) {
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [gameFileName, setGameFileName] = useState<string | null>(null);
  const createGame = useCreateGame();
  const { data: categories } = useCategories();
  const handleSubmit = async (values: FormValues, { setSubmitting, resetForm }: any) => {
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('config', String(values.config));
      formData.append('categoryId', values.categoryId);
      
      if (values.thumbnailFile) {
        formData.append('thumbnailFile', values.thumbnailFile);
      }
      if (values.gameFile) {
        formData.append('gameFile', values.gameFile);
      }

      await createGame.mutateAsync(formData);
      toast.success("Game created successfully!");
      resetForm();
      setThumbnailPreview(null);
      setGameFileName(null);
      onOpenChange?.(false);
    } catch (error) {
      toast.error("Failed to create game");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="font-boogaloo dark:bg-[#0F1621] max-w-xl w-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl font-bold tracking-wider mt-6 mb-2">Create New Game</SheetTitle>
          <div className="border border-b-gray-200 mb-2"></div>
        </SheetHeader>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ setFieldValue, isSubmitting }) => (
            <Form className="grid grid-cols-1 gap-6 pl-4 pr-4">
              {/* Thumbnail Upload */}
              <div>
                <Label className="text-lg mb-2 block">Add Thumbnail icon</Label>
                <div className="flex items-center gap-4">
                  <label className="w-40 h-38 flex flex-col items-center justify-center border border-[#CBD5E0] rounded-lg cursor-pointer hover:border-[#D946EF] transition">
                    {thumbnailPreview ? (
                      <img src={thumbnailPreview} alt="thumbnail preview" className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <img src={uploadImg} alt="upload" className="dark:text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFieldValue('thumbnailFile', file);
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
                <ErrorMessage name="thumbnailFile" component="div" className="text-red-500 text-xs mt-1 font-pincuk" />
              </div>

              {/* Title Input */}
              <div>
                <Label htmlFor="title" className="text-lg mb-2 block dark:text-white">Title</Label>
                <Field
                  as={Input}
                  id="title"
                  name="title"
                  className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white bg-[#F1F5F9] dark:bg-[#121C2D] px-3 text-gray-700 focus:border-[#D946EF] focus:outline-none font-pincuk text-sm"
                  placeholder="Enter game title"
                />
                <ErrorMessage name="title" component="div" className="text-red-500 text-xs mt-1 font-pincuk" />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-lg mb-2 block dark:text-white">Short Description</Label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  className="w-full min-h-[80px] rounded-md border border-[#CBD5E0] dark:text-white dark:bg-[#121C2D] bg-[#F1F5F9] px-3 py-2 font-pincuk text-sm text-gray-700 focus:border-[#D946EF] focus:outline-none resize-none"
                  placeholder="Description"
                />
                <ErrorMessage name="description" component="div" className="text-red-500 text-xs mt-1 font-pincuk" />
              </div>

              {/* Game Upload */}
              <div>
                <Label className="text-lg mb-2 block">Game Upload .zip</Label>
                <div className="flex items-center gap-4">
                  <label className="w-40 h-38 flex flex-col items-center justify-center border border-[#CBD5E0] rounded-lg cursor-pointer hover:border-[#D946EF] transition">
                    <img src={uploadImg} alt="upload" />
                    <input
                      type="file"
                      accept=".zip"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setFieldValue('gameFile', file);
                          setGameFileName(file.name);
                        }
                      }}
                    />
                  </label>
                  {gameFileName && (
                    <span className="text-sm font-pincuk text-gray-600 dark:text-gray-300">
                      {gameFileName}
                    </span>
                  )}
                </div>
                <ErrorMessage name="gameFile" component="div" className="text-red-500 text-xs mt-1 font-pincuk" />
              </div>

              {/* Category Dropdown */}
              <div>
                <Label htmlFor="categoryId" className="text-lg mb-2 block dark:text-white">Game Category</Label>
                <Field
                  as="select"
                  id="categoryId"
                  name="categoryId"
                  className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white dark:bg-[#121C2D] bg-[#F1F5F9] px-3 font-pincuk text-sm text-gray-700 focus:border-[#D946EF] focus:outline-none"
                >
                  <option value="">Select category</option>
                  {categories?.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="categoryId" component="div" className="text-red-500 text-xs mt-1 font-pincuk" />
              </div>

              {/* Config Input */}
              <div>
                <Label htmlFor="config" className="text-lg mb-2 block dark:text-white">Game Config</Label>
                <Field
                  as={Input}
                  type="number"
                  id="config"
                  name="config"
                  min="0"
                  className="w-full h-12 rounded-md border border-[#CBD5E0] dark:text-white dark:bg-[#121C2D] bg-[#F1F5F9] px-3 font-pincuk text-sm text-gray-700 focus:border-[#D946EF] focus:outline-none"
                  placeholder="Enter config number"
                />
                <ErrorMessage name="config" component="div" className="text-red-500 text-xs mt-1 font-pincuk" />
              </div>

              <div className="flex gap-3 justify-end px-2 mt-4">
                <SheetClose asChild>
                  <Button
                    type="button"
                    className="w-24 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-accent"
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-24 h-12 bg-[#D946EF] dark:text-white hover:text-[#D946EF] hover:bg-[#F3E8FF]"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </SheetContent>
    </Sheet>
  )
}
