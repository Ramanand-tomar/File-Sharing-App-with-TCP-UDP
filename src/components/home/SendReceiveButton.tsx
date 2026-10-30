import { View, StyleSheet, TouchableOpacity } from 'react-native';
import React, { FC } from 'react';
import { screenHeight, screenWidth } from '../../utils/Constants';
import { navigate } from '../../utils/NavigationUtil';
import LinearGradient from 'react-native-linear-gradient';
import CustomText from '../global/CustomText';
import Icon from '../global/Icon';
import { SendIconSvg } from '../svgs/SendIconSvg';
import { ReceiveIconSvg } from '../svgs/ReceiveIconSvg';

const SendReceiveButton: FC = () => {
  return (
    <View style={styles.container}>
      {/* SEND BUTTON CARD */}
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => navigate('SendScreen')}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={['#4F46E5', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.iconCircle}>
            <SendIconSvg size={38} />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <CustomText fontFamily="OKRA-ExtraBold" fontSize={16} color="#FFFFFF">
                Send
              </CustomText>
              <Icon
                name="arrow-forward"
                iconsFamily="Ionicons"
                size={14}
                color="rgba(255, 255, 255, 0.85)"
              />
            </View>
            <CustomText fontFamily="OKRA-Medium" fontSize={10} color="#E0E7FF">
              Select & beam files
            </CustomText>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* RECEIVE BUTTON CARD */}
      <TouchableOpacity
        style={styles.cardContainer}
        onPress={() => navigate('ReceiveScreen')}
        activeOpacity={0.88}
      >
        <LinearGradient
          colors={['#0284C7', '#0EA5E9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.iconCircle}>
            <ReceiveIconSvg size={38} />
          </View>
          <View style={styles.textContainer}>
            <View style={styles.titleRow}>
              <CustomText fontFamily="OKRA-ExtraBold" fontSize={16} color="#FFFFFF">
                Receive
              </CustomText>
              <Icon
                name="download-outline"
                iconsFamily="Ionicons"
                size={14}
                color="rgba(255, 255, 255, 0.85)"
              />
            </View>
            <CustomText fontFamily="OKRA-Medium" fontSize={10} color="#E0F2FE">
              Wait for incoming
            </CustomText>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

export default SendReceiveButton;

const styles = StyleSheet.create({
  container: {
    marginTop: screenHeight * 0.035,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardContainer: {
    flex: 1,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  cardGradient: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    marginTop: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
