import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAppStore } from '../store/useAppStore';
import { RootStackParamList } from '../types';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>;
};

export default function RegisterScreen({ navigation }: Props) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  
  const register = useAppStore((state) => state.register);

  const handleRegister = () => {
    if (phone.length < 5 || password.length < 4) {
      Alert.alert('Ошибка', 'Телефон должен быть длиннее 5 символов, а пароль длиннее 4.');
      return;
    }

    const isSuccess = register(phone, password);

    if (isSuccess) {
      Alert.alert('Успех', 'Вы успешно зарегистрированы! Теперь вы можете войти.', [
        { text: 'ОК', onPress: () => navigation.navigate('Login') } // Возвращаем на экран входа
      ]);
    } else {
      Alert.alert('Ошибка', 'Пользователь с таким номером телефона уже существует.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Регистрация курьера</Text>
      
      <TextInput
        style={styles.input} placeholder="Придумайте номер телефона" keyboardType="phone-pad"
        value={phone} onChangeText={setPhone}
      />
      
      <TextInput
        style={styles.input} placeholder="Придумайте пароль" secureTextEntry
        value={password} onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Создать аккаунт</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.linkButton}>
        <Text style={styles.linkText}>Уже есть аккаунт? Войти</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 30, textAlign: 'center' },
  input: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 10, fontSize: 16, marginBottom: 15, borderWidth: 1, borderColor: '#eee' },
  button: { backgroundColor: '#28a745', padding: 18, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  linkButton: { marginTop: 20, alignItems: 'center' },
  linkText: { color: '#666', fontSize: 16 },
});
