import { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  animationDelay: number;
  opacity: number;
  size: number;
}

export function SnowEffect() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    const flakes: Snowflake[] = [];
    const flakeCount = 50;

    for (let i = 0; i < flakeCount; i++) {
      flakes.push({
        id: i,
        left: Math.random() * 100,
        animationDuration: 5 + Math.random() * 10,
        animationDelay: Math.random() * 5,
        opacity: 0.3 + Math.random() * 0.7,
        size: 2 + Math.random() * 4,
      });
    }
    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50" data-testid="snow-effect">
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
          }
          100% {
            transform: translateY(110vh) rotate(360deg);
          }
        }
        @keyframes sway {
          0%, 100% {
            margin-left: 0;
          }
          25% {
            margin-left: 15px;
          }
          75% {
            margin-left: -15px;
          }
        }
        .snowflake {
          position: absolute;
          top: -10px;
          color: white;
          text-shadow: 0 0 5px rgba(255, 255, 255, 0.5);
          animation: snowfall linear infinite, sway ease-in-out infinite;
        }
      `}</style>
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake"
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s, 3s`,
            animationDelay: `${flake.animationDelay}s, 0s`,
            opacity: flake.opacity,
            fontSize: `${flake.size}px`,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
}
