import { View, Text, Platform, SafeAreaViewBase, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import React, { FC, useEffect, useState } from 'react';
import RNFS from 'react-native-fs';
import Icon from '../components/global/Icon';
import LinearGradient from 'react-native-linear-gradient';
import { sendStyles } from '../styles/sendStyles';
import CustomText from '../components/global/CustomText';
import { Colors } from '../utils/Constants';
import { connectionStyles } from '../styles/connectionStyles';
import { formatFileSize } from '../utils/libraryHelpers';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { goBack } from '../utils/NavigationUtil';
const ReceivedFileScreen: FC = () => {
  const [receivedFile, setReceivedFile] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const getFilesFromDirectory = async () => {
    setIsLoading(true);
    const platformPath =
      Platform.OS === 'android'
        ? `${RNFS.DownloadDirectoryPath}/`
        : `${RNFS.DocumentDirectoryPath}/`;
    try {
        const exists = await RNFS.exists(platformPath);
        if(!exists){
            setReceivedFile([]);
            setIsLoading(false);
            return;
        }
        const files = await RNFS.readDir(platformPath);
        const formatedFiles = files.map((file) => ({
            id: file.name,
            name: file.name,
            size: file.size,
            uri: file.path,
            mimeType: file.name.split('.').pop() || 'unknown',
        }))
        setReceivedFile(formatedFiles);
        setIsLoading(false);
        
        
    } catch (error) {
        console.error('Error fetching files:', error);
        setReceivedFile([]);
    } finally {
        setIsLoading(false);
    }
  };
  useEffect(() => {
    getFilesFromDirectory();
  }, []);

  const renderThumbnail = (mimeType: string) => {
    switch (mimeType) {
        case 'mp3':
            return <Icon name='musical-notes' size={16} color='blue' iconsFamily='Ionicons'/>;
        case 'mp4':
            return <Icon name='videocam' size={16} color='green' iconsFamily='Ionicons'/>;
        case 'jpg':
            return <Icon name='image' size={16} color='orange' iconsFamily='Ionicons'/>;
        case 'png':
            return <Icon name='image' size={16} color='pink' iconsFamily='Ionicons'/>;
        case 'pdf':
            return <Icon name='document' size={16} color='red' iconsFamily='Ionicons'/>;
        default:
            return <Icon name='folder' size={16} color='grey' iconsFamily='Ionicons'/>    
    }
      
  };

  const renderItem = ({ item }: any) => (
      <View style={connectionStyles.fileItem}>
        <View style={connectionStyles.fileInfoContainer}>
            {renderThumbnail(item?.mimeType)}
            <View>
                <CustomText
                numberOfLines={1}
                fontFamily='OKRA-Bold'
                fontSize={10}
                >
                    {item?.name}
                </CustomText>
                <CustomText
                numberOfLines={1}
                fontFamily='OKRA-Medium'
                fontSize={8}
                >
                    {item.mimeType} -  {formatFileSize(item.size)}
                </CustomText>
            </View>
        </View>

        <TouchableOpacity
        onPress={()=>{
            const normalizedPath = Platform.OS === 'ios' ? `file://${item?.uri}` : item?.uri;
            if(Platform.OS === 'ios'){
                ReactNativeBlobUtil.ios.openDocument(normalizedPath)
                .then(() => {
                    console.log('File opened successfully');
                })
                .catch((error: any) => {
                    console.error('Error opening file:', error);
                })
            }
            else{
                ReactNativeBlobUtil.android
                .actionViewIntent(normalizedPath , '*/*')
                .then(() => {
                    console.log('File opened successfully');
                })
                .catch((error: any) => {
                    console.error('Error opening file:', error);
                })
            }
        }}
        >
            <CustomText
            numberOfLines={1}
            fontFamily='OKRA-Medium'
            fontSize={10}
            >
                Open

            </CustomText>

        </TouchableOpacity>

      </View>
  )





  return (
    <LinearGradient
      colors={['#007Aff', '#80BFFF']}
      start={{ x: 0, y: 1 }}
      end={{ x: 0, y: 0 }}
      style={sendStyles.container}
    >
        <SafeAreaViewBase />
        <View style={sendStyles.mainContainer}>
            <CustomText
            fontFamily='OKRA-Bold'
            fontSize={15}
            color='#fff'
            style={{textAlign:'center' , margin:10}}
            >
                ALL Received Files

            </CustomText>
            {
                isLoading ? (
                    <ActivityIndicator size='small' color={Colors.primary} />
                ):ReceivedFileScreen.length >0 ? (
                    <View>
                        <FlatList
                        data={receivedFile}
                        keyExtractor={item => item.id}
                        renderItem={renderItem}
                        contentContainerStyle={connectionStyles.fileList}
                        />
                    </View>

                ):(
                    <View>
                        <CustomText
                        numberOfLines={1}
                        fontFamily='OKRA-Medium'
                        fontSize={11}
                        >
                            No Files Received

                        </CustomText>
                    </View>

                )
            }

            <TouchableOpacity
            onPress={goBack}
            style={sendStyles.backButton}
            >
                <Icon
                name="arrow-back"
                iconsFamily="Ionicons"
                color="#000"
                size={16}
                />
            </TouchableOpacity>

        </View>
    </LinearGradient>
    
  );
};

export default ReceivedFileScreen;
