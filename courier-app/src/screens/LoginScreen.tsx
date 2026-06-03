import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>;
};

export default function LoginScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const login = useAppStore(state => state.login);

  const handleLogin = async () => {
    if (phone.length < 5 || password.length < 4) {
      Alert.alert('Ошибка', 'Введите корректные данные');
      return;
    }

    setIsSubmitting(true);
    const error = await login(phone, password);
    setIsSubmitting(false);

    if (error) {
      Alert.alert('Ошибка входа', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Вход</Text>

      <TextInput
        style={styles.input}
        placeholder="Номер телефона"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        editable={!isSubmitting}
        data-test-id="login-phone"
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!isSubmitting}
        data-test-id="login-password"
      />

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleLogin}
        disabled={isSubmitting}
        data-test-id="login-submit"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Войти</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate('Register')}
        style={styles.linkButton}
        disabled={isSubmitting}
      >
        <Text style={styles.linkText}>Нет аккаунта? Зарегистрироваться</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: {
    backgroundColor: '#fff', padding: 15, borderRadius: 10, fontSize: 16,
    marginBottom: 15, borderWidth: 1, borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF', padding: 18, borderRadius: 10,
    alignItems: 'center', marginTop: 10, minHeight: 56, justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#007AFF', fontSize: 16 },
});
