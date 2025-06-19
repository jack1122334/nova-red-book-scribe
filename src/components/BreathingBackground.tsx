import React from 'react';

interface BreathingBackgroundProps {
  className?: string;
  intensity?: 'light' | 'medium' | 'strong';
}

export const BreathingBackground: React.FC<BreathingBackgroundProps> = ({ 
  className = '',
  intensity = 'medium'
}) => {
  const getIntensityStyles = () => {
    switch (intensity) {
      case 'light':
        return {
          primary: 'from-purple-400/10 to-pink-400/10',
          secondary: 'from-blue-400/10 to-cyan-400/10',
          primarySize: 'w-24 h-24',
          secondarySize: 'w-20 h-20'
        };
      case 'strong':
        return {
          primary: 'from-purple-400/30 to-pink-400/30',
          secondary: 'from-blue-400/30 to-cyan-400/30',
          primarySize: 'w-40 h-40',
          secondarySize: 'w-32 h-32'
        };
      default: // medium
        return {
          primary: 'from-purple-400/20 to-pink-400/20',
          secondary: 'from-blue-400/20 to-cyan-400/20',
          primarySize: 'w-32 h-32',
          secondarySize: 'w-24 h-24'
        };
    }
  };

  const styles = getIntensityStyles();

  return (
    <div className={`fixed inset-0 pointer-events-none overflow-hidden ${className}`}>
      {/* 主要呼吸光晕 - 左上角 */}
      <div className={`absolute -top-1 -left-1 ${styles.primarySize} bg-gradient-to-br ${styles.primary} rounded-full blur-2xl animate-pulse`}></div>
      
      {/* 次要呼吸光晕 - 右下角 */}
      <div className={`absolute -bottom-1 -right-1 ${styles.secondarySize} bg-gradient-to-br ${styles.secondary} rounded-full blur-2xl animate-pulse delay-1000`}></div>
      
      {/* 额外的装饰光晕 - 右上角 */}
      <div className="absolute top-1/4 -right-8 w-28 h-28 bg-gradient-to-br from-green-400/15 to-emerald-400/15 rounded-full blur-2xl animate-pulse delay-500"></div>
      
      {/* 额外的装饰光晕 - 左下角 */}
      <div className="absolute -bottom-8 left-1/4 w-20 h-20 bg-gradient-to-br from-orange-400/15 to-yellow-400/15 rounded-full blur-2xl animate-pulse delay-1500"></div>
    </div>
  );
}; 