import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Fija la raíz del proyecto (evita warning con múltiples lockfiles, ej. iCloud)
  turbopack: { root: path.resolve(process.cwd()) },
};

export default nextConfig;
