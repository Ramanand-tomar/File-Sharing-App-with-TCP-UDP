import React from 'react';
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Path,
  Circle,
  G,
} from 'react-native-svg';

interface Props {
  size?: number;
}

export const AppLogoSvg: React.FC<Props> = ({ size = 38 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#0066FF" />
          <Stop offset="50%" stopColor="#00A3FF" />
          <Stop offset="100%" stopColor="#00E5FF" />
        </LinearGradient>
        <LinearGradient id="planeGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#FFFFFF" />
          <Stop offset="100%" stopColor="#E2F4FF" />
        </LinearGradient>
        <LinearGradient id="shadowGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#003E99" stopOpacity="0.4" />
          <Stop offset="100%" stopColor="#003E99" stopOpacity="0" />
        </LinearGradient>
      </Defs>

      {/* Rounded squircle container */}
      <Rect
        x="2"
        y="2"
        width="96"
        height="96"
        rx="24"
        fill="url(#logoBg)"
      />

      {/* Subtle outer glow border */}
      <Rect
        x="3"
        y="3"
        width="94"
        height="94"
        rx="23"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeOpacity="0.35"
      />

      {/* Wireless signal arcs */}
      <Path
        d="M 68 28 A 32 32 0 0 1 82 52"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeOpacity="0.85"
      />
      <Path
        d="M 60 36 A 20 20 0 0 1 72 52"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />

      {/* Futuristic 3D Paper Plane */}
      <G>
        {/* Right wing / upper fold */}
        <Path
          d="M 22 56 L 78 24 L 54 80 L 44 60 Z"
          fill="url(#planeGrad)"
        />
        {/* Plane spine / left crease shading */}
        <Path
          d="M 22 56 L 78 24 L 44 60 Z"
          fill="#FFFFFF"
          fillOpacity="0.95"
        />
        {/* Underside fold shadow */}
        <Path
          d="M 44 60 L 54 80 L 52 64 Z"
          fill="#0052CC"
          fillOpacity="0.6"
        />
      </G>

      {/* Connection dot */}
      <Circle cx="82" cy="22" r="4.5" fill="#FFFFFF" />
    </Svg>
  );
};

export default AppLogoSvg;

