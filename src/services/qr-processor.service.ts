import fs from "fs";
import QRCode from "qrcode";
import { createReport } from "docx-templates";

/**
 * Service for processing QR codes in DOCX files.
 */
export class QrProcessorService {
  /**
   * Post-processes a DOCX file to embed QR codes.
   * @param filePath - The path to the DOCX file to process.
   * @param qrCodeUrl - The QR code data/URL to generate.
   */
  static async process(filePath: string, qrCodeUrl: string): Promise<void> {
    console.log("Processing QR code:", qrCodeUrl);

    const docxBuffer = fs.readFileSync(filePath);

    // Generate QR code as buffer
    const qrBuffer = await QRCode.toBuffer(qrCodeUrl, {
      width: 500,
      margin: 1,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M",
    });

    const processedBuffer = await createReport({
      template: docxBuffer,
      data: {
        qrCodeData: {
          width: 2,
          height: 2,
          data: qrBuffer,
          extension: ".png",
        },
      },
      cmdDelimiter: ["+++", "+++"],
    });

    fs.writeFileSync(filePath, processedBuffer);
    console.log("QR code processed successfully");
  }
}
