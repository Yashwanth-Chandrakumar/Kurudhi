import React from 'react';
import { TextInput, StyleSheet, TextInputProps } from 'react-native';

const Input = React.forwardRef<TextInput, TextInputProps>(({ style, ...props }, ref) => {
  return (
    <TextInput
      ref={ref}
      style={[styles.input, style]}
      {...props}
    />
  );
});

Input.displayName = 'Input';

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    fontSize: 16,
  },
});

export { Input };
