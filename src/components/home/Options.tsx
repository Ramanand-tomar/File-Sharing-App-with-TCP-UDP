import { View, TouchableOpacity } from 'react-native';
import React, { FC } from 'react';
import { optionStyles } from '../../styles/optionsStyles';
import Icon from '../global/Icon';
import CustomText from '../global/CustomText';
import { useTCP } from '../../services/TCPProvider';
import { navigate } from '../../utils/NavigationUtil';
import { pickDocument, pickImage } from '../../utils/libraryHelpers';

const Options: FC<{
  isHome?: boolean;
  onMediaPickedUp?: (media: any) => void;
  onFilePickedup?: (file: any) => void;
}> = ({ isHome, onMediaPickedUp, onFilePickedup }) => {
  const { isConnected } = useTCP();

  const handleUniversalPicker = async (type: string) => {
    if (isHome) {
      if (isConnected) {
        navigate('ConnectionScreen');
      } else {
        navigate('SendScreen');
      }
      return;
    }
    if (type === 'image' && onMediaPickedUp) {
      pickImage(onMediaPickedUp);
    }
    if (type === 'file' && onFilePickedup) {
      pickDocument(onFilePickedup);
    }
  };

  return (
    <View style={optionStyles.container}>
      {/* Photos */}
      <TouchableOpacity
        style={optionStyles.subContainer}
        onPress={() => handleUniversalPicker('image')}
        activeOpacity={0.7}
      >
        <View style={[optionStyles.iconBadge, { backgroundColor: '#F3E8FF' }]}>
          <Icon
            iconsFamily="Ionicons"
            name="images"
            size={22}
            color="#9333EA"
          />
        </View>
        <CustomText fontFamily="OKRA-Bold" fontSize={11} color="#334155">
          Photos
        </CustomText>
      </TouchableOpacity>

      {/* Audio */}
      <TouchableOpacity
        style={optionStyles.subContainer}
        onPress={() => handleUniversalPicker('file')}
        activeOpacity={0.7}
      >
        <View style={[optionStyles.iconBadge, { backgroundColor: '#FEF3C7' }]}>
          <Icon
            iconsFamily="Ionicons"
            name="musical-notes"
            size={22}
            color="#D97706"
          />
        </View>
        <CustomText fontFamily="OKRA-Bold" fontSize={11} color="#334155">
          Audio
        </CustomText>
      </TouchableOpacity>

      {/* Files */}
      <TouchableOpacity
        style={optionStyles.subContainer}
        onPress={() => handleUniversalPicker('file')}
        activeOpacity={0.7}
      >
        <View style={[optionStyles.iconBadge, { backgroundColor: '#DBEAFE' }]}>
          <Icon
            iconsFamily="Ionicons"
            name="folder-open"
            size={22}
            color="#2563EB"
          />
        </View>
        <CustomText fontFamily="OKRA-Bold" fontSize={11} color="#334155">
          Files
        </CustomText>
      </TouchableOpacity>

      {/* Documents / Contacts */}
      <TouchableOpacity
        style={optionStyles.subContainer}
        onPress={() => handleUniversalPicker('file')}
        activeOpacity={0.7}
      >
        <View style={[optionStyles.iconBadge, { backgroundColor: '#D1FAE5' }]}>
          <Icon
            iconsFamily="Ionicons"
            name="document-text"
            size={22}
            color="#059669"
          />
        </View>
        <CustomText fontFamily="OKRA-Bold" fontSize={11} color="#334155">
          Docs
        </CustomText>
      </TouchableOpacity>
    </View>
  );
};

export default Options;
