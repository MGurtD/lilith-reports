import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import CloudConvert from "cloudconvert";
import { JobTask } from "cloudconvert/built/lib/JobsResource";

interface TaskResult {
  name: string;
  status: string;
  result?: {
    form?: {
      url: string;
      parameters: { [key: string]: string };
    };
    files?: Array<{
      url: string;
      filename: string;
    }>;
  };
}

export class DocxToPdfConverter {
  private cloudConvert: CloudConvert;
  private inputFile: string;
  private outputFile: string;
  private uploadTask: JobTask | undefined;

  constructor(private apiKey: string, inputFile: string, outputFile: string) {
    this.cloudConvert = new CloudConvert(apiKey);
    this.inputFile = inputFile;
    this.outputFile = outputFile;
  }

  public async convert(): Promise<void> {
    try {
      console.log("🛠️  Creant la feina de conversió...");
      const job = await this.createJob();

      console.log("📤 Pujant l’arxiu...");
      await this.uploadFile();

      console.log("⏳ Esperant la finalització...");
      const completedJob = await this.cloudConvert.jobs.wait(job.id);

      console.log("📥 Descarregant el PDF...");
      await this.downloadFile(completedJob.tasks);

      console.log(`✅ Conversió completada. Guardat a: ${this.outputFile}`);
    } catch (err: any) {
      console.error("❌ Error:", err.response?.data || err.message);
    }
  }

  private async createJob() {
    const job = await this.cloudConvert.jobs.create({
      tasks: {
        "upload-file": {
          operation: "import/upload",
        },
        "convert-file": {
          operation: "convert",
          input: "upload-file",
          input_format: "docx",
          output_format: "pdf",
        },
        "export-file": {
          operation: "export/url",
          input: "convert-file",
        },
      },
    });

    this.uploadTask = job.tasks.find((t: JobTask) => t.name === "upload-file");
    return job;
  }

  private async uploadFile(): Promise<void> {
    if (!this.uploadTask?.result?.form)
      throw new Error("Upload task mal configurat.");

    const { url, parameters } = this.uploadTask.result.form;
    const formData = new FormData();

    for (const [key, value] of Object.entries(parameters)) {
      formData.append(key, value);
    }

    formData.append("file", fs.createReadStream(this.inputFile));

    await axios.post(url, formData, {
      headers: formData.getHeaders(),
    });
  }

  private async downloadFile(tasks: JobTask[]): Promise<void> {
    const exportTask = tasks.find(
      (t) => t.name === "export-file" && t.status === "finished"
    );

    const fileUrl = exportTask?.result?.files?.[0].url;
    if (!fileUrl)
      throw new Error("No s’ha pogut obtenir la URL del fitxer PDF.");

    const response = await axios.get(fileUrl, { responseType: "stream" });
    const writer = fs.createWriteStream(this.outputFile);

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  }
}
