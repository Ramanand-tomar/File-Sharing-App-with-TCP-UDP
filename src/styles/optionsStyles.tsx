import { StyleSheet } from 'react-native';

export const optionStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginTop: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f4f8',
  },
  subContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 68,
  },
  iconBadge: {
    width: 46,
    height: 46,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
});
