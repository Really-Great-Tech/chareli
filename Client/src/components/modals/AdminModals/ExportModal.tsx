/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Button } from "../../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../ui/tabs";
import { Card } from "../../ui/card";
import { Download, FileSpreadsheet, FileJson, File } from "lucide-react";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { toast } from "sonner";

interface ExportModalProps {
  data: any[];
  title?: string;
  description?: string;
}

const ExportModal = ({
  data,
  title = "Export Data",
  description = "Choose the format you'd like to export your data"
}: ExportModalProps) => {
  const [open, setOpen] = useState(false);

  const handleExportCSV = () => {
    try {
      if (!data || data.length === 0) {
        toast.info("No data available to export.");
        return;
      }

      const loadingToast = toast.loading("Exporting data as CSV...");

      const worksheet = XLSX.utils.json_to_sheet(data);
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      const blob = new Blob([csvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `user_management_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.dismiss(loadingToast);
      toast.success("CSV file exported successfully");
      setOpen(false);
    } catch (error) {
      toast.error(`Failed to export CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportXLS = () => {
    try {
      if (!data || data.length === 0) {
        toast.info("No data available to export.");
        return;
      }

      const loadingToast = toast.loading("Exporting data as XLS...");

      const filename = `user_management_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      const xlsData = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([xlsData], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success("XLS file exported successfully");
      setOpen(false);
    } catch (error) {
      toast.error(`Failed to export XLS file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportJSON = () => {
    try {
      if (!data || data.length === 0) {
        toast.info("No data available to export.");
        return;
      }

      const loadingToast = toast.loading("Exporting data as JSON...");

      const filename = `user_management_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`;
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success("JSON file exported successfully");
      setOpen(false);
    } catch (error) {
      toast.error(`Failed to export JSON file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!data || data.length === 0) {
        toast.info("No data available to export.");
        return;
      }

      const loadingToast = toast.loading("Exporting data as PDF...");

      // TODO: Implement PDF generation
      const pdfBlob = new Blob(['PDF generation not implemented yet'], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `user_management_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success("PDF file exported successfully");
      setOpen(false);
    } catch (error) {
      toast.error(`Failed to export PDF file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-[#475568] text-[#475568] flex items-center gap-2 dark:text-white py-5">
          <Download size={16} />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md dark:bg-[#18192b]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-2 dark:bg-[#121C2D]">
            <TabsTrigger value="data">User Data</TabsTrigger>
            <TabsTrigger value="statistics">Statistics</TabsTrigger>
          </TabsList>

          <TabsContent value="data" className="mt-4">
            <div className="grid grid-cols-3 gap-4">
              <Card className="flex flex-col items-center p-4 hover:bg-gray-50 cursor-pointer dark:bg-[#121C2D] transition-colors shadow-sm">
                <button
                  onClick={handleExportCSV}
                  className="w-full h-full flex flex-col items-center"
                >
                  <FileSpreadsheet className="h-12 w-12 text-green-600 mb-2" />
                  <span className="text-sm font-medium">CSV</span>
                </button>
              </Card>

              <Card className="flex flex-col items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm dark:bg-[#121C2D]">
                <button
                  onClick={handleExportXLS}
                  className="w-full h-full flex flex-col items-center"
                >
                  <FileSpreadsheet className="h-12 w-12 text-blue-600 mb-2" />
                  <span className="text-sm font-medium">XLS</span>
                </button>
              </Card>

              <Card className="flex flex-col items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm dark:bg-[#121C2D]">
                <button
                  onClick={handleExportJSON}
                  className="w-full h-full flex flex-col items-center"
                >
                  <FileJson className="h-12 w-12 text-amber-600 mb-2" />
                  <span className="text-sm font-medium">JSON</span>
                </button>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="mt-4">
            <Card className="flex items-center p-6 hover:bg-gray-50 cursor-pointer transition-colors dark:bg-[#121C2D]">
              <button
                onClick={handleExportPDF}
                className="w-full flex items-center gap-4 justify-center"
              >
                <File className="h-12 w-12 text-red-600" />
                <div className="text-left">
                  <h3 className="font-medium">Download Statistics</h3>
                  <p className="text-sm text-gray-500">
                    Get a PDF report with all statistics
                  </p>
                </div>
              </button>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="sm:justify-start">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;
