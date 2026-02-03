import { View, Text, TouchableOpacity } from 'react-native';
import React, { FC } from 'react';
import { optionStyles } from '../../styles/optionsStyles';
import Icon from '../global/Icon';
import { Colors } from '../../utils/Constants';
import CustomText from '../global/CustomText';
import { useTCP } from '../../services/TCPProvider';
import { navigate } from '../../utils/NavigationUtil';
import { on } from 'node:cluster';
import { pickDocument, pickImage } from '../../utils/libraryHelpers';

const Options: FC<{
  isHome?: boolean;
  onMediaPickedUp?: (media: any) => void;
  onFilePickedup?: (file: any) => void;
}> = ({ isHome, onMediaPickedUp, onFilePickedup }) => {

  const {isConnected} = useTCP();

  const handleUniversalPicker = async (type:string) =>{
    if(isHome){
      if(isConnected){
        navigate('ConnectionScreen');
      }
      else{
        navigate('SendScreen');
      }
      return ;
    }
    if(type === 'image' && onMediaPickedUp){
      pickImage(onMediaPickedUp);
    }
    if(type === 'file'&& onFilePickedup){
      pickDocument(onFilePickedup);
    }
  }







  return (
    <View style={optionStyles.container}>
      <TouchableOpacity style={optionStyles.subContainer} onPress={() => handleUniversalPicker('image')}>
        <Icon
          iconsFamily="Ionicons"
          name="images"
          size={20}
          color={Colors.primary}
        />
        <CustomText
        fontFamily='OKRA-Medium'
        style={{marginTop:4 , textAlign:'center'}}
        >
            Photo

        </CustomText>
      </TouchableOpacity>
      <TouchableOpacity style={optionStyles.subContainer} onPress={() => handleUniversalPicker('file')}>
        <Icon
          iconsFamily="Ionicons"
          name="musical-notes-sharp"
          size={20}
          color={Colors.primary}
        />
        <CustomText
        fontFamily='OKRA-Medium'
        style={{marginTop:4 , textAlign:'center'}}
        >
            Audio

        </CustomText>
      </TouchableOpacity>
      <TouchableOpacity style={optionStyles.subContainer} onPress={() => handleUniversalPicker('file')}>
        <Icon
          iconsFamily="Ionicons"
          name="folder-open"
          size={20}
          color={Colors.primary}
        />
        <CustomText
        fontFamily='OKRA-Medium'
        style={{marginTop:4 , textAlign:'center'}}
        >
            Files

        </CustomText>
      </TouchableOpacity>
      <TouchableOpacity style={optionStyles.subContainer} onPress={() => handleUniversalPicker('file')}>
        <Icon
          iconsFamily="MaterialCommunityIcons"
          name="contacts"
          size={20}
          color={Colors.primary}
        />
        <CustomText
        fontFamily='OKRA-Medium'
        style={{marginTop:4 , textAlign:'center'}}
        >
            Contacts

        </CustomText>
      </TouchableOpacity>
    </View>
  );
};

export default Options;
