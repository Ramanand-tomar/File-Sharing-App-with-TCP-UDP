import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Easing,
  Animated,
} from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTCP } from '../services/TCPProvider';
import LinearGradient from 'react-native-linear-gradient';
import { sendStyles } from '../styles/sendStyles';
import QRScannerModel from '../components/modals/QRScannerModel';
import Icon from '../components/global/Icon';
import CustomText from '../components/global/CustomText';
import BreakerText from '../components/ui/BreakerText';
import { Colors, screenWidth } from '../utils/Constants';
import LottieView from 'lottie-react-native';
import { goBack, navigate } from '../utils/NavigationUtil';
import dgram from 'react-native-udp';
import { parseConnectionPayload } from '../utils/networkUtils';
import { DeviceRadarCoreSvg } from '../components/svgs/DeviceRadarCoreSvg';

const SendScreen = () => {
  const { connectToServer, isConnected } = useTCP();

  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState<any[]>([]);

  const handleScan = (data: any) => {
    const target = parseConnectionPayload(data);
    if (target) {
      console.log(`[SendScreen] Connecting to ${target.host}:${target.port} (${target.deviceName})`);
      connectToServer(target.host, target.port, target.deviceName);
    } else {
      console.warn('[SendScreen] Could not parse connection target:', data);
    }
  };

  const handleGoBack = () => {
    goBack();
  };

  const listenForDevices = () => {
    const server = dgram.createSocket({
      type: 'udp4',
      reusePort: true,
    });
    const port = 57143;

    server.bind(port, () => {
      console.log('[SendScreen] Listening for nearby devices on port', port);
    });

    server.on('message', (msg, rinfo) => {
      const rawMsg = msg?.toString() || '';
      const target = parseConnectionPayload(rawMsg);
      if (!target) return;

      setNearbyDevices((prevDevices: any[]) => {
        const deviceExists = prevDevices?.some(
          (device: any) => device?.name === target.deviceName,
        );
        if (!deviceExists) {
          const newDevice = {
            id: `${Date.now()}_${Math.random()}`,
            name: target.deviceName,
            host: target.host,
            port: target.port,
            image: require('../assets/icons/device.jpeg'),
            fullAdress: rawMsg,
            position: getRandomPosition(
              150,
              prevDevices?.map((d: any) => d.position),
              50,
            ),
            scale: new Animated.Value(0),
          };

          Animated.timing(newDevice.scale, {
            toValue: 1,
            duration: 1000,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }).start();

          return [...prevDevices, newDevice];
        }
        return prevDevices;
      });
    });

    server.on('error', err => {
      console.warn('[SendScreen] UDP server error:', err);
    });

    return server;
  };

  const getRandomPosition = (
    radius: number,
    existingPositions: { x: number; y: number }[],
    minDistance: number,
  ) => {
    let position: any;
    let isOverlapping;
    let attempts = 0;
    do {
      const angle = Math.random() * 360;
      const distance = Math.random() * (radius - 50) + 50;
      position = {
        x: distance * Math.cos(((angle + Math.PI) * Math.PI) / 180),
        y: distance * Math.sin(((angle + Math.PI) * Math.PI) / 180),
      };
      isOverlapping = existingPositions?.some(existingPosition => {
        if (!existingPosition) return false;
        const dist = Math.sqrt(
          (existingPosition.x - position.x) ** 2 +
            (existingPosition.y - position.y) ** 2,
        );
        return dist < minDistance;
      });
      attempts++;
    } while (isOverlapping && attempts < 20);

    return position;
  };

  useEffect(() => {
    if (isConnected) {
      navigate('ConnectionScreen');
    }
  }, [isConnected]);

  useEffect(() => {
    let udpServer: any;
    try {
      udpServer = listenForDevices();
    } catch (e) {
      console.warn('[SendScreen] Error starting UDP listener:', e);
    }

    return () => {
      if (udpServer) {
        try {
          udpServer.close();
          console.log('[SendScreen] UDP listener closed');
        } catch (e) {
          console.warn('[SendScreen] Error closing UDP server:', e);
        }
      }
      setNearbyDevices([]);
    };
  }, []);

  return (
    <LinearGradient
      colors={['#007Aff', '#80BFFF']}
      style={sendStyles.container}
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 0 }}
    >
      <SafeAreaView />

      <View style={sendStyles.mainContainer}>
        <View style={sendStyles.infoContainer}>
          <Icon name="search" iconsFamily="Ionicons" color="#fff" size={40} />
          <CustomText
            fontFamily="OKRA-Bold"
            fontSize={16}
            color="#fff"
            style={{ textAlign: 'center' }}
          >
            Ensure both devices are on the same Wi-Fi or Personal Hotspot
          </CustomText>
          <BreakerText text="Or" />
          <TouchableOpacity onPress={() => setIsScannerVisible(true)}>
            <Icon
              name="qrcode-scan"
              iconsFamily="MaterialCommunityIcons"
              color={Colors.primary}
              size={16}
            />
            <CustomText fontFamily="OKRA-Bold" color={Colors.primary}>
              Scan QR
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={sendStyles.animationContainer}>
          <View style={sendStyles.lottieContainer}>
            <LottieView
              style={sendStyles.lottie}
              source={require('../assets/animations/scanner.json')}
              autoPlay
              loop={true}
              hardwareAccelerationAndroid
            />
            {nearbyDevices?.map((device: any, index) => (
              <Animated.View
                key={device.id || index}
                style={[
                  sendStyles.deviceDot,
                  {
                    transform: [{ scale: device.scale }],
                    left: screenWidth / 2.33 + (device.position?.x || 0),
                    top: screenWidth / 2.2 + (device.position?.y || 0),
                  },
                ]}
              >
                <TouchableOpacity
                  onPress={() => handleScan(device?.fullAdress)}
                  style={sendStyles.popup}
                >
                  <Image
                    source={device.image}
                    style={sendStyles.deviceImage}
                  />
                  <CustomText
                    fontFamily="OKRA-Bold"
                    color="#333"
                    fontSize={8}
                    style={sendStyles.deviceText}
                  >
                    {device.name}
                  </CustomText>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          <View style={{ zIndex: 5 }}>
            <DeviceRadarCoreSvg size={62} />
          </View>
        </View>
        <TouchableOpacity onPress={handleGoBack} style={sendStyles.backButton}>
          <Icon
            name="arrow-back"
            iconsFamily="Ionicons"
            color="#000"
            size={16}
          />
        </TouchableOpacity>
      </View>

      {isScannerVisible && (
        <QRScannerModel
          visible={isScannerVisible}
          onClose={() => setIsScannerVisible(false)}
        />
      )}
    </LinearGradient>
  );
};

export default SendScreen;
