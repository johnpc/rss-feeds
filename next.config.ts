import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    TICKETMASTER_API_KEY: process.env.TICKETMASTER_API_KEY,
    RAPIDAPI_KEY: process.env.RAPIDAPI_KEY,
  }
};

export default nextConfig;
