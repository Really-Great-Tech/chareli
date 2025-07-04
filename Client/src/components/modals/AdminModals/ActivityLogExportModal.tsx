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
import type { ActivityLogFilterState } from "../../../backend/analytics.service";

// We'll load pdfMake dynamically to avoid font loading issues
let pdfMake: any;

interface ActivityLogData {
  name?: string;
  userStatus?: string;
  activity?: string;
  lastGamePlayed?: string;
  startTime?: Date;
  endTime?: Date;
  // Allow for any additional properties from the API
  [key: string]: any;
}

interface ActivityLogExportModalProps {
  data: ActivityLogData[];
  filters?: ActivityLogFilterState;
  title?: string;
  description?: string;
}

const ActivityLogExportModal = ({
  data,
  filters,
  title = "Export Activity Log",
  description = "Choose the format you'd like to export your activity log data"
}: ActivityLogExportModalProps) => {
  const [open, setOpen] = useState(false);

  const generateFilterSummary = () => {
    if (!filters) return [];
    
    const summary = [];
    
    // User Status
    if (filters.userStatus) {
      summary.push(`User Status: ${filters.userStatus}`);
    }
    
    // User Name
    if (filters.userName) {
      summary.push(`User Name: Contains "${filters.userName}"`);
    }
    
    // Game Title
    if (filters.gameTitle && filters.gameTitle.length > 0) {
      summary.push(`Game Title: ${filters.gameTitle.join(", ")}`);
    }
    
    // Activity Type
    if (filters.activityType) {
      summary.push(`Activity Type: Contains "${filters.activityType}"`);
    }
    
    // Sort By
    if (filters.sortBy) {
      const sortByLabel = filters.sortBy === "createdAt" ? "Registration Date" : 
                         filters.sortBy === "name" ? "Name" : 
                         filters.sortBy === "email" ? "Email" : filters.sortBy;
      const sortOrderLabel = filters.sortOrder === "desc" ? "Newest First" : "Oldest First";
      summary.push(`Sort By: ${sortByLabel} (${sortOrderLabel})`);
    }
    
    return summary;
  };

  const formatActivityDataForExport = (activities: ActivityLogData[]) => {
    return activities.map(activity => ({
      Name: activity.name?.trim() || "-",
      "User Status": activity.userStatus || "Offline",
      Activity: activity.activity || "-",
      "Last Game Played": activity.lastGamePlayed || "-",
      "Start Time": activity.startTime ? format(new Date(activity.startTime), "HH:mm") : "-",
      "End Time": activity.endTime ? format(new Date(activity.endTime), "HH:mm") : "-",
      "Start Date": activity.startTime ? format(new Date(activity.startTime), "yyyy-MM-dd") : "-",
      "End Date": activity.endTime ? format(new Date(activity.endTime), "yyyy-MM-dd") : "-"
    }));
  };

  const handleExportCSV = () => {
    try {
      if (!data || data.length === 0) {
        toast.info("No activity log data available to export.");
        return;
      }

      // const loadingToast = toast.loading("Exporting activity log as CSV...");

      const formattedData = formatActivityDataForExport(data);
      const filterSummary = generateFilterSummary();
      
      // Create header with filter information
      let csvHeader = `# Activity Log Export Report\n`;
      csvHeader += `# Generated: ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}\n`;
      csvHeader += `#\n`;
      
      if (filterSummary.length > 0) {
        csvHeader += `# Applied Filters:\n`;
        filterSummary.forEach(filter => {
          csvHeader += `# - ${filter}\n`;
        });
      } else {
        csvHeader += `# Applied Filters: None (All data)\n`;
      }
      
      csvHeader += `#\n`;
      csvHeader += `# Total Records: ${data.length}\n`;
      csvHeader += `#\n`;

      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      const finalCsvData = csvHeader + csvData;
      
      const blob = new Blob([finalCsvData], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `user_activity_log_${format(new Date(), "yyyy-MM-dd_HH-mm")}.csv`;

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
        toast.info("No activity log data available to export.");
        return;
      }

      // const loadingToast = toast.loading("Exporting activity log as XLS...");

      const filename = `user_activity_log_${format(new Date(), "yyyy-MM-dd_HH-mm")}.xlsx`;
      const formattedData = formatActivityDataForExport(data);
      const filterSummary = generateFilterSummary();
      const workbook = XLSX.utils.book_new();

      // Create Filter Summary sheet
      const filterData = [
        { Field: "Export Type", Value: "Activity Log" },
        { Field: "Generated", Value: format(new Date(), "MMMM dd, yyyy 'at' HH:mm") },
        { Field: "Total Records", Value: data.length },
        { Field: "", Value: "" }, // Empty row
      ];

      if (filterSummary.length > 0) {
        filterData.push({ Field: "Applied Filters", Value: "" });
        filterSummary.forEach(filter => {
          const [key, value] = filter.split(": ");
          filterData.push({ Field: key, Value: value });
        });
      } else {
        filterData.push({ Field: "Applied Filters", Value: "None (All data)" });
      }

      const filterSheet = XLSX.utils.json_to_sheet(filterData);
      XLSX.utils.book_append_sheet(workbook, filterSheet, "Filter Summary");

      // Create Data sheet
      const dataSheet = XLSX.utils.json_to_sheet(formattedData);
      XLSX.utils.book_append_sheet(workbook, dataSheet, "Activity Log");

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
        toast.info("No activity log data available to export.");
        return;
      }

      // const loadingToast = toast.loading("Exporting activity log as JSON...");

      const filename = `user_activity_log_${format(new Date(), "yyyy-MM-dd_HH-mm")}.json`;
      const formattedData = formatActivityDataForExport(data);
      const filterSummary = generateFilterSummary();

      // Create structured JSON with metadata
      const exportData = {
        exportMetadata: {
          exportType: "Activity Log",
          generatedAt: new Date().toISOString(),
          generatedBy: "Activity Log Export System",
          totalRecords: data.length,
          appliedFilters: filters ? {
            userStatus: filters.userStatus || null,
            userName: filters.userName || null,
            gameTitle: filters.gameTitle && filters.gameTitle.length > 0 ? filters.gameTitle : null,
            activityType: filters.activityType || null,
            sortBy: filters.sortBy || null,
            sortOrder: filters.sortOrder || null
          } : null,
          filterSummary: filterSummary.length > 0 ? filterSummary : ["None (All data)"]
        },
        data: formattedData
      };

      const jsonString = JSON.stringify(exportData, null, 2);
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
        toast.info("No activity log data available to export.");
        return;
      }

      // const loadingToast = toast.loading("Generating activity log PDF report...");

      // Dynamically import pdfMake and fonts
      if (!pdfMake) {
        pdfMake = (await import("pdfmake/build/pdfmake")).default;
        const pdfFonts = await import("pdfmake/build/vfs_fonts");
        pdfMake.vfs = (pdfFonts as any).vfs;
      }

      // Transform data for the table
      const tableBody = data.map(activity => [
        { text: activity.name?.trim() || "-", alignment: 'left', margin: [8, 4] },
        { 
          text: activity.userStatus || "Offline", 
          alignment: 'center', 
          margin: [8, 4],
          color: activity.userStatus === "Online" ? '#4BA366' : '#E74C3C'
        },
        { text: activity.activity || "-", alignment: 'left', margin: [8, 4] },
        { text: activity.lastGamePlayed || "-", alignment: 'left', margin: [8, 4] },
        { 
          text: activity.startTime ? format(new Date(activity.startTime), "HH:mm") : "-", 
          alignment: 'center', 
          margin: [8, 4] 
        },
        { 
          text: activity.endTime ? format(new Date(activity.endTime), "HH:mm") : "-", 
          alignment: 'center', 
          margin: [8, 4] 
        }
      ]);

      // Calculate summary statistics
      const totalActivities = data.length;
      const onlineUsers = data.filter(activity => activity.userStatus === "Online").length;
      const offlineUsers = totalActivities - onlineUsers;
      const activitiesWithGames = data.filter(activity => activity.lastGamePlayed && activity.lastGamePlayed !== "-").length;
      const activitiesWithStartTime = data.filter(activity => activity.startTime).length;
      const activitiesWithEndTime = data.filter(activity => activity.endTime).length;

      const filterSummary = generateFilterSummary();

      const docDefinition: TDocumentDefinitions = {
        pageSize: { width: 842, height: 595 },
        pageMargins: [40, 40, 40, 40],
        pageOrientation: 'landscape',
        content: [
          {
            text: 'User Activity Log Report',
            style: 'header',
            alignment: 'center',
            margin: [0, 0, 0, 20] as [number, number, number, number]
          },
          {
            text: `Generated on ${format(new Date(), "MMMM dd, yyyy 'at' HH:mm")}`,
            alignment: 'center',
            margin: [0, 0, 0, 20] as [number, number, number, number]
          },
          // Applied Filters Section
          ...(filterSummary.length > 0 ? [
            {
              text: 'Applied Filters',
              style: 'subheader',
              margin: [0, 0, 0, 10] as [number, number, number, number]
            },
            {
              ul: filterSummary,
              margin: [0, 0, 0, 20] as [number, number, number, number]
            }
          ] : [
            {
              text: 'Applied Filters: None (All data)',
              style: 'subheader',
              margin: [0, 0, 0, 20] as [number, number, number, number]
            }
          ]),
          {
            text: 'Activity Summary',
            style: 'subheader',
            margin: [0, 0, 0, 10] as [number, number, number, number]
          },
          {
            columns: [
              {
                width: 'auto',
                text: [
                  { text: 'Total Activities: ', bold: true }, `${totalActivities}\n`,
                  { text: 'Online Users: ', bold: true }, `${onlineUsers}\n`,
                  { text: 'Offline Users: ', bold: true }, `${offlineUsers}\n`,
                ]
              },
              {
                width: 'auto',
                text: [
                  { text: 'Activities with Games: ', bold: true }, `${activitiesWithGames}\n`,
                  { text: 'Activities with Start Time: ', bold: true }, `${activitiesWithStartTime}\n`,
                  { text: 'Activities with End Time: ', bold: true }, `${activitiesWithEndTime}\n`,
                ]
              }
            ],
            margin: [0, 0, 0, 20] as [number, number, number, number]
          },
          {
            text: 'Detailed Activity Log',
            style: 'subheader',
            margin: [0, 0, 0, 10] as [number, number, number, number]
          },
          {
            table: {
              headerRows: 1,
              widths: [120, 80, 150, 150, 80, 80] as number[],
              body: [
                [
                  { text: 'Name', style: 'tableHeader', alignment: 'left', margin: [8, 4] },
                  { text: 'Status', style: 'tableHeader', alignment: 'center', margin: [8, 4] },
                  { text: 'Activity', style: 'tableHeader', alignment: 'left', margin: [8, 4] },
                  { text: 'Last Game Played', style: 'tableHeader', alignment: 'left', margin: [8, 4] },
                  { text: 'Start Time', style: 'tableHeader', alignment: 'center', margin: [8, 4] },
                  { text: 'End Time', style: 'tableHeader', alignment: 'center', margin: [8, 4] }
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
        link.download = `user_activity_log_${format(new Date(), "yyyy-MM-dd_HH-mm")}.pdf`;
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
        <Button className="bg-[#D946EF] text-white hover:bg-[#c026d3] tracking-wider py-2 cursor-pointer">
          <Download size={16} className="mr-2" />
          Export
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md dark:bg-[#18192b]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="data" className="w-full">
          <TabsList className="grid w-full grid-cols-2 dark:bg-[#121C2D]">
            <TabsTrigger value="data">Activity Data</TabsTrigger>
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
                className="w-full flex items-center gap-4 justify-center cursor-pointer"
              >
                <File className="h-12 w-12 text-red-600" />
                <div className="text-left">
                  <h3 className="font-medium">Download Activity Report</h3>
                  <p className="text-sm text-gray-500">
                    Get a PDF report with activity statistics
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

export default ActivityLogExportModal;
