import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Circle,
  G,
} from 'react-native-svg';

interface Props {
  size?: number;
}

export const SendIconSvg: React.FC<Props> = ({ size = 44 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="sendRocketBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#8A2387" />
          <Stop offset="50%" stopColor="#E94057" />
          <Stop offset="100%" stopColor="#F27121" />
        </LinearGradient>
        <LinearGradient id="wingGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#FDEBFF" />
        </LinearGradient>
      </Defs>

      {/* Speed lines */}
      <Path
        d="M 16 70 L 32 64"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeOpacity="0.7"
      />
      <Path
        d="M 22 82 L 42 74"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeOpacity="0.9"
      />
      <Path
        d="M 38 90 L 52 84"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />

      {/* Main Send Plane / Dart */}
      <G>
        {/* Main upper wing */}
        <Path
          d="M 24 50 L 84 18 L 62 82 L 48 58 Z"
          fill="url(#wingGrad)"
        />
        {/* Top fold highlight */}
        <Path
          d="M 24 50 L 84 18 L 48 58 Z"
          fill="#FFFFFF"
        />
        {/* Underbody shadow fold */}
        <Path
          d="M 48 58 L 62 82 L 56 64 Z"
          fill="#7928CA"
          fillOpacity="0.45"
        />
      </G>

      {/* Glow Sparkle */}
      <Circle cx="86" cy="16" r="3.5" fill="#FFFFFF" />
    </Svg>
  );
};

export default SendIconSvg;

