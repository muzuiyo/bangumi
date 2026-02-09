import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async rewrites() {
    const settingPath = process.env.NEXT_PUBLIC_SETTING_PATH || 'settings'
    return [
      {
        source: `/${settingPath}`,
        destination: `/settings`
      }
    ]
  }
};

export default nextConfig;
