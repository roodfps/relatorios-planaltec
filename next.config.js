/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configurações do Next.js
  reactStrictMode: true,
  
  // Configuração de imagens - qualidade máxima
  images: {
    // Qualidade de imagem padrão (0-100, onde 100 é máxima qualidade)
    quality: 100,
    // Formato otimizado, mas mantém qualidade máxima
    formats: ['image/avif', 'image/webp'],
    // Permite imagens sem otimização se necessário
    unoptimized: false,
  },
}

module.exports = nextConfig
