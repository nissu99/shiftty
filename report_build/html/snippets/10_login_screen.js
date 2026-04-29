// screens/LoginScreen.js — React Native login flow with AsyncStorage persistence
import React, { useState } from 'react';
import {
    View, Text, TextInput, TouchableOpacity,
    ActivityIndicator, StyleSheet, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch } from 'react-redux';
import { setAuthUser } from '../store/authSlice';
import api from '../api/client';

export default function LoginScreen({ navigation }) {
    const dispatch = useDispatch();
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading]   = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            return Alert.alert('Missing', 'Enter both email and password');
        }
        try {
            setLoading(true);
            const { data } = await api.post('/auth/login', { email, password });
            await AsyncStorage.setItem('shifty_token', data.token);
            dispatch(setAuthUser(data.user));
            navigation.replace('Home');
        } catch (err) {
            Alert.alert('Login failed', err.response?.data?.message || 'Try again');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Welcome back to Shifty</Text>

            <TextInput
                style={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading
                    ? <ActivityIndicator color="#fff" />
                    : <Text style={styles.buttonText}>Sign in</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={styles.link}>New to Shifty? Create an account</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
    title:     { fontSize: 26, fontWeight: '700', marginBottom: 24, color: '#111' },
    input:     { borderWidth: 1, borderColor: '#ddd', borderRadius: 8,
                 paddingHorizontal: 14, paddingVertical: 12, marginBottom: 14 },
    button:    { backgroundColor: '#2563eb', borderRadius: 8,
                 paddingVertical: 14, alignItems: 'center' },
    buttonText:{ color: '#fff', fontWeight: '600', fontSize: 16 },
    link:      { marginTop: 18, textAlign: 'center', color: '#2563eb' }
});
