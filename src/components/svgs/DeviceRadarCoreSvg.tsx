import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Circle,
  Rect,
  Path,
  G,
} from 'react-native-svg';

interface Props {
  size?: number;
}

export const DeviceRadarCoreSvg: React.FC<Props> = ({ size = 70 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="coreBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#007AFF" />
          <Stop offset="100%" stopColor="#0051C7" />
        </LinearGradient>
        <LinearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#E3F2FD" />
        </LinearGradient>
      </Defs>

      {/* Center glowing circle */}
      <Circle cx="50" cy="50" r="46" fill="url(#coreBg)" />
      <Circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeOpacity="0.4"
      />

      {/* Stylized Modern Smartphone Vector */}
      <G>
        <Rect
          x="34"
          y="24"
          width="32"
          height="52"
          rx="6"
          fill="url(#screenGrad)"
        />
        {/* Screen inner area */}
        <Rect
          x="37"
          y="29"
          width="26"
          height="40"
          rx="3"
          fill="#007AFF"
          fillOpacity="0.85"
        />
        {/* Speaker notch */}
        <Rect
          x="44"
          y="26"
          width="12"
          height="2"
          rx="1"
          fill="#0051C7"
        />
        {/* Home indicator bar */}
        <Rect
          x="44"
          y="71"
          width="12"
          height="2"
          rx="1"
          fill="#0051C7"
        />
        {/* Transfer wave dots on screen */}
        <Circle cx="50" cy="45" r="4" fill="#FFFFFF" />
        <Path
          d="M 43 45 A 7 7 0 0 1 57 45"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <Path
          d="M 39 45 A 11 11 0 0 1 61 45"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeOpacity="0.7"
        />
      </G>
    </Svg>
  );
};

export default DeviceRadarCoreSvg;

