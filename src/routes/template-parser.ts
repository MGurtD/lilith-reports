import fs from "fs";
import carbone from "carbone";
import { Response } from "express";
import DocxToPdfConverter from "../converters/docx-to-pdf.converter";
import { env } from "../utils/env";

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
    const downloadedFileName = fileName.endsWith(".docx")
      ? fileName
      : `${fileName}.docx`;
    const outputPath = `./reports/${downloadedFileName}`;

    // Validate the template file
    validateTemplate(templatePath, response);

    // Generate the DOCX file
    await generateDocx(templatePath, data, outputPath);

    // Convert to PDF if requested
    if (format && format.toLowerCase() === "pdf") {
      const pdfFilePath = outputPath.replace(".docx", ".pdf");
      await convertToPdf(outputPath, pdfFilePath);
      response.download(
        pdfFilePath,
        downloadedFileName.replace(".docx", ".pdf")
      );
    } else {
      // Send the DOCX file directly
      response.download(outputPath, downloadedFileName);
    }
  } catch (err) {
    response
      .status(500)
      .end(`Exception captured during the template generation. ${err}`);
  }
}

/**
 * Validates the template file.
 * @param templatePath - The path to the template file.
 * @param response - The Express response object.
 */
function validateTemplate(templatePath: string, response: Response) {
  if (!fs.existsSync(templatePath)) {
    response
      .status(404)
      .end(`Unexisting file on template path. ${templatePath}`);
    throw new Error("Template file not found.");
  }

  if (!templatePath.endsWith("docx") && !templatePath.endsWith("odt")) {
    response
      .status(400)
      .end(
        "Unsupported format. This service only supports DOCX and ODT formats for templates."
      );
    throw new Error("Unsupported template format.");
  }
}

/**
 * Generates a DOCX file using the Carbone template engine.
 * @param templatePath - The path to the template file.
 * @param data - The data to populate the template.
 * @param outputPath - The path to save the generated DOCX file.
 */
function generateDocx(
  templatePath: string,
  data: any,
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const options = {
      convertTo: "docx",
      lang: "es-es",
    };

    carbone.render(templatePath, data, options, (err, result) => {
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

/**
 * Converts a DOCX file to PDF using the DocxToPdfConverter.
 * @param inputPath - The path to the input DOCX file.
 * @param outputPath - The path to save the converted PDF file.
 */
async function convertToPdf(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const converter = new DocxToPdfConverter(
    env.CLOUD_CONVERT_API_KEY,
    inputPath,
    outputPath
  );

  try {
    await converter.convert();
    console.log("PDF file generated:", outputPath);
  } catch (error) {
    console.error("Error during PDF conversion:", error);
    throw error;
  }
}
