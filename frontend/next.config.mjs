/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.resolve.fallback = {
          fs: false,
          tls: false,
          net: false,
          path: false,
          zlib: false,
          http: false,
          https: false,
          stream: false,
          crypto: false,
          'crypto-browserify': false,
          dns: false,
          child_process: false,
        };
      }
  
      return config;
    },
  };
  
  export default nextConfig;