import React, { useEffect, useState } from "react";
import { useSystemConfigByKey } from "../../backend/configuration.service";
import TermsError from "../TermsErrorPage";

const TermsOfService: React.FC = () => {
  const { data, isLoading, error } = useSystemConfigByKey("terms");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [viewerError, setViewerError] = useState(false);

  useEffect(() => {
    // Check if we have the file data in the response
    if (data?.value?.file?.s3Key) {
      setFileUrl(data.value.file.s3Key);
    } else if (data?.data?.value?.file?.s3Key) {
      setFileUrl(data.data.value.file.s3Key);
    } else {
      setFileUrl(null);
    }
  }, [data]);

  // For Word documents, try Microsoft's Office Web Viewer with embed parameters
  const getViewableUrl = (url: string) => {
    if (url.endsWith(".doc") || url.endsWith(".docx")) {
      // Add parameters to hide toolbars and UI elements
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
        url
      )}&wdStartOn=1&wdEmbedCode=0`;
    }
    return url;
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Fixed Header */}
      <div className="flex-shrink-0 px-4 md:px-8 lg:px-16 py-6">
        <h1 className="text-4xl md:text-5xl font-bold text-[#6A7282] dark:text-white font-dmmono">
          Terms and Conditions
        </h1>
      </div>

      {/* Content Area */}
      <div className="flex-1 px-4 md:px-8 lg:px-16 pb-6 overflow-hidden">
        {isLoading && (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#6A7282]"></div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p>Failed to load terms and conditions: {error.toString()}</p>
          </div>
        )}

        {!isLoading && !error && (!data?.value?.file || !data?.value?.file?.s3Key) && (
          <div className="">
            <TermsError />
          </div>
        )}

        {!isLoading && !error && fileUrl && (
          <div className="bg-white rounded-lg h-full overflow-hidden">
            {!viewerError ? (
              <div className="relative h-full">
                {/* Simple download link - minimal and clean */}
                {/* <div className="absolute top-4 right-4 z-10">
                  <a 
                    href={fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-[#6A7282] text-white text-sm rounded-md hover:bg-[#5A626F] transition-colors shadow-md"
                  >
                    Download
                  </a>
                </div> */}

                <iframe
                  src={getViewableUrl(fileUrl)}
                  title="Terms and Conditions"
                  className="w-full h-full rounded-lg"
                  style={{ border: "none" }}
                  onError={() => setViewerError(true)}
                  allow="fullscreen"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            ) : (
              <div className="p-6 text-center h-full flex flex-col justify-center">
                <p className="text-amber-600 mb-4">
                  The document viewer couldn't load. Please use the download
                  button to view the terms and conditions.
                </p>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#6A7282] text-white rounded-md hover:bg-[#5A626F] transition-colors inline-block"
                >
                  Download Terms Document
                </a>
              </div>
            )}
          </div>
        )}

        {!isLoading && !error && !fileUrl && data && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center h-full flex items-center justify-center">
            <p className="text-gray-600 text-xl">
              No terms and conditions file has been uploaded yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TermsOfService;
