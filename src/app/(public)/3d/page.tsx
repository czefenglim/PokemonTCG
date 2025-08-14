import { Metadata } from 'next';
import Pokemon3D from '@/components/Pokemon3D';

export const metadata: Metadata = {
  title: '3D Pokemon电子宠物',
  description: '与你的3D Pokemon伙伴互动',
};

export default function Pokemon3DPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            🎮 3D Pokemon 电子宠物世界
          </h1>
          <p className="text-lg text-gray-600">体验下一代虚拟宠物养成游戏</p>
        </div>

        <Pokemon3D />

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>使用Three.js技术驱动的3D虚拟宠物系统</p>
        </div>
      </div>
    </div>
  );
}
