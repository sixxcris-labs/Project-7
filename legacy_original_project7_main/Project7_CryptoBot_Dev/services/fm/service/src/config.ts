export interface ServiceConfig {
  port: number;
  env: string;
}

export const loadConfig = (): ServiceConfig => {
  return {
    port: parseInt(process.env.PORT || "8080", 10),
    env: process.env.NODE_ENV || "development"
  };
};
