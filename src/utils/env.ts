import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const getEnvVar = (key: string, required = true): string => {
  const value = process.env[key];
  if (!value && required) {
    throw new Error(
      `❌ The environment variable ${key} is required and not defined.`
    );
  }
  return value || "";
};

export const env = {
  PORT: parseInt(getEnvVar("PORT"), 10),
  TEMPLATES_PATH: getEnvVar("TEMPLATES_PATH"),
  CLOUD_CONVERT_API_KEY: getEnvVar("CLOUD_CONVERT_API_KEY", false),
};
