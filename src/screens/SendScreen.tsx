import { View, Text, SafeAreaViewBase, Touchable, TouchableOpacity, Image, Easing } from 'react-native';
import React, { useEffect, useState } from 'react';
import { useTCP } from '../services/TCPProvider';
import { Line } from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import { sendStyles } from '../styles/sendStyles';
import QRScannerModel from '../components/modals/QRScannerModel';
import Icon from '../components/global/Icon';
import CustomText from '../components/global/CustomText';
import BreakerText from '../components/ui/BreakerText';
import { Colors, screenWidth } from '../utils/Constants';
import LottieView from 'lottie-react-native';
import Animated from 'react-native-reanimated';
import { goBack, navigate } from '../utils/NavigationUtil';
import dgram from 'react-native-udp';


const devicesNames = [
  'Oppo',
  'Vivo Y21',
  'Redmi',
  'Samsumg S24',
  'iphone 14',
  'OnePlus Nord',
];

const SendScreen = () => {
  const {connectToServer , isConnected} = useTCP();

  const [isScannerVisible, setIsScannerVisible] = useState(false);
  const [nearbyDevices, setNearbyDevices] = useState([]);
  const handleScan = (data:any)=>{
    const [connectionData , deviceName] = data.replace('tcp://','').split('|');
    const [host, port] = connectionData?.split(':');
    // connection to server
    connectToServer(host , parseInt(port,10) , deviceName);
  }

  const handleGoBack = ()=>{
    goBack();
  }

  const listenForDevices = async ()=>{
    const server = dgram.createSocket({
      type: 'udp4',
      reusePort:true
    });
    const port = 57143;
    server.bind(port , ()=>{
      console.log("Listening for nearby devices");
    })
    server.on('message' , (msg , rinfo)=>{
      const [connectionData , otherDevice] = msg?.toString()?.replace('tcp://','').split('|');
      setNearbyDevices((prevDevices:any) => {
        const deviceExists = prevDevices?.some((device:any)=> device?.name === otherDevice);
        if(!deviceExists){
          const newDevice = {
            id : `${Date.now()}_${Math.random()}`,
            name : otherDevice,
            image:require('../assets/icons/device.jpeg'),
            fullAdress : msg?.toString(),
            position : getRandomPosition(150 ,prevDevices?.map((d:any)=> d.position) , 50), // @ts-ignore
            scale:new Animated.Value(0)
          };//@ts-ignore
          Animated.timing(newDevice.scale , {
            toValue:1,
            duration:1000,
            easing:Easing.out(Easing.ease),
            useNativeDriver:true
          }).start();
          return [...prevDevices , newDevice];
         
        }
        return prevDevices;
  
      });
    })
  }

  const getRandomPosition = (
    radius :number,
    existingPositions : {x:number , y:number}[],
    minDistance :number,
  ) => {
    let position :any ;
    let isOverlapping;
    do{
      const angle = Math.random()*360;
      const distance  = Math.random()*(radius-50)+50;
      position = {
        x : distance * Math.cos((angle + Math.PI)/180),
        y : distance * Math.sin((angle + Math.PI)/180),
      };
      isOverlapping = existingPositions.some((existingPosition) => {
        const distance = Math.sqrt(
          (existingPosition.x - position.x) ** 2 +
            (existingPosition.y - position.y) ** 2
        );
        return distance < minDistance;
      });
    }while(isOverlapping);
    return position;

  }

  useEffect(() => {
    if(isConnected){
      navigate('ConnectionScreen');
    }
    
  }, [isConnected]);

  useEffect(() => {
    let udpServer:any ;
    const setupServer = async () => {
      udpServer = await listenForDevices();
    }
    setupServer();
    return ()=>{
      if(udpServer){
        udpServer.close(()=>{
          console.log('udp server closed');
        });
      }
      setNearbyDevices([]);
    }
    
  },[])







  return (
    <LinearGradient
      colors={['#007Aff', '#80BFFF']}
      style={sendStyles.container}
      start={{ x: 0, y: 1}}
      end={{ x: 0, y: 0 }}
    >
      <SafeAreaViewBase />

      <View style={sendStyles.mainContainer}>
        <View style={sendStyles.infoContainer}>

        <Icon
        name='search'
        iconsFamily='Ionicons'
        color='#fff'
        size={40}
        />
        <CustomText
        fontFamily='OKRA-Bold'
        fontSize={16}
        color='#fff'
        style={{textAlign:'center'}}
        >
          Ensure your device's hotspot is acitve and the receiver device is connected to it
        </CustomText>
        <BreakerText text='Or' />
        <TouchableOpacity onPress={() => setIsScannerVisible(true)}>
          <Icon
          name='qrcode-scan'
          iconsFamily='MaterialCommunityIcons'
          color={Colors.primary}
          size={16}
          />
          <CustomText
          fontFamily='OKRA-Bold'
          color={Colors.primary}
          >Scan QR</CustomText>
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
            {
              nearbyDevices?.map((device:any , index)=>(
                <Animated.View
                key={index}
                style={[
                  sendStyles.deviceDot,
                  { 
                    transform: [{scale: device.scale}],
                    left: screenWidth/2.33 + device.position?.x,
                    top: screenWidth / 2.2 + device.position?.y
                  }
                ]}
                 >
                  <TouchableOpacity
                  onPress={()=>handleScan(device?.fullAdress)}
                  style={sendStyles.popup}
                  >
                    <Image
                    source={device.image}
                    style={sendStyles.deviceImage}
                     />
                     <CustomText
                     fontFamily='OKRA-Bold'
                     color='#333'
                     fontSize={8}
                     style={sendStyles.deviceText}
                     >{device.name}</CustomText>
                  </TouchableOpacity>

                </Animated.View>
              ))
            }
          </View>
          <Image
          source={require('../assets/images/profile.jpg')}
          style={sendStyles.profileImage}
           />
        </View>
        <TouchableOpacity onPress={handleGoBack} style={sendStyles.backButton}>
          <Icon 
          name='arrow-back'
          iconsFamily='Ionicons'
          color='#000'
          size={16}
           />
        </TouchableOpacity>

      </View>

      {
        isScannerVisible && (
          <QRScannerModel
            visible={isScannerVisible}
            onClose={() => setIsScannerVisible(false)}
          />
        )
      }
    </LinearGradient>
  );
};

export default SendScreen;
