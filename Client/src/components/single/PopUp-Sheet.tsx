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
import { object as yupObject, string as yupString } from "yup";
import {
  useCreateSystemConfig,
  useSystemConfigByKey,
} from "../../backend/configuration.service";
import { BackendRoute } from "../../backend/constants";
import { useQueryClient } from "@tanstack/react-query";
import { decodeHtmlEntities } from "../../utils/main";

const validationSchema = yupObject({
  title: yupString().required("Title is required"),
  subtitle: yupString().required("Subtitle is required"),
  // delay: Yup.number()
  //   .required("Delay is required")
  //   .min(0, "Delay must be positive")
  //   .max(60, "Delay cannot exceed 60 seconds"),
  // enabled: Yup.boolean()
});

export function PopUpSheet({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const createConfig = useCreateSystemConfig();
  const { data: popupConfig } = useSystemConfigByKey("popup");

  // Pre-fill form with current values (including defaults that users actually see)
  const initialValues = {
    title: popupConfig?.value?.title
      ? decodeHtmlEntities(popupConfig.value.title)
      : "Time's Up!",
    subtitle: popupConfig?.value?.subtitle
      ? decodeHtmlEntities(popupConfig.value.subtitle)
      : "Sign up to keep playing this game and unlock unlimited access to all games!",
    delay: popupConfig?.value?.delay || 0,
    enabled: popupConfig?.value?.enabled || true,
  };

  const hasCustomPopup = !!popupConfig;

  return (
    <Sheet>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent className="font-dmmono dark:bg-[#0F1621] w-full sm:w-[400px] max-w-full">
        <SheetHeader className="px-2 sm:px-6 pt-16 pb-4">
          <SheetTitle className="text-lg sm:text-xl font-normal tracking-wider">
            Admin Configuration
          </SheetTitle>
          <div className="border border-b-gray-200"></div>
        </SheetHeader>
        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize={true}
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
              {/* Context message */}
              {!hasCustomPopup && (
                <div className="mx-2 sm:mx-4 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    📝 These are the current default values that users see.
                    Modify them to customize your popup.
                  </p>
                </div>
              )}

              <div className="grid gap-4 px-2 sm:px-4 py-4">
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
                      placeholder="Enter pop-up title"
                      className="col-span-3 shadow-none text-gray-900 dark:text-white font-bold font-worksans text-sm tracking-wider h-14 bg-[#F1F5F9] dark:bg-[#121C2D] border border-[#CBD5E0]"
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
                      placeholder="Enter pop-up subtitle"
                      className="col-span-3 shadow-none text-gray-900 dark:text-white font-bold font-worksans text-sm tracking-wider h-14 bg-[#F1F5F9] dark:bg-[#121C2D] border border-[#CBD5E0]"
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
                      className="w-4 h-4 rounded border border-gray-200 dark:border dark:border-[#6A7282]"
                    />
                  </div>
                  <Label htmlFor="enabled" className="text-right text-lg">
                    Enable Pop-Up Displays
                  </Label>
                </div> */}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-end px-2 sm:px-4 mt-4">
                <SheetClose asChild>
                  <Button
                    type="button"
                    className="w-full sm:w-20 h-12 cursor-pointer text-[#334154] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-gray-100"
                  >
                    Cancel
                  </Button>
                </SheetClose>
                <Button
                  type="submit"
                  className="w-full sm:w-fit h-12 cursor-pointer bg-[#6A7282] hover:bg-[#5A626F] dark:text-white dark:hover:bg-[#6A7282] px-4"
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
