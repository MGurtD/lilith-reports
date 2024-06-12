"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseTemplateAndDownload = void 0;
const fs_1 = __importDefault(require("fs"));
const carbone_1 = __importDefault(require("carbone"));
function parseTemplateAndDownload(data, templateName, fileName, response) {
    try {
        const templatePath = `${process.env.TEMPLATES_PATH}/${templateName}`;
        const downloadedFileName = fileName.endsWith(".docx")
            ? fileName
            : `${fileName}.docx`;
        const outputPath = `./reports/${downloadedFileName}`;
        const fileExists = fs_1.default.existsSync(templatePath);
        if (!fileExists) {
            response
                .status(404)
                .end(`Unexisting file on template path. ${templatePath}`);
            return;
        }
        if (!templatePath.endsWith("docx") && !templatePath.endsWith("odt")) {
            response
                .status(400)
                .end("Unsupported format. This service only supports DOCX and ODT formats.");
            return;
        }
        var options = {
            convertTo: "docx",
            lang: "es-es",
        };
        // Generate a report using the sample template provided by carbone module
        // Of course, you can create your own templates!
        carbone_1.default.render(templatePath, data, options, function (err, result) {
            if (err) {
                return console.log(err);
            }
            // write the result
            fs_1.default.writeFileSync(outputPath, result);
            // download it
            console.log("output path: ", outputPath);
            console.log("downloadedFileName: ", downloadedFileName);
            response.download(outputPath, downloadedFileName);
        });
    }
    catch (err) {
        response
            .status(500)
            .end(`Exception captured during the template generation. ${err}`);
        return;
    }
}
exports.parseTemplateAndDownload = parseTemplateAndDownload;
//# sourceMappingURL=report.js.map