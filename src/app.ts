import express, { Request, Response } from "express";
import cors from "cors";
import { parseTemplateAndDownload } from "./routes/report";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json({ limit: "200mb" }));
app.use(cors());
app.post("/download", (req: Request, res: Response) => {
  let { reportName, fileName, data } = req.body;

  if (!data || data === "") {
    res.status(400).send("'data' is not provided");
    return;
  }
  if (!reportName || reportName === "") {
    res.status(400).send("'reportName' is not provided");
    return;
  }
  if (!fileName || fileName === "") {
    res.status(400).send("'downloadedFileName' is not provided");
    return;
  }

  parseTemplateAndDownload(data, reportName, fileName, res);
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).end();
});

const port = process.env.PORT ?? 9001;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
