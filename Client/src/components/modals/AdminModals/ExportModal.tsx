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
import type { FilterState } from "../../../backend/analytics.service";

// We'll load pdfMake dynamically to avoid font loading issues
let pdfMake: any;

interface ExportModalProps {
  data: any[];
  filters?: FilterState;
  title?: string;
  description?: string;
}

const ExportModal = ({
  data,
  filters,
  title = "Export Data",
  description = "Choose the format you'd like to export your data",
}: ExportModalProps) => {
  const [open, setOpen] = useState(false);

  // Transform raw data to consistent export format
  const transformDataForExport = (rawData: any[]) => {
    return rawData.map((user) => ({
      Name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
      Email: user.email || "-",
      Phone: user.phoneNumber || "-",
      Country: user.country || "-",
      "IP Address": user.registrationIpAddress || "-",
      "Device Type": user.lastKnownDeviceType || "-",
      "Registration Date": user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "-",
      "Games Played": user.analytics?.totalGamesPlayed || 0,
      "Time Played (minutes)": user.analytics?.totalTimePlayed 
        ? Math.floor(user.analytics.totalTimePlayed / 60) 
        : 0,
      Sessions: user.analytics?.totalSessionCount || 0,
      "Last Login": user.lastLoggedIn 
        ? format(new Date(user.lastLoggedIn), "dd/MM/yyyy HH:mm")
        : "Never logged in",
    }));
  };

  const generateFilterSummary = () => {
    if (!filters) return [];

    const summary = [];

    // Registration Date Range
    if (
      filters.registrationDates.startDate ||
      filters.registrationDates.endDate
    ) {
      const startDate = filters.registrationDates.startDate
        ? format(new Date(filters.registrationDates.startDate), "MMM dd, yyyy")
        : "Beginning";
      const endDate = filters.registrationDates.endDate
        ? format(new Date(filters.registrationDates.endDate), "MMM dd, yyyy")
        : "Present";
      summary.push(`Registration Date: ${startDate} to ${endDate}`);
    }

    // Last Login Date Range
    if (filters.lastLoginDates.startDate || filters.lastLoginDates.endDate) {
      const startDate = filters.lastLoginDates.startDate
        ? format(new Date(filters.lastLoginDates.startDate), "MMM dd, yyyy")
        : "Beginning";
      const endDate = filters.lastLoginDates.endDate
        ? format(new Date(filters.lastLoginDates.endDate), "MMM dd, yyyy")
        : "Present";
      summary.push(`Last Login Date: ${startDate} to ${endDate}`);
    }

    // Session Count
    if (filters.sessionCount) {
      summary.push(`Session Count: Minimum ${filters.sessionCount} sessions`);
    }

    // Time Played
    if (filters.timePlayed.min > 0 || filters.timePlayed.max > 0) {
      const min =
        filters.timePlayed.min > 0
          ? `${filters.timePlayed.min} minutes`
          : "0 minutes";
      const max =
        filters.timePlayed.max > 0
          ? `${filters.timePlayed.max} minutes`
          : "unlimited";
      summary.push(`Time Played: ${min} to ${max}`);
    }

    // Game Title
    if (filters.gameTitle && filters.gameTitle.length > 0) {
      summary.push(`Game Title: ${filters.gameTitle.join(", ")}`);
    }

    // Game Category
    if (filters.gameCategory && filters.gameCategory.length > 0) {
      summary.push(`Game Category: ${filters.gameCategory.join(", ")}`);
    }

    // Country
    if (filters.country && filters.country.length > 0) {
      summary.push(`Country: ${filters.country.join(", ")}`);
    }

    // Age Group
    if (filters.ageGroup) {
      const ageGroupLabel =
        filters.ageGroup === "adults"
          ? "Adults (18+)"
          : filters.ageGroup === "minors"
          ? "Minors (Under 18)"
          : filters.ageGroup;
      summary.push(`Age Group: ${ageGroupLabel}`);
    }

    // Sort By
    if (filters.sortBy) {
      const sortByLabel =
        filters.sortBy === "createdAt"
          ? "Registration Date"
          : filters.sortBy === "firstName"
          ? "First Name"
          : filters.sortBy === "lastName"
          ? "Last Name"
          : filters.sortBy === "email"
          ? "Email"
          : filters.sortBy === "lastLoggedIn"
          ? "Last Login"
          : filters.sortBy === "lastSeen"
          ? "Last Seen"
          : filters.sortBy === "country"
          ? "Country"
          : filters.sortBy === "timePlayed"
          ? "Time Played"
          : filters.sortBy === "sessionCount"
          ? "Session Count"
          : filters.sortBy;
      const sortOrderLabel =
        filters.sortOrder === "desc" ? "Newest First" : "Oldest First";
      summary.push(`Sort By: ${sortByLabel} (${sortOrderLabel})`);
    }

    return summary;
  };

  const handleExportCSV = () => {
    try {
      if (!data || data.length === 0) {
        toast.info("No data available to export.");
        return;
      }

      const loadingToast = toast.loading("Exporting data as CSV...");

      const filterSummary = generateFilterSummary();

      // Calculate summary statistics
      const totalUsers = data.length;
      const activeUsers = data.filter((user) => user.isActive).length;
      const totalSessions = data.reduce(
        (sum, user) => sum + (user.analytics?.totalSessionCount || 0),
        0
      );
      const totalGamesPlayed = data.reduce(
        (sum, user) => sum + (user.analytics?.totalGamesPlayed || 0),
        0
      );
      const avgSessionsPerUser = totalUsers
        ? (totalSessions / totalUsers).toFixed(2)
        : 0;

      // Create header with filter information
      let csvHeader = `# User Management Export Report\n`;
      csvHeader += `# Generated: ${format(
        new Date(),
        "MMMM dd, yyyy 'at' HH:mm"
      )}\n`;
      csvHeader += `#\n`;

      // Summary Statistics Section
      csvHeader += `# Summary Statistics:\n`;
      csvHeader += `# - Total Users: ${totalUsers}\n`;
      csvHeader += `# - Active Users: ${activeUsers}\n`;
      csvHeader += `# - Total Sessions: ${totalSessions}\n`;
      csvHeader += `# - Total Games Played: ${totalGamesPlayed}\n`;
      csvHeader += `# - Average Sessions per User: ${avgSessionsPerUser}\n`;
      csvHeader += `#\n`;

      if (filterSummary.length > 0) {
        csvHeader += `# Applied Filters:\n`;
        filterSummary.forEach((filter) => {
          csvHeader += `# - ${filter}\n`;
        });
      } else {
        csvHeader += `# Applied Filters: None (All data)\n`;
      }

      csvHeader += `#\n`;
      csvHeader += `# Total Records: ${data.length}\n`;
      csvHeader += `#\n`;

      // Transform data to consistent format
      const transformedData = transformDataForExport(data);
      const worksheet = XLSX.utils.json_to_sheet(transformedData);
      const csvData = XLSX.utils.sheet_to_csv(worksheet);
      const finalCsvData = csvHeader + csvData;

      const blob = new Blob([finalCsvData], {
        type: "text/csv;charset=utf-8;",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `user_management_${format(
        new Date(),
        "yyyy-MM-dd_HH-mm"
      )}.csv`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.dismiss(loadingToast);
      toast.success("CSV file exported successfully");
      setOpen(false);
    } catch (error) {
      toast.error(
        `Failed to export CSV file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleExportXLS = () => {
    try {
      if (!data || data.length === 0) {
        toast.info("No data available to export.");
        return;
      }

      const loadingToast = toast.loading("Exporting data as XLS...");

      const filename = `user_management_${format(
        new Date(),
        "yyyy-MM-dd_HH-mm"
      )}.xlsx`;
      const filterSummary = generateFilterSummary();
      const workbook = XLSX.utils.book_new();

      // Calculate summary statistics
      const totalUsers = data.length;
      const activeUsers = data.filter((user) => user.isActive).length;
      const totalSessions = data.reduce(
        (sum, user) => sum + (user.analytics?.totalSessionCount || 0),
        0
      );
      const totalGamesPlayed = data.reduce(
        (sum, user) => sum + (user.analytics?.totalGamesPlayed || 0),
        0
      );
      const avgSessionsPerUser = totalUsers
        ? (totalSessions / totalUsers).toFixed(2)
        : 0;

      // Create Summary Statistics sheet
      const filterData = [
        { Field: "Export Type", Value: "User Management" },
        {
          Field: "Generated",
          Value: format(new Date(), "MMMM dd, yyyy 'at' HH:mm"),
        },
        { Field: "", Value: "" }, // Empty row
        { Field: "Summary Statistics", Value: "" },
        { Field: "Total Users", Value: totalUsers },
        { Field: "Active Users", Value: activeUsers },
        { Field: "Total Sessions", Value: totalSessions },
        { Field: "Total Games Played", Value: totalGamesPlayed },
        { Field: "Average Sessions per User", Value: avgSessionsPerUser },
        { Field: "Total Records", Value: data.length },
        { Field: "", Value: "" }, // Empty row
      ];

      if (filterSummary.length > 0) {
        filterData.push({ Field: "Applied Filters", Value: "" });
        filterSummary.forEach((filter) => {
          const [key, value] = filter.split(": ");
          filterData.push({ Field: key, Value: value });
        });
      } else {
        filterData.push({ Field: "Applied Filters", Value: "None (All data)" });
      }

      const filterSheet = XLSX.utils.json_to_sheet(filterData);
      XLSX.utils.book_append_sheet(workbook, filterSheet, "Filter Summary");

      // Create Data sheet with transformed data
      const transformedData = transformDataForExport(data);
      const dataSheet = XLSX.utils.json_to_sheet(transformedData);
      XLSX.utils.book_append_sheet(workbook, dataSheet, "User Data");

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
      toast.error(
        `Failed to export XLS file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleExportJSON = () => {
    try {
      if (!data || data.length === 0) {
        toast.info("No data available to export.");
        return;
      }

      const loadingToast = toast.loading("Exporting data as JSON...");

      const filename = `user_management_${format(
        new Date(),
        "yyyy-MM-dd_HH-mm"
      )}.json`;
      const filterSummary = generateFilterSummary();

      // Transform data to consistent format
      const transformedData = transformDataForExport(data);

      // Create structured JSON with metadata
      const exportData = {
        exportMetadata: {
          exportType: "User Management",
          generatedAt: new Date().toISOString(),
          generatedBy: "User Management Export System",
          totalRecords: data.length,
          appliedFilters: filters
            ? {
                registrationDateRange: {
                  startDate: filters.registrationDates.startDate || null,
                  endDate: filters.registrationDates.endDate || null,
                },
                lastLoginDateRange: {
                  startDate: filters.lastLoginDates.startDate || null,
                  endDate: filters.lastLoginDates.endDate || null,
                },
                sessionCount: filters.sessionCount || null,
                timePlayed: {
                  min: filters.timePlayed.min || null,
                  max: filters.timePlayed.max || null,
                },
                gameTitle:
                  filters.gameTitle && filters.gameTitle.length > 0
                    ? filters.gameTitle
                    : null,
                gameCategory:
                  filters.gameCategory && filters.gameCategory.length > 0
                    ? filters.gameCategory
                    : null,
                country:
                  filters.country && filters.country.length > 0
                    ? filters.country
                    : null,
                ageGroup: filters.ageGroup || null,
                sortBy: filters.sortBy || null,
                sortOrder: filters.sortOrder || null,
              }
            : null,
          filterSummary:
            filterSummary.length > 0 ? filterSummary : ["None (All data)"],
        },
        data: transformedData,
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

      toast.dismiss(loadingToast);
      toast.success("JSON file exported successfully");
      setOpen(false);
    } catch (error) {
      toast.error(
        `Failed to export JSON file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  const handleExportPDF = async () => {
    try {
      if (!data || data.length === 0) {
        toast.info("No data available to export.");
        return;
      }

      const loadingToast = toast.loading("Generating PDF report...");

      // Dynamically import pdfMake and fonts
      if (!pdfMake) {
        pdfMake = (await import("pdfmake/build/pdfmake")).default;
        const pdfFonts = await import("pdfmake/build/vfs_fonts");
        pdfMake.vfs = (pdfFonts as any).vfs;
      }

      // Transform data for the table
      const tableBody = data.map((user) => [
        {
          text: `${user.firstName || ""} ${user.lastName || ""}`,
          alignment: "left",
          margin: [4, 2],
        },
        { text: user.email || "-", alignment: "left", margin: [4, 2] },
        { text: user.phoneNumber || "-", alignment: "left", margin: [4, 2] },
        { text: user.country || "-", alignment: "left", margin: [4, 2] },
        { text: user.registrationIpAddress || "-", alignment: "left", margin: [4, 2] },
        { text: user.lastKnownDeviceType || "-", alignment: "left", margin: [4, 2] },
        {
          text: format(new Date(user.createdAt), "dd/MM/yy"),
          alignment: "center",
          margin: [4, 2],
        },
        {
          text: user.analytics?.totalGamesPlayed || 0,
          alignment: "center",
          margin: [4, 2],
        },
        {
          text: user.analytics?.totalTimePlayed
            ? Math.floor(user.analytics.totalTimePlayed / 60) + "m"
            : "0m",
          alignment: "center",
          margin: [4, 2],
        },
        {
          text: user.analytics?.totalSessionCount || 0,
          alignment: "center",
          margin: [4, 2],
        },
        {
          text: user.lastLoggedIn
            ? format(new Date(user.lastLoggedIn), "dd/MM/yy")
            : "Never",
          alignment: "center",
          margin: [4, 2],
        },
      ]);

      // Calculate summary statistics
      const totalUsers = data.length;
      const activeUsers = data.filter((user) => user.isActive).length;
      const totalSessions = data.reduce(
        (sum, user) => sum + (user.analytics?.totalSessionCount || 0),
        0
      );
      const totalGamesPlayed = data.reduce(
        (sum, user) => sum + (user.analytics?.totalGamesPlayed || 0),
        0
      );
      const avgSessionsPerUser = totalUsers
        ? (totalSessions / totalUsers).toFixed(2)
        : 0;

      const filterSummary = generateFilterSummary();

      const docDefinition: TDocumentDefinitions = {
        pageSize: { width: 842, height: 595 },
        pageMargins: [40, 40, 40, 40],
        pageOrientation: "landscape",
        content: [
          {
            text: "User Management Statistics Report",
            style: "header",
            alignment: "center",
            margin: [0, 0, 0, 20] as [number, number, number, number],
          },
          {
            text: `Generated on ${format(
              new Date(),
              "MMMM dd, yyyy 'at' HH:mm"
            )}`,
            alignment: "center",
            margin: [0, 0, 0, 20] as [number, number, number, number],
          },
          // Applied Filters Section
          ...(filterSummary.length > 0
            ? [
                {
                  text: "Applied Filters",
                  style: "subheader",
                  margin: [0, 0, 0, 10] as [number, number, number, number],
                },
                {
                  ul: filterSummary,
                  margin: [0, 0, 0, 20] as [number, number, number, number],
                },
              ]
            : [
                {
                  text: "Applied Filters: None (All data)",
                  style: "subheader",
                  margin: [0, 0, 0, 20] as [number, number, number, number],
                },
              ]),
          {
            text: "Summary Statistics",
            style: "subheader",
            margin: [0, 0, 0, 10] as [number, number, number, number],
          },
          {
            columns: [
              {
                width: "auto",
                text: [
                  { text: "Total Users: ", bold: true },
                  `${totalUsers}\n`,
                  { text: "Active Users: ", bold: true },
                  `${activeUsers}\n`,
                  { text: "Total Sessions: ", bold: true },
                  `${totalSessions}\n`,
                ],
              },
              {
                width: "auto",
                text: [
                  { text: "Total Games Played: ", bold: true },
                  `${totalGamesPlayed}\n`,
                  { text: "Avg Sessions/User: ", bold: true },
                  `${avgSessionsPerUser}\n`,
                ],
              },
            ],
            margin: [0, 0, 0, 20] as [number, number, number, number],
          },
          {
            text: "Detailed User Data",
            style: "subheader",
            margin: [0, 0, 0, 10] as [number, number, number, number],
          },
          {
            table: {
              headerRows: 1,
              widths: [60, 100, 55, 40, 75, 50, 50, 30, 40, 30, 65] as number[],
              body: [
                [
                  {
                    text: "Name",
                    style: "tableHeader",
                    alignment: "left",
                    margin: [4, 2],
                  },
                  {
                    text: "Email",
                    style: "tableHeader",
                    alignment: "left",
                    margin: [4, 2],
                  },
                  {
                    text: "Phone",
                    style: "tableHeader",
                    alignment: "left",
                    margin: [4, 2],
                  },
                  {
                    text: "Country",
                    style: "tableHeader",
                    alignment: "left",
                    margin: [4, 2],
                  },
                  {
                    text: "IP Address",
                    style: "tableHeader",
                    alignment: "left",
                    margin: [4, 2],
                  },
                  {
                    text: "Device Type",
                    style: "tableHeader",
                    alignment: "left",
                    margin: [4, 2],
                  },
                  {
                    text: "Reg. Date",
                    style: "tableHeader",
                    alignment: "center",
                    margin: [4, 2],
                  },
                  {
                    text: "Games",
                    style: "tableHeader",
                    alignment: "center",
                    margin: [4, 2],
                  },
                  {
                    text: "Time",
                    style: "tableHeader",
                    alignment: "center",
                    margin: [4, 2],
                  },
                  {
                    text: "Sessions",
                    style: "tableHeader",
                    alignment: "center",
                    margin: [4, 2],
                  },
                  {
                    text: "Last Login",
                    style: "tableHeader",
                    alignment: "center",
                    margin: [4, 2],
                  },
                ],
                ...tableBody,
              ],
            },
          },
        ],
        styles: {
          header: {
            fontSize: 18,
            bold: true,
            color: "#DC8B18",
          },
          subheader: {
            fontSize: 14,
            bold: true,
            margin: [0, 10, 0, 5] as [number, number, number, number],
          },
          tableHeader: {
            bold: true,
            fillColor: "#F3F4F6",
            fontSize: 11,
          },
        },
        defaultStyle: {
          fontSize: 10,
          lineHeight: 1.4,
        },
      };

      const pdfDoc = pdfMake.createPdf(docDefinition);

      // Get the PDF as a blob
      pdfDoc.getBlob((blob: any) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `user_management_${format(
          new Date(),
          "yyyy-MM-dd_HH-mm"
        )}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast.dismiss(loadingToast);
        toast.success("PDF report generated successfully");
        setOpen(false);
      });
    } catch (error) {
      toast.error(
        `Failed to generate PDF report: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2 bg-[#DC8B18] text-white hover:bg-[#C17600] cursor-pointer">
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
                  className="w-full h-full flex flex-col items-center cursor-pointer"
                >
                  <FileSpreadsheet className="h-12 w-12 text-green-600 mb-2" />
                  <span className="text-sm font-medium">CSV</span>
                </button>
              </Card>

              <Card className="flex flex-col items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm dark:bg-[#121C2D]">
                <button
                  onClick={handleExportXLS}
                  className="w-full h-full flex flex-col items-center cursor-pointer"
                >
                  <FileSpreadsheet className="h-12 w-12 text-blue-600 mb-2" />
                  <span className="text-sm font-medium">XLS</span>
                </button>
              </Card>

              <Card className="flex flex-col items-center p-4 hover:bg-gray-50 cursor-pointer transition-colors shadow-sm dark:bg-[#121C2D]">
                <button
                  onClick={handleExportJSON}
                  className="w-full h-full flex flex-col items-center cursor-pointer"
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
