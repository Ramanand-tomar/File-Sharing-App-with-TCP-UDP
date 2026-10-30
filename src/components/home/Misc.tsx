import { View, StyleSheet, TouchableOpacity } from 'react-native';
import React, { FC, useEffect, useState } from 'react';
import CustomText from '../global/CustomText';
import Icon from '../global/Icon';
import DeviceInfo from 'react-native-device-info';
import { getLocalIPAddress } from '../../utils/networkUtils';
import { SecurityShieldSvg } from '../svgs/SecurityShieldSvg';
import LinearGradient from 'react-native-linear-gradient';

const Misc: FC = () => {
  const [deviceName, setDeviceName] = useState('My Device');
  const [deviceIp, setDeviceIp] = useState('192.168.1.x');

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const name = await DeviceInfo.getDeviceName();
        const ip = await getLocalIPAddress();
        setDeviceName(name);
        setDeviceIp(ip);
      } catch (e) {
        console.warn('[Misc] Error reading device info:', e);
      }
    };
    fetchInfo();
  }, []);

  return (
    <View style={styles.container}>
      {/* SECTION HEADER */}
      <View style={styles.sectionHeader}>
        <CustomText fontFamily="OKRA-ExtraBold" fontSize={14} color="#1E293B">
          Device & Network Status
        </CustomText>
        <View style={styles.liveIndicator}>
          <View style={styles.greenDot} />
          <CustomText fontFamily="OKRA-Bold" fontSize={10} color="#059669">
            Active
          </CustomText>
        </View>
      </View>

      {/* DEVICE STATUS CARD */}
      <LinearGradient
        colors={['#F8FAFC', '#F1F5F9']}
        style={styles.statusCard}
      >
        <View style={styles.statusRow}>
          <View style={styles.deviceInfoContainer}>
            <View style={styles.phoneIconCircle}>
              <Icon
                name="phone-portrait-outline"
                iconsFamily="Ionicons"
                size={20}
                color="#2563EB"
              />
            </View>
            <View>
              <CustomText fontFamily="OKRA-Bold" fontSize={13} color="#0F172A">
                {deviceName}
              </CustomText>
              <CustomText fontFamily="OKRA-Medium" fontSize={10} color="#64748B">
                IP: {deviceIp}
              </CustomText>
            </View>
          </View>
          <SecurityShieldSvg size={28} />
        </View>

        <View style={styles.divider} />

        <View style={styles.securityRow}>
          <Icon
            name="lock-closed"
            iconsFamily="Ionicons"
            size={12}
            color="#059669"
          />
          <CustomText fontFamily="OKRA-Medium" fontSize={10} color="#059669">
            TLS 1.3 Direct P2P Encryption · No Cloud Server
          </CustomText>
        </View>
      </LinearGradient>

      {/* FEATURE PILLS */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconBadge, { backgroundColor: '#EFF6FF' }]}>
            <Icon
              name="flash"
              iconsFamily="Ionicons"
              size={18}
              color="#2563EB"
            />
          </View>
          <View>
            <CustomText fontFamily="OKRA-Bold" fontSize={11} color="#0F172A">
              Direct Wi-Fi Speed
            </CustomText>
            <CustomText fontFamily="OKRA-Medium" fontSize={9} color="#64748B">
              Up to 50 MB/s transfer
            </CustomText>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIconBadge, { backgroundColor: '#F0FDF4' }]}>
            <Icon
              name="infinite"
              iconsFamily="Ionicons"
              size={18}
              color="#16A34A"
            />
          </View>
          <View>
            <CustomText fontFamily="OKRA-Bold" fontSize={11} color="#0F172A">
              No File Size Limits
            </CustomText>
            <CustomText fontFamily="OKRA-Medium" fontSize={9} color="#64748B">
              Chunked disk streaming
            </CustomText>
          </View>
        </View>
      </View>
    </View>
  );
};

export default Misc;

const styles = StyleSheet.create({
  container: {
    marginTop: 22,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deviceInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  phoneIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  featuresContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  featureItem: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  featureIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
