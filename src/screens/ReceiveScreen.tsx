import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import React, { FC, useEffect, useRef, useState } from 'react';
import LinearGradient from 'react-native-linear-gradient';
import { sendStyles } from '../styles/sendStyles';
import Icon from '../components/global/Icon';
import CustomText from '../components/global/CustomText';
import BreakerText from '../components/ui/BreakerText';
import { Colors } from '../utils/Constants';
import LottieView from 'lottie-react-native';
import QRGenerateModal from '../components/modals/QRGenerateModal';
import DeviceInfo from 'react-native-device-info';
import { goBack, navigate } from '../utils/NavigationUtil';
import { useTCP } from '../services/TCPProvider';
import {
  getBroadcastIPAddress,
  getLocalIPAddress,
  createDiscoveryBeacon,
} from '../utils/networkUtils';
import dgram from 'react-native-udp';
import { Buffer } from 'buffer';
import { DeviceRadarCoreSvg } from '../components/svgs/DeviceRadarCoreSvg';

const ReceiveScreen: FC = () => {
  const { startServer, server, isConnected, disconnect } = useTCP();
  const [qrvalue, setQrvalue] = useState('');
  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const setupServer = async () => {
    const deviceName = await DeviceInfo.getDeviceName();
    const ip = await getLocalIPAddress();
    const port = 4000;
    if (!server) {
      startServer(port);
    }
    const beacon = createDiscoveryBeacon(ip, port, deviceName);
    setQrvalue(beacon);
    console.log(`[ReceiveScreen] Server active at ${ip}:${port}`);
  };

  const sendDiscoverySignal = async () => {
    if (!qrvalue) return;

    try {
      const broadcastAddress = await getBroadcastIPAddress();
      const targetAddress = broadcastAddress || '255.255.255.255';
      const port = 57143;
      const client = dgram.createSocket({
        type: 'udp4',
        reusePort: true,
      });

      client.bind(() => {
        try {
          if (Platform.OS === 'ios') {
            client.setBroadcast(true);
          }
          const buf = Buffer.from(qrvalue, 'utf8');
          client.send(
            buf,
            0,
            buf.length,
            port,
            targetAddress,
            err => {
              if (err) {
                console.warn('[ReceiveScreen] Error sending discovery broadcast:', err);
              }
              client.close();
            },
          );
        } catch (error) {
          console.warn('[ReceiveScreen] Error in UDP client send:', error);
          client.close();
        }
      });
    } catch (e) {
      console.warn('[ReceiveScreen] UDP broadcast exception:', e);
    }
  };

  useEffect(() => {
    if (!qrvalue) return;
    sendDiscoverySignal();
    intervalRef.current = setInterval(() => {
      sendDiscoverySignal();
    }, 3000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [qrvalue]);

  const handleGoBack = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    disconnect();
    goBack();
  };

  useEffect(() => {
    if (isConnected) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      navigate('ConnectionScreen');
    }
  }, [isConnected]);

  useEffect(() => {
    setupServer();
  }, []);

  return (
    <LinearGradient
      colors={['#007Aff', '#80BFFF']}
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 1 }}
      style={sendStyles.container}
    >
      <SafeAreaView />
      <View style={sendStyles.mainContainer}>
        <View style={sendStyles.infoContainer}>
          <Icon
            name="blur-on"
            iconsFamily="MaterialIcons"
            color="#fff"
            size={40}
          />
          <CustomText
            fontFamily="OKRA-Bold"
            color="#fff"
            style={{ marginTop: 20 }}
            fontSize={16}
          >
            Receiving from nearby devices
          </CustomText>

          <CustomText
            fontFamily="OKRA-Medium"
            color="#fff"
            style={{ textAlign: 'center' }}
            fontSize={12}
          >
            Ensure your device is connected to the same Wi-Fi or Hotspot network
          </CustomText>
          <BreakerText text="OR" />

          <TouchableOpacity
            style={sendStyles.qrButton}
            onPress={() => setIsScannerVisible(true)}
          >
            <Icon
              name="qrcode"
              iconsFamily="MaterialCommunityIcons"
              color={Colors.primary}
              size={16}
            />
            <CustomText fontFamily="OKRA-Bold" color={Colors.primary}>
              Generate QR
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={sendStyles.animationContainer}>
          <View style={sendStyles.lottieContainer}>
            <LottieView
              style={sendStyles.lottie}
              source={require('../assets/animations/scan2.json')}
              autoPlay
              loop={true}
              hardwareAccelerationAndroid
            />
          </View>
          <View style={{ zIndex: 5 }}>
            <DeviceRadarCoreSvg size={62} />
          </View>
        </View>
        <TouchableOpacity style={sendStyles.backButton} onPress={handleGoBack}>
          <Icon
            name="arrow-back"
            iconsFamily="Ionicons"
            color="#000"
            size={16}
          />
        </TouchableOpacity>
      </View>

      {isScannerVisible && (
        <QRGenerateModal
          visible={isScannerVisible}
          onClose={() => setIsScannerVisible(false)}
        />
      )}
    </LinearGradient>
  );
};

export default ReceiveScreen;
