import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const register = useAppStore(state => state.register);

  const handleRegister = async () => {
    if (phone.length < 5 || password.length < 4) {
      Alert.alert('Ошибка', 'Телефон должен быть длиннее 5 символов, а пароль длиннее 4.');
      return;
    }

    setIsSubmitting(true);
    const error = await register(phone, password);
    setIsSubmitting(false);

    if (error) {
      Alert.alert('Ошибка', error);
      return;
    }

    Alert.alert('Успех', 'Аккаунт создан. Войдите с теми же данными.', [
      { text: 'ОК', onPress: () => navigation.navigate('Login') },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Регистрация курьера</Text>

      <TextInput
        style={styles.input}
        placeholder="Номер телефона"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
        editable={!isSubmitting}
        data-test-id="register-phone"
      />

      <TextInput
        style={styles.input}
        placeholder="Пароль"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={!isSubmitting}
        data-test-id="register-password"
      />

      <TouchableOpacity
        style={[styles.button, isSubmitting && styles.buttonDisabled]}
        onPress={handleRegister}
        disabled={isSubmitting}
        data-test-id="register-submit"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Создать аккаунт</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.linkButton}
        disabled={isSubmitting}
      >
        <Text style={styles.linkText}>Уже есть аккаунт? Войти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: {
    backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, fontSize: 16,
    marginBottom: 15, borderWidth: 1, borderColor: '#eee',
  },
  button: {
    backgroundColor: '#28a745', padding: 18, borderRadius: 10,
    alignItems: 'center', marginTop: 10, minHeight: 56, justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#666', fontSize: 16 },
});
