import {
  View,
  Text,
  SafeAreaViewBase,
  Touchable,
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
} from '../utils/networkUtils';
import dgram from 'react-native-udp';

const ReceiveScreen: FC = () => {
  const { startServer, server, isConnected } = useTCP();
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
    const qrValue = `tcp://${ip}:${port}|${deviceName}`;
    setQrvalue(qrValue);
    console.log(`Server info : ${ip}:${port}`);
  };

  const sendDiscoverySignal = async () => {
    const deviceName = await DeviceInfo.getDeviceName();
    const broadcastAddress = await getBroadcastIPAddress();
    const targetAddesss = broadcastAddress || '255.255.255.255';
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
        client.send(
          `${qrvalue}`,
          0,
          `${qrvalue}`.length,
          port,
          targetAddesss,
          err => {
            if (err) {
              console.error('Error sending discovery signal:', err);
              return;
            } else {
              console.log(
                `${deviceName} sent discovery signal to ${targetAddesss}:${port}`,
              );
            }
            client.close();
          },
        );
      } catch (error) {
        console.log('failed to set broadcast or send', error);
        client.close();
      }
    });
  };

  useEffect(() => {
    if(!qrvalue) return;
    sendDiscoverySignal();
    intervalRef.current = setInterval(() => {
      sendDiscoverySignal();
    }, 3000);
    return () => {
      if(intervalRef.current){
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [qrvalue]);

  const handleGoBack = () => {
    if(intervalRef.current){
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    goBack();
  }
    

  useEffect(() => {
    if (isConnected) {
      if(intervalRef.current){
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      navigate("ConnectionScreen");
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
      <SafeAreaViewBase />
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
            Ensure your device is connected to the sender's hotspot network
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
              Scan QR
            </CustomText>
          </TouchableOpacity>
        </View>

        <View style={sendStyles.animationContainer}>
          <View style={sendStyles.lottieContainer}>
            <LottieView
              style={sendStyles.lottie}
              source={require('../../assets/animations/scan2.json')}
              autoPlay
              loop={true}
              hardwareAccelerationAndroid
            />
          </View>
          <Image
            source={require('../assets/images/profile2.jpg')}
            style={sendStyles.profileImage}
          />
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
