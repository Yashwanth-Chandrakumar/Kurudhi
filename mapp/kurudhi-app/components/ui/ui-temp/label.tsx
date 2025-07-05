import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';

const Label: React.FC<TextProps> = ({ style, ...props }) => {
  return <Text style={[styles.label, style]} {...props} />;
};

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
});

export { Label };
