import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  G,
} from 'react-native-svg';

interface Props {
  size?: number;
}

export const SecurityShieldSvg: React.FC<Props> = ({ size = 28 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="shieldGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#00C853" />
          <Stop offset="100%" stopColor="#1DE9B6" />
        </LinearGradient>
      </Defs>

      {/* Shield Body */}
      <Path
        d="M 50 12 L 82 24 C 82 56 68 78 50 88 C 32 78 18 56 18 24 Z"
        fill="url(#shieldGrad)"
      />

      {/* Shield Inner Inset */}
      <Path
        d="M 50 18 L 76 28 C 76 54 64 72 50 81 C 36 72 24 54 24 28 Z"
        fill="#000000"
        fillOpacity="0.12"
      />

      {/* Checkmark */}
      <Path
        d="M 36 48 L 46 58 L 66 38"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default SecurityShieldSvg;

