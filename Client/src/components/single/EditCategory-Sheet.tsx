import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "../ui/sheet";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Button } from "../ui/button";
import {
  useCategoryById,
  useUpdateCategory,
  useDeleteCategory,
} from "../../backend/category.service";
import { toast } from "sonner";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";
import { useQueryClient } from "@tanstack/react-query";
import { BackendRoute } from "../../backend/constants";

interface EditCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
}

interface FormValues {
  name: string;
  description?: string;
}

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required"),
  description: Yup.string(),
});

export function EditCategory({
  open,
  onOpenChange,
  categoryId,
}: EditCategoryProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { data: category, error } = useCategoryById(categoryId);
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const queryClient = useQueryClient();

  // Close sheet if category is not found
  useEffect(() => {
    const axiosError = error as { response?: { status: number } };
    if (axiosError?.response?.status === 404) {
      onOpenChange(false);
    }
  }, [error, onOpenChange]);

  const handleSubmit = async (values: FormValues, { setSubmitting }: any) => {
    try {
      await updateCategory.mutateAsync({
        id: categoryId,
        data: values,
      });
      toast.success("Category updated successfully!");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update category");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteCategory.mutateAsync(categoryId);
      queryClient.invalidateQueries({ queryKey: [BackendRoute.CATEGORIES] });
      toast.success("Category deleted successfully");
      setShowDeleteModal(false);
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to delete category");
    }
  };

  if (!category) return null;

  const initialValues: FormValues = {
    name: category.name,
    description: category.description || "",
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-md w-[90vw] bg-white dark:bg-[#18192b] border-l border-gray-200 dark:border-gray-800"
      >
        <SheetHeader className="pb-4 mt-8 font-dmmono">
          <SheetTitle className="text-lg font-bold border-b">
            Edit Category
          </SheetTitle>
        </SheetHeader>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="flex flex-col gap-6 mt-2 font-dmmono px-3">
              <div>
                <Label htmlFor="name" className="text-base mb-1">
                  Category Name
                </Label>
                <Field
                  as={Input}
                  id="name"
                  name="name"
                  placeholder="Name"
                  className="bg-[#F5F6FA] mt-1  font-worksans text-sm tracking-wider dark:bg-[#121C2D] dark:text-white"
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-500  mt-1 font-worksans text-sm tracking-wider"
                /> 
              </div>

              <div>
                <Label htmlFor="description" className="text-base mb-1 mt-4">
                  Game Description
                </Label>
                <Field
                  as="textarea"
                  id="description"
                  name="description"
                  placeholder="Description"
                  className="bg-[#F5F6FA] mt-1  rounded-md border border-input w-full min-h-[100px] p-3 resize-none font-worksans text-sm tracking-wider dark:bg-[#121C2D] dark:text-white"
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="text-red-500  mt-1 font-worksans text-xl tracking-wider"
                />
              </div>

              <div className="flex justify-between mt-8 items-center">
                {!category.isDefault && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => setShowDeleteModal(true)}
                    className="dark:bg-[#EF4444]"
                  >
                    Delete
                  </Button>
                )}
                <div className="flex gap-3 flex-1 justify-end">
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
                    disabled={isSubmitting}
                    variant="default"
                    className="bg-[#D946EF] hover:bg-accent dark:text-white cursor-pointer"
                  >
                    {isSubmitting ? "Updating..." : "Update"}
                  </Button>
                </div>
              </div>
            </Form>
          )}
        </Formik>

        <DeleteConfirmationModal
          open={showDeleteModal}
          onOpenChange={setShowDeleteModal}
          onConfirm={handleDelete}
          isDeleting={deleteCategory.isPending}
          title="Are you sure you want to Delete Category?"
          description="This action cannot be reversed"
        />
      </SheetContent>
    </Sheet>
  );
}

export default EditCategory;
