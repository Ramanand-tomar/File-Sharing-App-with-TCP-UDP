import { View, Text, Image } from 'react-native'
import React, { FC, useEffect } from 'react'
import { resetAndNavigate } from '../utils/NavigationUtil'
import { commonStyles } from '../styles/commonStyles';

const SplashScreen:FC = () => {

    const navigateToHome = ()=>{
        resetAndNavigate('HomeScreen')
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
          navigateToHome();
        }, 1200);
        return ()=>clearTimeout(timeout);
      }, [])

  return (
    <View style={commonStyles.container}>
      <Image 
      style={commonStyles.img}
      source={require('../assets/images/logo_text.png')}
      />
    </View>
  )
}

export default SplashScreen