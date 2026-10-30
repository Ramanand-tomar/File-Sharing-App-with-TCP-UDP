import { SafeAreaView } from 'react-native-safe-area-context';
import { View, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { homeHeaderStyles } from '../../styles/homeHeaderStyles';
import Icon from '../global/Icon';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { screenHeight, screenWidth, svgPath } from '../../utils/Constants';
import QRGenerateModal from '../modals/QRGenerateModal';
import { AppLogoSvg } from '../svgs/AppLogoSvg';
import CustomText from '../global/CustomText';

const HomeHeader = () => {
  const [isVisible, setVisible] = useState(false);

  return (
    <View style={homeHeaderStyles.mainContainer}>
      <SafeAreaView />
      <View style={homeHeaderStyles.container}>
        <View style={homeHeaderStyles.brandContainer}>
          <AppLogoSvg size={38} />
          <View style={homeHeaderStyles.brandTextContainer}>
            <CustomText fontFamily="OKRA-ExtraBold" fontSize={18} color="#ffffff">
              AirShare
            </CustomText>
            <CustomText fontFamily="OKRA-Medium" fontSize={9} color="#E0F2FE">
              Ultra Fast P2P Transfer
            </CustomText>
          </View>
        </View>

        <TouchableOpacity
          style={homeHeaderStyles.qrHeaderButton}
          onPress={() => setVisible(true)}
          activeOpacity={0.8}
        >
          <Icon iconsFamily="Ionicons" name="qr-code-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <Svg
        height={screenHeight * 0.18}
        width={screenWidth}
        viewBox="0 0 1440 220"
        style={homeHeaderStyles.curve}
      >
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#007Aff" stopOpacity="1" />
            <Stop offset="100%" stopColor="#80BFFF" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Path fill="#80BFFF" d={svgPath} />
        <Path fill="url(#grad)" d={svgPath} />
      </Svg>

      {isVisible && (
        <QRGenerateModal
          visible={isVisible}
          onClose={() => setVisible(false)}
        />
      )}
    </View>
  );
};

export default HomeHeader;
