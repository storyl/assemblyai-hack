import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    ASSEMBLY_AI_API_KEY: process.env.ASSEMBLY_AI_API_KEY,
  },
};

export default nextConfig;
