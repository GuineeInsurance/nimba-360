import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg';

import { Colors } from '@/constants/colors';

export type AppIconName =
  | 'home'
  | 'search'
  | 'heart'
  | 'profile'
  | 'restaurant'
  | 'health'
  | 'car'
  | 'hotel'
  | 'services'
  | 'filter'
  | 'location'
  | 'verified'
  | 'phone'
  | 'whatsapp'
  | 'route'
  | 'share'
  | 'cloud'
  | 'star';

type AppIconProps = {
  name: AppIconName;
  size?: number;
  color?: string;
  accent?: string;
  filled?: boolean;
};

export function AppIcon({
  name,
  size = 24,
  color = Colors.navy,
  accent = Colors.red,
  filled = false,
}: AppIconProps) {
  const stroke = {
    fill: 'none',
    stroke: color,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    strokeWidth: 1.8,
  };

  return (
    <Svg accessibilityRole="image" height={size} viewBox="0 0 24 24" width={size}>
      {name === 'home' && (
        <>
          <Path d="M3.5 10.8 12 3.9l8.5 6.9" {...stroke} />
          <Path d="M5.6 9.6v9.8h12.8V9.6M9.4 19.4v-5.8h5.2v5.8" {...stroke} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx="10.4" cy="10.4" r="6.2" {...stroke} />
          <Line x1="15.1" x2="20.2" y1="15.1" y2="20.2" {...stroke} />
          <Path d="M7.8 10.4a2.6 2.6 0 0 1 2.6-2.6" {...stroke} stroke={accent} />
        </>
      )}
      {name === 'heart' && (
        <Path
          d="M12 20.1s-7.7-4.5-8.8-9.2C2.4 7.4 4.5 4.4 8 4.4c1.8 0 3.2.9 4 2.2.8-1.3 2.2-2.2 4-2.2 3.5 0 5.6 3 4.8 6.5C19.7 15.6 12 20.1 12 20.1Z"
          fill={filled ? accent : 'none'}
          stroke={filled ? accent : color}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.8"
        />
      )}
      {name === 'profile' && (
        <>
          <Circle cx="12" cy="8.2" r="3.5" {...stroke} />
          <Path d="M5.2 19.8c.7-3.4 3.2-5.4 6.8-5.4s6.1 2 6.8 5.4" {...stroke} />
        </>
      )}
      {name === 'restaurant' && (
        <>
          <Path d="M6 3.7v6.1M3.8 3.7v4.2c0 1.3.9 2.2 2.2 2.2s2.2-.9 2.2-2.2V3.7M6 10.1v10.2" {...stroke} />
          <Path d="M16.8 3.7c-2 1-3.1 3.1-3.1 5.6v2.4h4.4M16.8 3.7v16.6" {...stroke} />
          <Circle cx="18.7" cy="17.7" fill={accent} r="1.25" />
        </>
      )}
      {name === 'health' && (
        <>
          <Path d="M12 20s-7.5-4.4-8.5-9c-.8-3.3 1.3-6.1 4.5-6.1 1.8 0 3.2 1 4 2.3.8-1.3 2.2-2.3 4-2.3 3.2 0 5.3 2.8 4.5 6.1C19.5 15.6 12 20 12 20Z" {...stroke} />
          <Path d="M9.2 12h5.6M12 9.2v5.6" {...stroke} stroke={accent} />
        </>
      )}
      {name === 'car' && (
        <>
          <Path d="m4.2 13 1.5-5h12.6l1.5 5M3.5 13h17v5.2h-17z" {...stroke} />
          <Circle cx="7" cy="15.6" fill={accent} r="1.2" />
          <Circle cx="17" cy="15.6" fill={accent} r="1.2" />
          <Path d="M5.8 18.2v2M18.2 18.2v2" {...stroke} />
        </>
      )}
      {name === 'hotel' && (
        <>
          <Path d="M3.5 19.8V5.1h11.2v14.7M14.7 10.2h5.8v9.6M2.6 19.8h18.8" {...stroke} />
          <Path d="M7 8h1M11.1 8h1M7 11.7h1M11.1 11.7h1M17.2 13.4h1" {...stroke} stroke={accent} />
        </>
      )}
      {name === 'services' && (
        <>
          <Rect height="6.2" rx="1.7" width="6.2" x="3.7" y="3.7" {...stroke} />
          <Rect height="6.2" rx="1.7" width="6.2" x="14.1" y="3.7" {...stroke} />
          <Rect height="6.2" rx="1.7" width="6.2" x="3.7" y="14.1" {...stroke} />
          <Rect fill={accent} height="6.2" rx="1.7" stroke={accent} width="6.2" x="14.1" y="14.1" />
        </>
      )}
      {name === 'filter' && (
        <>
          <Line x1="4" x2="20" y1="6.5" y2="6.5" {...stroke} />
          <Line x1="4" x2="20" y1="12" y2="12" {...stroke} />
          <Line x1="4" x2="20" y1="17.5" y2="17.5" {...stroke} />
          <Circle cx="9" cy="6.5" fill={accent} r="1.7" />
          <Circle cx="15.4" cy="12" fill={accent} r="1.7" />
          <Circle cx="11.5" cy="17.5" fill={accent} r="1.7" />
        </>
      )}
      {name === 'location' && (
        <>
          <Path d="M19 10c0 5.2-7 10.2-7 10.2S5 15.2 5 10a7 7 0 1 1 14 0Z" {...stroke} />
          <Circle cx="12" cy="10" fill={accent} r="2.2" />
        </>
      )}
      {name === 'verified' && (
        <>
          <Circle cx="12" cy="12" fill={filled ? color : 'none'} r="9" stroke={color} strokeWidth="1.8" />
          <Polyline points="8,12.2 10.8,15 16.4,9.3" {...stroke} stroke={filled ? Colors.white : accent} />
        </>
      )}
      {name === 'phone' && (
        <Path d="M7.1 3.8 4.5 5.3c-.8.5-.9 1.6-.6 2.5 2.1 6 6.3 10.2 12.3 12.3.9.3 2 .2 2.5-.6l1.5-2.6-4.7-3-1.8 2.1c-2.6-1.2-4.5-3.1-5.7-5.7l2.1-1.8-3-4.7Z" {...stroke} />
      )}
      {name === 'whatsapp' && (
        <>
          <Path d="M5.2 18.8 6 16a7.6 7.6 0 1 1 2.3 2.1l-3.1.7Z" {...stroke} />
          <Path d="M9 8.2c.7 3.2 2.7 5.2 5.9 5.9" {...stroke} stroke={accent} />
        </>
      )}
      {name === 'route' && (
        <>
          <Path d="M5 18.8c0-2.5 1.5-3.8 3.8-3.8h5.7c2.7 0 4.5-1.5 4.5-4.1 0-1.8-1-3.1-2.7-3.8" {...stroke} />
          <Circle cx="5" cy="18.8" fill={accent} r="2" />
          <Path d="m13.9 6.9 3-2.1 2.7 2.6" {...stroke} />
        </>
      )}
      {name === 'share' && (
        <>
          <Circle cx="6" cy="12" r="2.2" {...stroke} />
          <Circle cx="18" cy="6" fill={accent} r="2.2" stroke={accent} />
          <Circle cx="18" cy="18" r="2.2" {...stroke} />
          <Line x1="8" x2="16" y1="11" y2="7" {...stroke} />
          <Line x1="8" x2="16" y1="13" y2="17" {...stroke} />
        </>
      )}
      {name === 'cloud' && (
        <>
          <Path d="M7.2 18.2h10.4a4 4 0 0 0 .6-8 6.2 6.2 0 0 0-11.7-1.6 4.8 4.8 0 0 0 .7 9.6Z" {...stroke} />
          <Path d="M9.3 13.3h5.4M12 10.6V16" {...stroke} stroke={accent} />
        </>
      )}
      {name === 'star' && (
        <Path
          d="m12 3.3 2.6 5.3 5.9.9-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9-4.3-4.1 5.9-.9L12 3.3Z"
          fill={filled ? accent : 'none'}
          stroke={filled ? accent : color}
          strokeLinejoin="round"
          strokeWidth="1.6"
        />
      )}
    </Svg>
  );
}
