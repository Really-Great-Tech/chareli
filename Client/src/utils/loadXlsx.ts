type XlsxModule = typeof import("xlsx");

let cachedXlsx: XlsxModule | null = null;

/**
 * Dynamically loads the XLSX library so that it only ends up in the bundle
 * when export actions are triggered.
 */
export const loadXlsx = async (): Promise<XlsxModule> => {
  if (!cachedXlsx) {
    cachedXlsx = await import("xlsx");
  }

  return cachedXlsx;
};
