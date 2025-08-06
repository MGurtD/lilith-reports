import DocxToPdfConverter from "./docx-to-pdf.converter";
import { env } from "../utils/env";

/**
 * Service for converting DOCX files to PDF.
 */
export class PdfConverterService {
  /**
   * Converts a DOCX file to PDF using the DocxToPdfConverter.
   * @param inputPath - The path to the input DOCX file.
   * @param outputPath - The path to save the converted PDF file.
   */
  static async convert(inputPath: string, outputPath: string): Promise<void> {
    const converter = new DocxToPdfConverter(
      env.CLOUD_CONVERT_API_KEY,
      inputPath,
      outputPath
    );

    await converter.convert();
    console.log("PDF file generated:", outputPath);
  }
}
