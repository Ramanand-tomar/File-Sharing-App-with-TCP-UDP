import { View, Text, StyleSheet, Image } from 'react-native'
import React from 'react'
import CustomText from '../global/CustomText'
import { commonStyles } from '../../styles/commonStyles'

const Misc = () => {
  return (
    <View style={styles.container} >
      <CustomText fontSize={13}  fontFamily='OKRA-Bold'>
        Explore
      </CustomText>
      <Image 
      style={styles.adBanner}
      source={require('../../assets/icons/wild_robot.jpg')}
      />

      <View style={commonStyles.flexRowBetween}>
        <CustomText style={styles.text} fontSize={22}  fontFamily='OKRA-Bold'>
          World best File Sharing App
        </CustomText>
        <Image 
        style={styles.image}
        source={require('../../assets/icons//share_logo.jpg')}
        />
      </View>

      <CustomText style={styles.text2} fontSize={13}  fontFamily='OKRA-Bold'>
        Share your files with your friends
      </CustomText> 


    </View>
  )
}

export default Misc

const styles = StyleSheet.create({
    container : {
        paddingVertical:20
    },
    adBanner: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
        borderRadius: 10,
        marginVertical: 25
    },
    text:{
        opacity: 0.5,
        width: '60%'
    },
    text2:{
        opacity: 0.5,
        marginTop: 10
    },
    image:{
        resizeMode: 'contain',
        width: '35%',
        height: 120,
    }
    
});