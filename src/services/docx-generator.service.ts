import fs from "fs";
import carbone from "carbone";

/**
 * Service for generating DOCX files using the Carbone template engine.
 */
export class DocxGeneratorService {
  /**
   * Generates a DOCX file from a template and data.
   * @param templatePath - The path to the template file.
   * @param data - The data to populate the template.
   * @param outputPath - The path to save the generated DOCX file.
   */
  static generate(
    templatePath: string,
    data: any,
    outputPath: string
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const options = {
        convertTo: "docx",
        lang: "es-es",
      };

      carbone.render(templatePath, data, options, async (err, result) => {
        if (err) {
          console.error("Error during DOCX generation:", err);
          return reject(err);
        }

        fs.writeFileSync(outputPath, result);
        console.log("DOCX file generated:", outputPath);
        resolve();
      });
    });
  }
}
