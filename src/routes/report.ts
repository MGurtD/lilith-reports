import fs from "fs";
import carbone from "carbone";
import { Response } from "express";
import DocxToPdfConverter from "../converters/docx-to-pdf.converter";
import { env } from "../utils/env";

export function parseTemplateAndDownload(
  data: any,
  templateName: string,
  fileName: string,
  response: Response
) {
  try {
    const templatePath = `${env.TEMPLATES_PATH}/${templateName}`;
    const downloadedFileName = fileName.endsWith(".docx")
      ? fileName
      : `${fileName}.docx`;
    const outputPath = `./reports/${downloadedFileName}`;

    const fileExists = fs.existsSync(templatePath);
    if (!fileExists) {
      response
        .status(404)
        .end(`Unexisting file on template path. ${templatePath}`);
      return;
    }

    if (!templatePath.endsWith("docx") && !templatePath.endsWith("odt")) {
      response
        .status(400)
        .end(
          "Unsupported format. This service only supports DOCX and ODT formats."
        );
      return;
    }

    var options = {
      convertTo: "docx",
      lang: "es-es",
    };

    // Generate a report using the sample template provided by carbone module
    // Of course, you can create your own templates!
    carbone.render(templatePath, data, options, function (err, result) {
      if (err) {
        return console.log(err);
      }

      // write the result
      fs.writeFileSync(outputPath, result);
      console.log("carbone render output: ", outputPath);

      // convert to pdf

      if (env.CONVERT_TO_PDF) {
        const converter = new DocxToPdfConverter(
          env.CLOUD_CONVERT_API_KEY,
          outputPath,
          outputPath.replace(".docx", ".pdf")
        );

        converter
          .convert()
          .then(() => {
            response.download(
              outputPath.replace(".docx", ".pdf"),
              downloadedFileName.replace(".docx", ".pdf")
            );
          })
          .catch((error) => {
            console.error("Error during PDF conversion:", error);
          });
      } else {
        // download the docx file directly
        response.download(outputPath, downloadedFileName);
        console.log("DOCX file downloaded.", downloadedFileName);
      }
    });
  } catch (err) {
    response
      .status(500)
      .end(`Exception captured during the template generation. ${err}`);
    return;
  }
}
