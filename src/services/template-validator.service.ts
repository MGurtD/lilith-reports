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

    if (!templatePath.endsWith("docx") && !templatePath.endsWith("odt")) {
      throw new Error(
        "Unsupported template format. This service only supports DOCX and ODT formats."
      );
    }
  }
}
