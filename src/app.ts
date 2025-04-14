import express, { Request, Response } from "express";
import cors from "cors";
import { handleTemplateDownload } from "./routes/template-parser";
import { env } from "./utils/env";

// Import the cleanup job
import "./jobs/cleanup-job";

const app = express();
app.use(express.json({ limit: "200mb" }));
app.use(cors());

app.post("/download", async (req: Request, res: Response) => {
  const { reportName, fileName, data, format } = req.body;

  if (!data || data === "") {
    res.status(400).send("'data' is not provided");
    return;
  }
  if (!reportName || reportName === "") {
    res.status(400).send("'reportName' is not provided");
    return;
  }
  if (!fileName || fileName === "") {
    res.status(400).send("'fileName' is not provided");
    return;
  }

  try {
    // Delegate the logic to the template-parser
    await handleTemplateDownload(data, reportName, fileName, format, res);
  } catch (error) {
    console.error("Error processing the request:", error);
    res.status(500).send("An error occurred while processing the request.");
  }
});

app.get("/health", (req: Request, res: Response) => {
  res.status(200).end();
});

const port = env.PORT;
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
