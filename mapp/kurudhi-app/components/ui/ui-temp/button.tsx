import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  onPress?: () => void;
  title: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({ onPress, title, variant = 'default', size = 'default', style, textStyle }) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        style,
      ]}
    >
      <Text style={[textStyles.base, textVariantStyles[variant], textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
});

const sizeStyles = StyleSheet.create({
  default: {
    height: 40,
    paddingHorizontal: 16,
  },
  sm: {
    height: 32,
    paddingHorizontal: 12,
  },
  lg: {
    height: 48,
    paddingHorizontal: 24,
  },
});

const variantStyles = StyleSheet.create({
  default: {
    backgroundColor: '#007BFF',
  },
  destructive: {
    backgroundColor: '#DC3545',
  },
  outline: {
    borderWidth: 1,
    borderColor: '#007BFF',
    backgroundColor: 'transparent',
  },
  secondary: {
    backgroundColor: '#6C757D',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  link: {
    backgroundColor: 'transparent',
  },
});

const textStyles = StyleSheet.create({
  base: {
    fontSize: 16,
    fontWeight: '600',
  },
});

const textVariantStyles = StyleSheet.create({
  default: {
    color: '#FFFFFF',
  },
  destructive: {
    color: '#FFFFFF',
  },
  outline: {
    color: '#007BFF',
  },
  secondary: {
    color: '#FFFFFF',
  },
  ghost: {
    color: '#007BFF',
  },
  link: {
    color: '#007BFF',
    textDecorationLine: 'underline',
  },
});

export { Button };
