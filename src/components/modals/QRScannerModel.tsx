import {
  View,
  Text,
  Modal,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from 'react-native';
import React, { FC, useEffect, useMemo, useState } from 'react';
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
import {
  Camera,
  CodeScanner,
  useCameraDevice,
} from 'react-native-vision-camera';
import { check } from 'react-native-permissions';
import { useTCP } from '../../services/TCPProvider';
import { parse } from 'node:path';
import { navigate } from '../../utils/NavigationUtil';
interface ModalProps {
  visible: boolean;
  onClose: () => void;
}

const QRScannerModel: FC<ModalProps> = ({ visible, onClose }) => {

  const {connectToServer , isConnected} = useTCP();
  const [loading, setLoading] = useState(false);
  const [codeFound, setCodeFound] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const device = useCameraDevice('back') as any;
  const shimmerTranslatex = useSharedValue(-300);
  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslatex.value }],
  }));
  useEffect(() => {
    const checkPermission = async () => {
      const cameraPermission = await Camera.requestCameraPermission();
      setHasPermission(cameraPermission === 'granted');
    };
    checkPermission();
    if (visible) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 400);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  useEffect(() => {
    shimmerTranslatex.value = withRepeat(
      withTiming(300, {
        duration: 1500,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  }, [shimmerTranslatex]);

  const handleScan = (data:any)=>{
    const [connectionData , deviceName] = data.replace('tcp://','').split('|');
        const [host, port] = connectionData?.split(':');
        // connection to server
        connectToServer(host , parseInt(port,10) , deviceName);
  }

  const codeScanner = useMemo<CodeScanner>(()=>({
    codeTypes : ['qr' , 'codabar'],
    onCodeScanned: (codes) => {
        if(codeFound){
            return
        }
        console.log(`Scanned code : ${codes.length} codes!`);
        if(codes?.length >0 ){
            const scannedData = codes[0].value;
            console.log(scannedData);
            setCodeFound(true);
            handleScan(scannedData);
        }
    }

  }),[codeFound])

  useEffect(()=>{
    if(isConnected){
        onClose();
        navigate('ConnectionScreen');
    }
  },[isConnected])

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
          {loading ? (
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
            <>
              {!device || !hasPermission ? (
                <View style={modalStyles.skeleton}>
                  <Image
                    style={modalStyles.noCameraImage}
                    source={require('../../assets/images/no_camera.png')}
                  />
                </View>
              ) : (
                <View style={modalStyles.skeleton}>
                  <Camera
                    style={modalStyles.camera}
                    device={device}
                    isActive={visible}
                    codeScanner={codeScanner}
                  />
                </View>
              )}
            </>
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
          onPress={() => onClose()}
          style={modalStyles.closeButton}
        >
          <Icon name="close" iconsFamily="Ionicons" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

export default QRScannerModel;
