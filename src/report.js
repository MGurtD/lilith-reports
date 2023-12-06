import fs from "fs";
import carbone from "carbone";

export function parseTemplate(data, templatePath, fileName, response) {
  var options = {
    convertTo: "docx", //can be docx, txt, ...
  };

  // Generate a report using the sample template provided by carbone module
  // Of course, you can create your own templates!
  carbone.render(templatePath, data, options, function (err, result) {
    if (err) {
      return console.log(err);
    }
    const generatedFileName = `./reports/${fileName}.docx`;

    // write the result
    fs.writeFileSync(generatedFileName, result);

    // download it
    response.download(`./${generatedFileName}`, generatedFileName);
  });
}

export function generateReport(data, report, fileName, response) {
  var options = {
    convertTo: "pdf", //can be docx, txt, ...
  };

  // Generate a report using the sample template provided by carbone module
  // This LibreOffice template contains "Hello {d.firstname} {d.lastname} !"
  // Of course, you can create your own templates!
  carbone.render(
    `${process.env.TEMPLATES_PATH}/${report}.odt`,
    data,
    options,
    function (err, result) {
      if (err) {
        return console.log(err);
      }
      const generatedFileName = `./reports/${fileName}.pdf`;

      // write the result
      fs.writeFileSync(generatedFileName, result);

      // download it
      response.download(`./${generatedFileName}`, generatedFileName);
    }
  );
}
