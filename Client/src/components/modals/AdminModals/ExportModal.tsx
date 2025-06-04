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
import type { TDocumentDefinitions } from "pdfmake/interfaces";

// We'll load pdfMake dynamically to avoid font loading issues
let pdfMake: any;

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

      // const loadingToast = toast.loading("Exporting data as CSV...");

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
      
      // toast.dismiss(loadingToast);
      // toast.success("CSV file exported successfully");
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

      // const loadingToast = toast.loading("Exporting data as XLS...");

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

      // toast.dismiss(loadingToast);
      // toast.success("XLS file exported successfully");
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

      // const loadingToast = toast.loading("Exporting data as JSON...");

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

      // toast.dismiss(loadingToast);
      // toast.success("JSON file exported successfully");
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

      // const loadingToast = toast.loading("Generating PDF report...");

      // Dynamically import pdfMake and fonts
      if (!pdfMake) {
        pdfMake = (await import("pdfmake/build/pdfmake")).default;
        const pdfFonts = await import("pdfmake/build/vfs_fonts");
        pdfMake.vfs = (pdfFonts as any).vfs;
      }

      // Transform data for the table
      const tableBody = data.map(user => [
        { text: `${user.firstName || ""} ${user.lastName || ""}`, alignment: 'left', margin: [8, 4] },
        { text: user.email || "-", alignment: 'left', margin: [8, 4] },
        { text: user.phoneNumber || "-", alignment: 'left', margin: [8, 4] },
        { text: format(new Date(user.createdAt), "dd/MM/yy"), alignment: 'center', margin: [8, 4] },
        { text: user.analytics?.totalGamesPlayed || 0, alignment: 'center', margin: [8, 4] },
        { text: user.analytics?.totalTimePlayed ? Math.floor(user.analytics.totalTimePlayed / 60) + " minutes" : "0 minutes", alignment: 'center', margin: [8, 4] },
        { text: user.analytics?.totalSessionCount || 0, alignment: 'center', margin: [8, 4] },
        { text: user.lastLoggedIn ? format(new Date(user.lastLoggedIn), "dd/MM/yy HH:mm") : "Never logged in", alignment: 'center', margin: [8, 4] }
      ]);

      // Calculate summary statistics
      const totalUsers = data.length;
      const activeUsers = data.filter(user => user.isActive).length;
      const totalSessions = data.reduce((sum, user) => sum + (user.analytics?.totalSessionCount || 0), 0);
      const totalGamesPlayed = data.reduce((sum, user) => sum + (user.analytics?.totalGamesPlayed || 0), 0);
      const avgSessionsPerUser = totalUsers ? (totalSessions / totalUsers).toFixed(2) : 0;

      const docDefinition: TDocumentDefinitions = {
        pageSize: { width: 842, height: 595 },
        pageMargins: [40, 40, 40, 40],
        pageOrientation: 'landscape',
        content: [
          {
            text: 'User Management Statistics Report',
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 20] as [number, number, number, number]
          },
          {
            text: `Generated on ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}`,
            alignment: 'center',
            margin: [0, 0, 0, 20] as [number, number, number, number]
          },
          {
            text: 'Summary Statistics',
            style: 'subheader',
            margin: [0, 0, 0, 10] as [number, number, number, number]
          },
          {
            columns: [
              {
                width: 'auto',
                text: [
                  { text: 'Total Users: ', bold: true }, `${totalUsers}\n`,
                  { text: 'Active Users: ', bold: true }, `${activeUsers}\n`,
                  { text: 'Total Sessions: ', bold: true }, `${totalSessions}\n`,
                ]
              },
              {
                width: 'auto',
                text: [
                  { text: 'Total Games Played: ', bold: true }, `${totalGamesPlayed}\n`,
                  { text: 'Avg Sessions/User: ', bold: true }, `${avgSessionsPerUser}\n`,
                ]
              }
            ],
            margin: [0, 0, 0, 20] as [number, number, number, number]
          },
          {
            text: 'Detailed User Data',
            style: 'subheader',
            margin: [0, 0, 0, 10] as [number, number, number, number]
          },
          {
            table: {
              headerRows: 1,
              widths: [110, 140, 80, 80, 50, 70, 50, 120] as number[],
              body: [
                [
                  { text: 'Name', style: 'tableHeader', alignment: 'left', margin: [8, 4] },
                  { text: 'Email', style: 'tableHeader', alignment: 'left', margin: [8, 4] },
                  { text: 'Phone', style: 'tableHeader', alignment: 'left', margin: [8, 4] },
                  { text: 'Registration Date', style: 'tableHeader', alignment: 'center', margin: [8, 4] },
                  { text: 'Games Played', style: 'tableHeader', alignment: 'center', margin: [8, 4] },
                  { text: 'Time Played', style: 'tableHeader', alignment: 'center', margin: [8, 4] },
                  { text: 'Sessions', style: 'tableHeader', alignment: 'center', margin: [8, 4] },
                  { text: 'Last Login', style: 'tableHeader', alignment: 'center', margin: [8, 4] }
                ],
                ...tableBody
              ]
            }
          }
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            color: '#D946EF'
          },
          subheader: {
            fontSize: 14,
            bold: true,
            margin: [0, 10, 0, 5] as [number, number, number, number]
          },
          tableHeader: {
            bold: true,
            fillColor: '#F3F4F6',
            fontSize: 11
          }
        },
          defaultStyle: {
            fontSize: 10,
            lineHeight: 1.4
        }
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);
      
      // Get the PDF as a blob
      pdfDoc.getBlob((blob: any) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `user_management_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // toast.dismiss(loadingToast);
        // toast.success("PDF report generated successfully");
        setOpen(false);
      });
    } catch (error) {
      toast.error(`Failed to generate PDF report: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
