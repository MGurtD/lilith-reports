import fs from "fs";

/**
 * Service for validating template files.
 */
export class TemplateValidatorService {
  /**
   * Validates the template file existence and format.
   * @param templatePath - The path to the template file.
   * @throws Error if template is invalid.
   */
  static validate(templatePath: string): void {
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    const supportedExtensions = ["docx", "odt", "xls", "xlsx"];
    const hasValidExtension = supportedExtensions.some((ext) =>
      templatePath.endsWith(ext)
    );

    if (!hasValidExtension) {
      throw new Error(
        "Unsupported template format. This service only supports DOCX, ODT, XLS, and XLSX formats."
      );
    }
  }

  /**
   * Checks if the template is an Excel file.
   * @param templatePath - The path to the template file.
   * @returns True if the template is Excel format (.xls or .xlsx).
   */
  static isExcelTemplate(templatePath: string): boolean {
    return templatePath.endsWith(".xls") || templatePath.endsWith(".xlsx");
  }
}
