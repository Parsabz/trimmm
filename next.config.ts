import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      stream: false,
    };

    // Handle Web Worker
    config.module.rules.push({
      test: /\.worker\.(js|ts)$/,
      use: {
        loader: 'worker-loader',
        options: {
          filename: '[name].[contenthash].worker.js',
          publicPath: '/_next/',
        },
      },
    });

    return config;
  },
  // Allow serving files from public directory
  experimental: {
    workerThreads: true,
    cpus: 4
  }
};

export default nextConfig;
