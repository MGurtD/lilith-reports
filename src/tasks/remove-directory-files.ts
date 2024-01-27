import fs from "fs";

export async function removeDirectoryFiles(directoryPath: string) {
  if (!fs.existsSync(directoryPath)) {
    throw new Error(`Unexisting path '${directoryPath}' on file system.`);
  }

  for (const file of await fs.readdir(directory)) {
    await fs.unlink(path.join(directory, file));
  }
}
