import { Response } from "express";
import { env } from "../utils/env";
import { TemplateValidatorService } from "../services/template-validator.service";
import { DocxGeneratorService } from "../services/docx-generator.service";
import { ExcelGeneratorService } from "../services/excel-generator.service";
import { QrProcessorService } from "../services/qr-processor.service";
import { PdfConverterService } from "../services/pdf-converter.service";

/**
 * Handles the template generation and file download process.
 * @param data - The data to populate the template.
 * @param templateName - The name of the template file.
 * @param fileName - The name of the output file.
 * @param format - The desired output format (e.g., "pdf" or "docx").
 * @param response - The Express response object.
 */
export async function handleTemplateDownload(
  data: any,
  templateName: string,
  fileName: string,
  format: string,
  response: Response
) {
  try {
    const templatePath = `${env.TEMPLATES_PATH}/${templateName}`;

    // Validate the template file
    TemplateValidatorService.validate(templatePath);

    // Determine if this is an Excel template
    const isExcel = TemplateValidatorService.isExcelTemplate(templatePath);

    // Set appropriate file extension based on template type
    let fileExtension: string;
    if (isExcel) {
      fileExtension = templatePath.endsWith(".xlsx") ? ".xlsx" : ".xls";
    } else {
      fileExtension = ".docx";
    }

    const downloadedFileName = fileName.endsWith(fileExtension)
      ? fileName
      : `${fileName}${fileExtension}`;
    const outputPath = `./reports/${downloadedFileName}`;

    // Inject system timestamp into data (ISO 8601 format for Carbone compatibility)
    const enrichedData = {
      ...data,
      now: new Date().toISOString(),
    };

    // Generate the file using appropriate service
    if (isExcel) {
      await ExcelGeneratorService.generate(
        templatePath,
        enrichedData,
        outputPath
      );
    } else {
      await DocxGeneratorService.generate(
        templatePath,
        enrichedData,
        outputPath
      );
    }

    // Post-process for QR codes if qrCode field exists (only for DOCX)
    if (!isExcel && data.qrCodeUrl && data.qrCodeUrl.trim() !== "") {
      await QrProcessorService.process(outputPath, data.qrCodeUrl);
    }

    // Convert to PDF if requested (only for DOCX)
    if (!isExcel && format && format.toLowerCase() === "pdf") {
      const pdfFilePath = outputPath.replace(".docx", ".pdf");
      await PdfConverterService.convert(outputPath, pdfFilePath);
      response.download(
        pdfFilePath,
        downloadedFileName.replace(".docx", ".pdf")
      );
    } else {
      // Send the file directly (DOCX or Excel)
      response.download(outputPath, downloadedFileName);
    }
  } catch (err) {
    console.error("Template processing error:", err);

    // Centralized error handling
    if (err instanceof Error) {
      if (err.message.includes("Template file not found")) {
        response.status(404).end(`Template not found: ${err.message}`);
      } else if (err.message.includes("Unsupported template format")) {
        response.status(400).end(`Unsupported format: ${err.message}`);
      } else {
        response.status(500).end(`Template generation failed: ${err.message}`);
      }
    } else {
      response
        .status(500)
        .end(`Unexpected error during template generation: ${err}`);
    }
  }
}
