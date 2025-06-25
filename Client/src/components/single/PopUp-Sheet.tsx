import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { toast } from "sonner";
import * as Yup from "yup";
import { useCreateSystemConfig } from "../../backend/configuration.service";
import { BackendRoute } from "../../backend/constants";
import { useQueryClient } from "@tanstack/react-query";

const validationSchema = Yup.object({
  title: Yup.string().required("Title is required"),
  subtitle: Yup.string().required("Subtitle is required"),
  // delay: Yup.number()
  //   .required("Delay is required")
  //   .min(0, "Delay must be positive")
  //   .max(60, "Delay cannot exceed 60 seconds"),
  // enabled: Yup.boolean()
});

export function PopUpSheet({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const createConfig = useCreateSystemConfig();

  const initialValues = {
    title: "",
    subtitle: "",
    delay: 0,
    enabled: true,
  };

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="font-dmmono dark:bg-[#0F1621]">
        <SheetHeader>
          <SheetTitle className="text-xl font-normal tracking-wider mt-6">
            Admin Configuration
          </SheetTitle>
          <div className="border border-b-gray-200"></div>
        </SheetHeader>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={async (values, { setSubmitting }) => {
            try {
              await createConfig.mutateAsync({
                key: "popup",
                value: values,
                description: "Popup display configuration",
              });
              queryClient.invalidateQueries({
                queryKey: [BackendRoute.SYSTEM_CONFIG, "popup"],
              });
              toast.success("Popup configuration saved successfully");
              // Close the sheet after successful save
              const closeEvent = new Event("click");
              document
                .querySelector('[aria-label="Close"]')
                ?.dispatchEvent(closeEvent);
            } catch (error) {
              toast.error("Failed to save popup configuration");
              console.error(error);
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="grid gap-4 p-4">
                {/* title */}
                <div className="items-center gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="title" className="text-right text-base">
                      Pop-Up Title
                    </Label>
                    <Field
                      as={Input}
                      id="title"
                      name="title"
                      placeholder="Wanna Keep Playing"
                      className="col-span-3 shadow-none text-gray-400 font-thin font-worksans text-sm tracking-wider h-14 bg-[#F1F5F9] border border-[#CBD5E0]"
                    />
                    <ErrorMessage
                      name="title"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                </div>
                {/* subtitle */}
                <div className="items-center gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="subtitle" className="text-right text-base">
                      Pop-Up Subtitle
                    </Label>
                    <Field
                      as={Input}
                      id="subtitle"
                      name="subtitle"
                      placeholder="Sign up now"
                      className="col-span-3 shadow-none text-gray-400 font-thin font-worksans text-sm tracking-wider h-14 bg-[#F1F5F9] border border-[#CBD5E0]"
                    />
                    <ErrorMessage
                      name="subtitle"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                </div>
                {/* delays */}
                {/* <div className="items-center gap-4">
                  <div className="flex flex-col space-y-2">
                    <Label htmlFor="delay" className="text-right text-lg">
                      Pop-Up Delays (seconds)
                    </Label>
                    <Field
                      as={Input}
                      id="delay"
                      name="delay"
                      type="number"
                      placeholder="3"
                      className="col-span-3 shadow-none text-gray-400 font-thin font-worksans text-xl tracking-wider h-14 bg-[#F1F5F9] border border-[#CBD5E0]"
                    />
                    <ErrorMessage
                      name="delay"
                      component="div"
                      className="text-red-500 text-sm"
                    />
                  </div>
                </div> */}

                {/* button */}
                {/* <div className="flex items-center space-x-2">
                  <div>
                    <Field
                      type="checkbox"
                      id="enabled"
                      name="enabled"
                      className="w-4 h-4 rounded border border-gray-200 dark:border dark:border-[#D946EF]"
                    />
                  </div>
                  <Label htmlFor="enabled" className="text-right text-lg">
                    Enable Pop-Up Displays
                  </Label>
                </div> */}
              </div>
              <div className="flex gap-3 justify-end px-2">
                <SheetClose asChild>
                  <Button
                    type="button"
                    className="w-20 h-12 text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-"
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button
                  type="submit"
                  className="w-fit h-12 bg-[#D946EF] hover:bg-[#c026d3] dark:text-white  dark:hover:bg-[#c026d3]"
                  disabled={isSubmitting || createConfig.isPending}
                >
                  {isSubmitting || createConfig.isPending
                    ? "Saving..."
                    : "Save Configuration"}
                </Button>
              </div>
            </Form>
          )}
        </Formik>
      </SheetContent>
    </Sheet>
  );
}
