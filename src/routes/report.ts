import fs from "fs";
import carbone from "carbone";
import { Response } from "express";

export function parseTemplate(
  data: any,
  templateName: string,
  downloadedFileName: string,
  response: Response
) {
  const templatePath = `${process.env.TEMPLATES_PATH}/${templateName}.docx`;

  const fileExists = fs.existsSync(templatePath);
  if (!fileExists) {
    response
      .status(400)
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
    convertTo: "docx", //can be docx, txt, ...
  };

  // Generate a report using the sample template provided by carbone module
  // Of course, you can create your own templates!
  carbone.render(data, options, function (err, result) {
    if (err) {
      return console.log(err);
    }

    // write the result
    fs.writeFileSync(templatePath, result);

    // download it
    const fileName = downloadedFileName.endsWith(".docx")
      ? downloadedFileName
      : `${downloadedFileName}.docx`;
    response.download(templatePath, fileName);
  });
}
