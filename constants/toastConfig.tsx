import React from 'react';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { BaseToastProps } from 'react-native-toast-message';

interface CustomToastProps extends BaseToastProps {
  text1?: string;
  text2?: string;
}

const ToastComponent = ({ text1, text2, type }: CustomToastProps & { type: string }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const baseStyle = StyleSheet.create({
    container: {
      width: '90%',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderRadius: 16,
      backgroundColor: isDark ? 'rgba(30, 30, 30, 0.85)' : 'rgba(255, 255, 255, 0.95)',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
    content: {
      flexDirection: 'column',
      alignItems: 'flex-start',
    },
    text1: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#FFF' : '#000',
      flexWrap: 'wrap',
    },
    text2: {
      fontSize: 14,
      color: isDark ? '#DDD' : '#333',
      flexWrap: 'wrap',
      marginTop: 4,
      opacity: 0.85,
    },
  });

  let borderColor: string;
  switch (type) {
    case 'error':
      borderColor = '#D92D20';
      break;
    case 'success':
    case 'info':
      borderColor = "#2b87fb"
      break;
    default:
      borderColor = '#067647';
      break;
  }

  return (
    <View style={[baseStyle.container, { borderLeftWidth: 4, borderLeftColor: borderColor }]}>
      <View style={baseStyle.content}>
        {text1 ? (
          <Text style={baseStyle.text1} numberOfLines={2} ellipsizeMode="tail">
            {text1}
          </Text>
        ) : null}
        {text2 ? (
          <Text style={baseStyle.text2} numberOfLines={3} ellipsizeMode="tail">
            {text2}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const toastConfig = {
  error: (props: CustomToastProps) => <ToastComponent {...props} type="error" />,
  success: (props: CustomToastProps) => <ToastComponent {...props} type="success" />,
  info: (props: CustomToastProps) => <ToastComponent {...props} type="info" />,
  delete: (props: CustomToastProps) => <ToastComponent {...props} type="delete" />,
};

export default toastConfig;