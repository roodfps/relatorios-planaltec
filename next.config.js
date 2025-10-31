/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações do Next.js
  reactStrictMode: true,
  
  // Configuração de imagens
  images: {
    // Formato otimizado, mas mantém qualidade máxima
    formats: ['image/avif', 'image/webp'],
    // Permite imagens sem otimização se necessário
    unoptimized: false,
  },
}

module.exports = nextConfig
