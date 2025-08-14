'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  ArrowLeft,
  ArrowRight,
  Star,
  Heart,
  Gamepad2,
  Zap,
  Sparkles,
} from 'lucide-react';

const PokemonNostalgiaPlayground = () => {
  const [currentScene, setCurrentScene] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [musicBars, setMusicBars] = useState(Array(16).fill(0));
  const [particles, setParticles] = useState([]);
  const [pokemonPosition, setPokemonPosition] = useState({ x: 50, y: 50 });
  const [showSpecialEffect, setShowSpecialEffect] = useState(false);
  const [pixelArt, setPixelArt] = useState('pikachu');
  const canvasRef = useRef(null);

  // 经典场景数据 - 增强版
  const nostalgicScenes = [
    {
      id: 1,
      title: '真新镇的黎明',
      subtitle: '「ぼうけんの はじまり」',
      description:
        '微风轻抚过小镇的每一个角落，大木博士研究所的灯还亮着。今天，一个新的传说即将开始...',
      pixelScene: 'town',
      backgroundColor:
        'bg-gradient-to-br from-green-400 via-blue-300 to-yellow-200',
      musicType: '8bit-town',
      soundEffect: '⚡🎵🌅',
      dialogues: [
        {
          speaker: '大木博士',
          text: '「おはよう！きょうから きみも ポケモントレーナー だね」',
          speed: 100,
        },
        {
          speaker: '主角',
          text: '「はい！よろしくお ねがいします！」',
          speed: 120,
        },
        {
          speaker: '大木博士',
          text: '「それでは...きみの パートナーを えらんでくれ」',
          speed: 90,
        },
      ],
      memories: [
        '第一次看到御三家时的选择困难症',
        '大木博士温和的声音让人安心',
        '走出研究所时阳光洒在脸上的感觉',
      ],
      pokemonEmoji: '⚡🔥💧',
      specialAction: 'choosePokemon',
    },
    {
      id: 2,
      title: '常青森林的神秘',
      subtitle: '「やせいの ポケモンが あらわれた！」',
      description:
        '阳光透过层层树叶洒下斑驳光影，草丛中传来窸窸窣窣的声音。你的第一次野生Pokemon遭遇即将开始...',
      pixelScene: 'forest',
      backgroundColor:
        'bg-gradient-to-br from-green-600 via-green-400 to-lime-300',
      musicType: '8bit-forest',
      soundEffect: '🌲🐛✨',
      dialogues: [
        {
          speaker: '系统',
          text: '「やせいの キャタピーが あらわれた！」',
          speed: 150,
        },
        { speaker: '主角', text: '「いけ！ピカチュウ！」', speed: 130 },
        { speaker: '皮卡丘', text: '「ピカピカ！」', speed: 200 },
      ],
      memories: [
        '第一次遇见野生Pokemon时的紧张兴奋',
        '绿毛虫可爱的叫声',
        '成功收服时的成就感爆棚',
      ],
      pokemonEmoji: '🐛🕷️🦋',
      specialAction: 'battleEffect',
    },
    {
      id: 3,
      title: '月见山的传说',
      subtitle: '「つきのいしの ひかり」',
      description:
        '皮皮们围成圆圈在月光下跳舞，月之石散发着神秘的光芒。这里隐藏着Pokemon世界最美丽的秘密...',
      pixelScene: 'mountain',
      backgroundColor:
        'bg-gradient-to-br from-purple-800 via-blue-600 to-indigo-400',
      musicType: '8bit-mystic',
      soundEffect: '🌙⭐🔮',
      dialogues: [
        { speaker: '皮皮', text: '「ピッピ♪ ピッピ♪」', speed: 180 },
        { speaker: '旁白', text: '皮皮们正在进行神秘的月光仪式...', speed: 80 },
        { speaker: '主角', text: '「好美啊...」', speed: 100 },
      ],
      memories: [
        '第一次看到皮皮跳舞的震撼',
        '月之石闪闪发光的美丽',
        '感受到Pokemon世界的神奇魅力',
      ],
      pokemonEmoji: '🧚‍♀️🌙💎',
      specialAction: 'moonDance',
    },
    {
      id: 4,
      title: '红莲岛的秘密',
      subtitle: '「かざんの おくぎ」',
      description:
        '炽热的火山口下隐藏着古老的研究所，超梦的诞生地就在这里。科学与Pokemon结合的禁忌实验...',
      pixelScene: 'volcano',
      backgroundColor:
        'bg-gradient-to-br from-red-600 via-orange-500 to-yellow-400',
      musicType: '8bit-danger',
      soundEffect: '🌋💥🧬',
      dialogues: [
        { speaker: '研究员', text: '「実験は...失敗だった」', speed: 70 },
        { speaker: '系统', text: '超梦觉醒了...', speed: 60 },
        { speaker: '超梦', text: '「私は誰だ...ここはどこだ...」', speed: 50 },
      ],
      memories: [
        '第一次了解超梦诞生真相的震惊',
        '感受到科学的可怕力量',
        '对Pokemon基因实验的思考',
      ],
      pokemonEmoji: '🧬👁️‍🗨️💜',
      specialAction: 'mewtwoAwaken',
    },
    {
      id: 5,
      title: '冠军之路的终点',
      subtitle: '「チャンピオンへの みち」',
      description:
        '经过无数次战斗和成长，你终于站在了Pokemon联盟的最高峰。这是梦想实现的时刻...',
      pixelScene: 'championship',
      backgroundColor:
        'bg-gradient-to-br from-yellow-400 via-gold to-orange-400',
      musicType: '8bit-victory',
      soundEffect: '🏆⚡🎊',
      dialogues: [
        {
          speaker: '冠军',
          text: '「君も ついに ここまで きたのか」',
          speed: 80,
        },
        { speaker: '主角', text: '「最後の戦いです！」', speed: 120 },
        { speaker: '冠军', text: '「では...始めよう！」', speed: 90 },
      ],
      memories: [
        '手心出汗的最终决战',
        '看到"你就是冠军"时的狂欢',
        '和Pokemon一起奋斗的感动',
      ],
      pokemonEmoji: '👑🏆⚡',
      specialAction: 'championshipFireworks',
    },
    {
      id: 6,
      title: '小智与皮卡丘',
      subtitle: '「でんきねずみ ポケモン」',
      description:
        '那个永远10岁的少年和他最忠实的伙伴，他们的冒险故事感动了全世界。友谊的力量超越一切...',
      pixelScene: 'anime',
      backgroundColor:
        'bg-gradient-to-br from-yellow-300 via-orange-300 to-red-300',
      musicType: '8bit-friendship',
      soundEffect: '⚡👦💫',
      dialogues: [
        { speaker: '小智', text: '「ピカチュウ！君に決めた！」', speed: 140 },
        { speaker: '皮卡丘', text: '「ピカピカ♪」', speed: 200 },
        { speaker: '小智', text: '「一緒に頑張ろう！」', speed: 130 },
      ],
      memories: [
        '小智第一次见到皮卡丘的感动',
        '两人从陌生到友谊的温暖',
        '"君に決めた"这句话的震撼力',
      ],
      pokemonEmoji: '⚡👦🎒',
      specialAction: 'electricShock',
    },
  ];

  const scene = nostalgicScenes[currentScene];

  // 音乐可视化效果
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setMusicBars((prev) => prev.map(() => Math.random() * 100));
      }, 150);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  // 粒子效果
  useEffect(() => {
    const interval = setInterval(() => {
      setParticles((prev) => [
        ...prev.slice(-20),
        {
          id: Date.now(),
          x: Math.random() * 100,
          y: Math.random() * 100,
          life: 100,
        },
      ]);
    }, 300);
    return () => clearInterval(interval);
  }, []);

  // Pokemon移动效果
  useEffect(() => {
    const interval = setInterval(() => {
      setPokemonPosition((prev) => ({
        x: prev.x + (Math.random() - 0.5) * 10,
        y: prev.y + (Math.random() - 0.5) * 5,
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // 8bit像素艺术组件
  const PixelArt = ({ type, animated = false }) => {
    const artStyles = {
      pikachu: 'text-6xl animate-bounce',
      forest: 'text-4xl animate-pulse',
      town: 'text-5xl animate-spin-slow',
      mountain: 'text-6xl animate-pulse',
      volcano: 'text-5xl animate-ping',
      championship: 'text-7xl animate-bounce',
      anime: 'text-6xl animate-wiggle',
    };

    const artEmojis = {
      pikachu: '⚡',
      forest: '🌲🐛🌲',
      town: '🏠🌳🏠',
      mountain: '⛰️🌙⭐',
      volcano: '🌋💥🔥',
      championship: '🏆👑⚡',
      anime: '👦⚡💫',
    };

    return (
      <div className={`${artStyles[type]} select-none`}>{artEmojis[type]}</div>
    );
  };

  // 音乐播放器组件
  const MusicPlayer = () => (
    <div className="bg-black/80 backdrop-blur-sm rounded-2xl p-6 border-2 border-yellow-400">
      <div className="flex items-center gap-4 mb-4">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="bg-yellow-500 hover:bg-yellow-400 text-black p-3 rounded-full transition-all duration-200 hover:scale-110"
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} />}
        </button>
        <div className="text-white">
          <div className="text-lg font-bold">♪ {scene.musicType} ♪</div>
          <div className="text-sm opacity-75">经典8bit音乐</div>
        </div>
      </div>

      {/* 音乐可视化条 */}
      <div className="flex items-end gap-1 h-20 mb-4">
        {musicBars.map((height, i) => (
          <div
            key={i}
            className="bg-gradient-to-t from-yellow-500 to-red-500 w-3 rounded-t transition-all duration-150"
            style={{
              height: `${isPlaying ? height : 10}%`,
              animationDelay: `${i * 50}ms`,
            }}
          />
        ))}
      </div>

      {/* 频谱动画 */}
      {isPlaying && (
        <div className="text-center animate-pulse">
          <span className="text-2xl">🎵 🎶 🎵 🎶 🎵</span>
        </div>
      )}
    </div>
  );

  // 特效触发器
  const triggerSpecialEffect = () => {
    setShowSpecialEffect(true);
    setTimeout(() => setShowSpecialEffect(false), 3000);

    switch (scene.specialAction) {
      case 'choosePokemon':
        // Pokemon选择特效
        break;
      case 'battleEffect':
        // 战斗特效
        break;
      case 'moonDance':
        // 月光舞蹈特效
        break;
      case 'mewtwoAwaken':
        // 超梦觉醒特效
        break;
      case 'championshipFireworks':
        // 冠军烟花特效
        break;
      case 'electricShock':
        // 电击特效
        break;
    }
  };

  // 对话播放器
  const DialoguePlayer = () => {
    const [currentDialogue, setCurrentDialogue] = useState(0);
    const [displayText, setDisplayText] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const playDialogue = () => {
      if (currentDialogue < scene.dialogues.length) {
        const dialogue = scene.dialogues[currentDialogue];
        setIsTyping(true);

        // 打字机效果
        let i = 0;
        const typeInterval = setInterval(() => {
          setDisplayText(dialogue.text.slice(0, i));
          i++;
          if (i > dialogue.text.length) {
            clearInterval(typeInterval);
            setIsTyping(false);
            setTimeout(() => {
              setCurrentDialogue((prev) => (prev + 1) % scene.dialogues.length);
            }, 1000);
          }
        }, dialogue.speed);
      }
    };

    return (
      <div className="bg-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border-4 border-blue-400 relative overflow-hidden">
        {/* 老式CRT效果 */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-400/10 to-transparent animate-pulse" />

        <div className="relative z-10">
          <div className="text-yellow-400 text-lg font-bold mb-2">
            {scene.dialogues[currentDialogue]?.speaker}
          </div>
          <div className="text-white text-xl mb-4 font-mono min-h-[60px]">
            {displayText}
            {isTyping && <span className="animate-blink">█</span>}
          </div>
          <button
            onClick={playDialogue}
            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full transition-all duration-200 hover:scale-105"
          >
            ▶ 播放对话
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white overflow-hidden relative">
      {/* 背景粒子效果 */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-2 h-2 bg-yellow-400 rounded-full animate-twinkle"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDuration: '2s',
            }}
          />
        ))}
      </div>

      {/* 移动的Pokemon */}
      <div
        className="absolute text-4xl transition-all duration-2000 z-10"
        style={{
          left: `${Math.max(5, Math.min(90, pokemonPosition.x))}%`,
          top: `${Math.max(5, Math.min(80, pokemonPosition.y))}%`,
        }}
      >
        <div className="animate-bounce">⚡</div>
      </div>

      {/* 特效覆盖层 */}
      {showSpecialEffect && (
        <div className="absolute inset-0 bg-yellow-400/20 animate-flash z-20" />
      )}

      {/* 主标题 */}
      <div className="text-center py-8 relative z-30">
        <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-yellow-400 via-red-400 to-pink-400 bg-clip-text text-transparent animate-glow">
          🎮 Pokemon 超级怀旧游乐园
        </h1>
        <p className="text-xl opacity-80 animate-pulse">
          穿越时空，重温经典，感受8bit时代的纯真美好
        </p>
      </div>

      {/* 场景导航栏 */}
      <div className="px-4 mb-8">
        <div className="flex overflow-x-auto gap-4 pb-4">
          {nostalgicScenes.map((s, index) => (
            <button
              key={s.id}
              onClick={() => setCurrentScene(index)}
              className={`flex-shrink-0 p-4 rounded-xl transition-all duration-300 border-2 ${
                index === currentScene
                  ? 'bg-yellow-500 text-black border-yellow-300 scale-110 shadow-2xl'
                  : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
              }`}
            >
              <div className="text-3xl mb-2">{s.pokemonEmoji}</div>
              <div className="text-sm font-bold">{s.title}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 主场景展示 */}
      <div className="px-4 mb-8">
        <div
          className={`${scene.backgroundColor} rounded-3xl p-8 shadow-2xl relative overflow-hidden`}
        >
          {/* 像素艺术背景 */}
          <div className="absolute inset-0 opacity-20">
            <PixelArt type={scene.pixelScene} animated />
          </div>

          <div className="relative z-10">
            {/* 场景头部 */}
            <div className="text-center mb-8">
              <div className="text-8xl mb-4 animate-float">
                {scene.soundEffect}
              </div>
              <h2 className="text-4xl font-bold text-gray-800 mb-2 drop-shadow-lg">
                {scene.title}
              </h2>
              <p className="text-xl text-gray-700 italic mb-4 font-bold">
                {scene.subtitle}
              </p>
            </div>

            {/* 故事描述 */}
            <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-6 mb-8 border-2 border-white/30">
              <p className="text-white text-lg leading-relaxed text-center">
                {scene.description}
              </p>
            </div>

            {/* 音乐播放器 */}
            <div className="mb-8">
              <MusicPlayer />
            </div>

            {/* 对话播放器 */}
            <div className="mb-8">
              <DialoguePlayer />
            </div>

            {/* 特效按钮 */}
            <div className="text-center mb-8">
              <button
                onClick={triggerSpecialEffect}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-8 py-4 rounded-full text-xl font-bold transition-all duration-300 hover:scale-110 shadow-2xl"
              >
                ✨ 触发特殊效果 ✨
              </button>
            </div>

            {/* 场景控制 */}
            <div className="flex justify-center gap-6">
              <button
                onClick={() =>
                  setCurrentScene(
                    (prev) =>
                      (prev - 1 + nostalgicScenes.length) %
                      nostalgicScenes.length
                  )
                }
                className="bg-gray-800/80 hover:bg-gray-700/80 text-white p-4 rounded-full transition-all duration-200 hover:scale-110 shadow-xl"
              >
                <ArrowLeft size={32} />
              </button>

              <button
                onClick={() =>
                  setCurrentScene((prev) => (prev + 1) % nostalgicScenes.length)
                }
                className="bg-gray-800/80 hover:bg-gray-700/80 text-white p-4 rounded-full transition-all duration-200 hover:scale-110 shadow-xl"
              >
                <ArrowRight size={32} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 回忆收集区 */}
      <div className="px-4 mb-8">
        <div className="bg-black/60 backdrop-blur-sm rounded-2xl p-8 border-2 border-purple-400">
          <h3 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            💭 训练师回忆录
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {scene.memories.map((memory, index) => (
              <div
                key={index}
                className="bg-gradient-to-br from-purple-600/30 to-blue-600/30 rounded-xl p-6 hover:scale-105 transition-all duration-300 border border-white/20 hover:border-yellow-400/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  <Star size={20} className="text-yellow-400 animate-twinkle" />
                  <span className="text-sm text-yellow-300">珍贵回忆</span>
                </div>
                <p className="text-white leading-relaxed">{memory}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 底部互动区 */}
      <div className="px-4 pb-8">
        <div className="bg-gradient-to-r from-yellow-600/20 to-red-600/20 backdrop-blur-sm rounded-2xl p-6 text-center border-2 border-yellow-400/50">
          <div className="text-2xl mb-4">
            🎵 听到这些8bit音乐，你想起了什么？ 🎵
          </div>
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="bg-white/10 rounded-full px-6 py-3 hover:bg-white/20 transition-all cursor-pointer">
              💝 童年的美好时光
            </div>
            <div className="bg-white/10 rounded-full px-6 py-3 hover:bg-white/20 transition-all cursor-pointer">
              🎮 和朋友一起游戏的快乐
            </div>
            <div className="bg-white/10 rounded-full px-6 py-3 hover:bg-white/20 transition-all cursor-pointer">
              ⚡ 第一次收服Pokemon的激动
            </div>
          </div>
        </div>
      </div>

      {/* CSS动画定义 */}
      <style jsx>{`
        @keyframes twinkle {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes glow {
          0%,
          100% {
            text-shadow: 0 0 20px rgba(255, 255, 0, 0.5);
          }
          50% {
            text-shadow: 0 0 30px rgba(255, 255, 0, 0.8);
          }
        }
        @keyframes flash {
          0%,
          100% {
            opacity: 0;
          }
          50% {
            opacity: 1;
          }
        }
        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }
        .animate-twinkle {
          animation: twinkle 2s infinite;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        .animate-flash {
          animation: flash 0.5s ease-in-out;
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  );
};

export default PokemonNostalgiaPlayground;
