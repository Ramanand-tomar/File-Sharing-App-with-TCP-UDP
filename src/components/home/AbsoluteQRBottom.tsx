import { View, Text, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { bottomTabStyles } from '../../styles/bottomTabStyle';
import Icon from '../global/Icon';
import { navigate } from '../../utils/NavigationUtil';
import QRGenerateModal from '../modals/QRGenerateModal';
import QRScannerModel from '../modals/QRScannerModel';

const AbsoluteQRBottom = () => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <>
      <View style={bottomTabStyles.container}>
        <TouchableOpacity
          onPress={() => navigate('ReceivedFileScreen')}
        >
          <Icon
            name="apps-sharp"
            iconsFamily="Ionicons"
            color="#333"
            size={24}
          />
        </TouchableOpacity>
        <TouchableOpacity
        style={bottomTabStyles.qrCode}
          onPress={() => setIsVisible(true)}
        >
          <Icon
            name="qrcode-scan"
            iconsFamily="MaterialCommunityIcons"
            color="#fff"
            size={26}
          />
        </TouchableOpacity>
        <TouchableOpacity
          
        >
          <Icon
            name="beer-sharp"
            iconsFamily="Ionicons"
            color="#333"
            size={24}
          />
        </TouchableOpacity>
      </View>
      {
        isVisible && (
          <QRScannerModel
            visible={isVisible}
            onClose={() => setIsVisible(false)}
          />
        )
      }
    </>
  );
};

export default AbsoluteQRBottom;
