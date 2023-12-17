import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import { parseTemplate } from "./routes/report";

const app = express();
app.use(bodyParser.json());
app.post("/parse-template", (req: Request, res: Response) => {
  let { reportName, downloadedFileName, data } = req.body;

  if (!data || data === "") {
    res.status(400).send("'data' is not provided");
    return;
  }
  if (!reportName || reportName === "") {
    res.status(400).send("'reportName' is not provided");
    return;
  }
  if (!downloadedFileName || downloadedFileName === "") {
    res.status(400).send("'downloadedFileName' is not provided");
    return;
  }

  parseTemplate(data, reportName, downloadedFileName, res);
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).end();
});

const port = process.env.PORT ?? 9000;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
