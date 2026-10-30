import { StyleSheet } from 'react-native';
import { Colors, screenHeight, screenWidth } from '../utils/Constants';

export const homeHeaderStyles = StyleSheet.create({
  mainContainer: {
    backgroundColor: Colors.primary,
  },
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    zIndex: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  curve: {
    position: 'absolute',
    bottom: -screenHeight * 0.09,
    zIndex: 3,
    width: '100%',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandTextContainer: {
    justifyContent: 'center',
  },
  qrHeaderButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: screenWidth * 0.4,
    height: screenHeight * 0.048,
    resizeMode: 'contain',
  },
  profile: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: 'cover',
  },
});
