import { View, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { bottomTabStyles } from '../../styles/bottomTabStyle';
import Icon from '../global/Icon';
import { navigate } from '../../utils/NavigationUtil';
import QRScannerModel from '../modals/QRScannerModel';

const AbsoluteQRBottom = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <View style={bottomTabStyles.container}>
        <TouchableOpacity
          onPress={() => navigate('HomeScreen')}
          activeOpacity={0.7}
        >
          <Icon
            name="apps-sharp"
            iconsFamily="Ionicons"
            color="#007AFF"
            size={24}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={bottomTabStyles.qrCode}
          onPress={() => setIsVisible(true)}
          activeOpacity={0.85}
        >
          <Icon
            name="qrcode-scan"
            iconsFamily="MaterialCommunityIcons"
            color="#fff"
            size={26}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigate('ReceivedFileScreen')}
          activeOpacity={0.7}
        >
          <Icon
            name="folder-open-outline"
            iconsFamily="Ionicons"
            color="#555"
            size={24}
          />
        </TouchableOpacity>
      </View>
      {isVisible && (
        <QRScannerModel
          visible={isVisible}
          onClose={() => setIsVisible(false)}
        />
      )}
    </>
  );
};

export default AbsoluteQRBottom;
