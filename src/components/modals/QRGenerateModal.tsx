import { View, Text, Modal, ActivityIndicator, TouchableOpacity } from 'react-native';
import React, { FC, useEffect, useState } from 'react';
import { modalStyles } from '../../styles/modalStyles';
import Animated, {
  useSharedValue,
  Easing,
  useAnimatedStyle,
  withTiming,
  withRepeat,
} from 'react-native-reanimated';
import { LinearGradient } from 'react-native-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { multiColor } from '../../utils/Constants';
import CustomText from '../global/CustomText';
import Icon from '../global/Icon';
import { useTCP } from '../../services/TCPProvider';
import { start } from 'node:repl';
import { getLocalIPAddress } from '../../utils/networkUtils';
import DeviceInfo from 'react-native-device-info';
import { on } from 'node:cluster';
import { navigate } from '../../utils/NavigationUtil';
interface ModalProps {
  visible: boolean;
  onClose: () => void;
}

const QRGenerateModal: FC<ModalProps> = ({ visible, onClose }) => {
  const {isConnected , startServer , server} = useTCP();
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState('Ram');
  const shimmerTranslatex = useSharedValue(-300);
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslatex.value }],
  }));


  const setupServer = async()=>{
    const deviceName = await DeviceInfo.getDeviceName();
    const ip = await getLocalIPAddress();
    const port = 4000;
    if(server){
      const qrValue = `tcp://${ip}:${port}|${deviceName}`;
      setQrCode(qrValue);
      setLoading(false);
      return;
      
    }
    startServer(port);
    const qrValue = `tcp://${ip}:${port}|${deviceName}`;
    setQrCode(qrValue);
    console.log(`Server info : ${ip}:${port}`);
    setLoading(false);
  }







  useEffect(() => {
    shimmerTranslatex.value = withRepeat(
      withTiming(300, {
        duration: 1000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    if (visible) {
      setLoading(true);
      setupServer();
    }
  }, [visible]);


  useEffect(() => {
    console.log('TCPProvider : is connected to ', isConnected);
    if(isConnected){
      onClose();
      navigate('ConnectionScreen');
    }
  })

  return (
    <Modal
      visible={visible}
      onRequestClose={onClose}
      animationType="slide"
      presentationStyle="formSheet"
      onDismiss={onClose}
    >
      <View style={modalStyles.modalContainer}>
        <View style={modalStyles.qrContainer}>
          {loading || qrCode === null || qrCode === '' ? (
            <View style={modalStyles.skeleton}>
              <Animated.View>
                <LinearGradient
                  colors={['#f3f3f3', '#fff', '#f3f3f3']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={modalStyles.shimmerGradient}
                />
              </Animated.View>
            </View>
          ) : (
            <QRCode
              value={qrCode}
              size={250}
              logoSize={60}
              logoBackgroundColor="#fff"
              logoMargin={2}
              logoBorderRadius={10}
              logo={require('../../assets/images/profile2.jpg')}
              linearGradient={multiColor}
              enableLinearGradient
            />
          )}
        </View>
        <View style={modalStyles.info}>
          <CustomText style={modalStyles.infoText1}>
            Ensure you 're on the same Wi-Fi network.
          </CustomText>
          <CustomText style={modalStyles.infoText2}>
            Ask the sender to scan this QR code to connect annd transfer the
            file
          </CustomText>
        </View>
        <ActivityIndicator
          size="small"
          color="#000"
          style={{ alignSelf: 'center' }}
        />
        <TouchableOpacity
          onPress={()=>onClose()}
          style={modalStyles.closeButton}>
          <Icon name="close" iconsFamily='Ionicons' size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default QRGenerateModal;
