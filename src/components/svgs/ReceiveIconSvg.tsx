import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Path,
  Rect,
  Circle,
  G,
} from 'react-native-svg';

interface Props {
  size?: number;
}

export const ReceiveIconSvg: React.FC<Props> = ({ size = 44 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="receiveGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#00C9FF" />
          <Stop offset="100%" stopColor="#92FE9D" />
        </LinearGradient>
        <LinearGradient id="receiveWhite" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#E0F7FA" />
        </LinearGradient>
      </Defs>

      {/* Incoming pulsating radar ripples */}
      <Path
        d="M 30 26 A 28 28 0 0 1 70 26"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <Path
        d="M 38 36 A 16 16 0 0 1 62 36"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />

      {/* Downward Incoming Fast Arrow */}
      <G>
        <Path
          d="M 50 16 L 50 56"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <Path
          d="M 38 46 L 50 58 L 62 46"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>

      {/* Catchment Tray / Inbox base */}
      <Path
        d="M 22 62 L 32 82 L 68 82 L 78 62 L 64 62 L 58 72 L 42 72 L 36 62 Z"
        fill="url(#receiveWhite)"
      />

      {/* Glow dot */}
      <Circle cx="50" cy="14" r="3.5" fill="#FFFFFF" />
    </Svg>
  );
};

export default ReceiveIconSvg;

