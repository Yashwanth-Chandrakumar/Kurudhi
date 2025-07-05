import React from 'react';
import { View, Text, StyleSheet, ViewProps, TextProps } from 'react-native';

const Card: React.FC<ViewProps> = ({ style, ...props }) => (
  <View style={[styles.card, style]} {...props} />
);

const CardHeader: React.FC<ViewProps> = ({ style, ...props }) => (
  <View style={[styles.header, style]} {...props} />
);

const CardTitle: React.FC<TextProps> = ({ style, ...props }) => (
  <Text style={[styles.title, style]} {...props} />
);

const CardDescription: React.FC<TextProps> = ({ style, ...props }) => (
  <Text style={[styles.description, style]} {...props} />
);

const CardContent: React.FC<ViewProps> = ({ style, ...props }) => (
  <View style={[styles.content, style]} {...props} />
);

const CardFooter: React.FC<ViewProps> = ({ style, ...props }) => (
  <View style={[styles.footer, style]} {...props} />
);

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.20,
    shadowRadius: 1.41,
    elevation: 2,
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    padding: 24,
  },
  footer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
});

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
