import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import fs from "fs";

const app = express();
dotenv.config();

app.use(bodyParser.json());

import { generateReport, parseTemplate } from "./report.js";
app.post("/generate-report", (req, res) => {
  generateReport(req.body.data, req.body.report, req.body.fileName, res);
});

app.post("/parse-template", (req, res) => {
  let templatePath = req.body.templatePath.toString();

  const fileExists = fs.existsSync(templatePath);
  if (!fileExists) {
    res.status(400).end(`Unexisting file on template path. ${templatePath}`);
    return;
  }

  if (!templatePath.endsWith("docx") && !templatePath.endsWith("odt")) {
    res
      .status(400)
      .end(
        "Unsupported format. This service only supports DOCX and ODT formats."
      );
    return;
  }

  parseTemplate(req.body.data, templatePath, req.body.fileName, res);
});

app.get("/health", (req, res) => {
  res.status(200).end();
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
