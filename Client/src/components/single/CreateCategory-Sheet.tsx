/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "../ui/sheet";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { useCreateCategory } from "../../backend/category.service";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";

interface CreateCategoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormValues {
  name: string;
  description?: string;
}

const validationSchema = Yup.object({
  name: Yup.string().required("Name is required").trim(),
  description: Yup.string().trim(),
});

export function CreateCategory({ open, onOpenChange }: CreateCategoryProps) {
  const formikRef = useRef<any>(null);
  const createCategory = useCreateCategory();

  const handleSubmit = async (
    values: FormValues,
    { setSubmitting, resetForm }: any
  ) => {
    try {
      await createCategory.mutateAsync(values);
      toast.success("Category created successfully!");
      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to create category");
    } finally {
      setSubmitting(false);
    }
  };

  const initialValues: FormValues = {
    name: "",
    description: "",
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(open) => {
        if (!open && formikRef.current) {
          formikRef.current.resetForm();
        }
        onOpenChange(open);
      }}
    >
      <SheetContent
        side="right"
        className="sm:max-w-md w-[90vw] bg-white dark:bg-[#18192b] border-l border-gray-200 dark:border-gray-800"
      >
        <SheetHeader className="pb-4 mt-8 font-dmmono">
          <SheetTitle className="text-xl font-bold border-b">
            Create New Category
          </SheetTitle>
        </SheetHeader>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          innerRef={formikRef}
        >
          {({ isSubmitting, isValid, dirty }) => (
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
                  className="bg-[#F5F6FA] mt-1 text-sm font-worksans dark:bg-[#121C2D] dark:text-white"
                />
                <ErrorMessage
                  name="name"
                  component="div"
                  className="text-red-500 text-xs mt-1 font-worksans"
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
                  className="bg-[#F5F6FA] mt-1 text-sm rounded-md border border-input w-full min-h-[100px] p-3 resize-none font-worksans dark:bg-[#121C2D] dark:text-white"
                />
                <ErrorMessage
                  name="description"
                  component="div"
                  className="text-red-500 text-xs mt-1 font-worksans"
                />
              </div>

              <div className="flex gap-4 justify-end mt-8">
                <SheetClose asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="dark:text-black dark:bg-white"
                    onClick={() => {
                      formikRef.current?.resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </SheetClose>

                <Button
                  type="submit"
                  disabled={isSubmitting || !isValid || !dirty}
                  variant="default"
                  className="bg-[#D946EF] hover:bg-accent dark:text-white"
                >
                  {isSubmitting ? "Creating..." : "Create"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </SheetContent>
    </Sheet>
  );
}

export default CreateCategory;
