import fs from "fs";
import carbone from "carbone";

/**
 * Service for generating Excel files using the Carbone template engine.
 * Supports both .xls and .xlsx formats.
 */
export class ExcelGeneratorService {
  /**
   * Generates an Excel file from a template and data.
   * Carbone automatically detects the output format based on the template extension.
   * @param templatePath - The path to the template file (.xls or .xlsx).
   * @param data - The data to populate the template.
   * @param outputPath - The path to save the generated Excel file.
   */
  static generate(
    templatePath: string,
    data: any,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const options = {
        lang: "es-es",
        // Carbone will automatically maintain the template's format (xls or xlsx)
        // No need to specify convertTo for Excel templates
      };

      carbone.render(templatePath, data, options, async (err, result) => {
        if (err) {
          console.error("Error during Excel generation:", err);
          return reject(err);
        }

        fs.writeFileSync(outputPath, result);
        console.log("Excel file generated:", outputPath);
        resolve();
      });
    });
  }
}
