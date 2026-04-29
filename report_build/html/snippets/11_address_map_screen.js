// screens/AddressMapScreen.js — Pick source & destination on an interactive map
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { haversineKm } from '../utils/geo';

const INITIAL_REGION = {
    latitude: 28.6139, longitude: 77.2090,        // Delhi centroid
    latitudeDelta: 0.15, longitudeDelta: 0.15
};

export default function AddressMapScreen({ navigation, route }) {
    const mapRef = useRef(null);
    const [source, setSource]     = useState(null);
    const [destination, setDest]  = useState(null);
    const [mode, setMode]         = useState('source');   // 'source' | 'destination'

    const centreOnMe = async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        const pos = await Location.getCurrentPositionAsync({});
        mapRef.current?.animateToRegion({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            latitudeDelta: 0.03, longitudeDelta: 0.03
        });
    };

    const onMapPress = (e) => {
        const coord = e.nativeEvent.coordinate;
        if (mode === 'source') { setSource(coord); setMode('destination'); }
        else                   { setDest(coord); }
    };

    const canContinue = source && destination;
    const distance = canContinue
        ? haversineKm(source, destination).toFixed(1)
        : null;

    return (
        <View style={styles.root}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFill}
                initialRegion={INITIAL_REGION}
                onPress={onMapPress}
            >
                {source && <Marker coordinate={source} pinColor="#16a34a" title="Pickup" />}
                {destination && <Marker coordinate={destination} pinColor="#dc2626" title="Drop" />}
                {canContinue && (
                    <Polyline
                        coordinates={[source, destination]}
                        strokeColor="#2563eb"
                        strokeWidth={3}
                    />
                )}
            </MapView>

            <View style={styles.hud}>
                <Text style={styles.hint}>
                    {mode === 'source' ? 'Tap to set pickup point' : 'Now tap destination'}
                </Text>
                {distance && <Text style={styles.distance}>Route distance: {distance} km</Text>}
                <TouchableOpacity style={styles.locBtn} onPress={centreOnMe}>
                    <Text style={styles.locTxt}>Use my location</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.nextBtn, !canContinue && { opacity: 0.4 }]}
                    disabled={!canContinue}
                    onPress={() => navigation.navigate('Inventory', {
                        source, destination, distance_km: Number(distance)
                    })}
                >
                    <Text style={styles.nextTxt}>Continue</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root:     { flex: 1 },
    hud:      { position: 'absolute', bottom: 0, left: 0, right: 0,
                backgroundColor: '#fff', padding: 18, borderTopLeftRadius: 18,
                borderTopRightRadius: 18, elevation: 8 },
    hint:     { fontSize: 15, marginBottom: 6 },
    distance: { fontSize: 16, fontWeight: '600', marginBottom: 10, color: '#111' },
    locBtn:   { paddingVertical: 10, alignItems: 'center' },
    locTxt:   { color: '#2563eb', fontWeight: '500' },
    nextBtn:  { backgroundColor: '#2563eb', borderRadius: 10, paddingVertical: 14,
                alignItems: 'center', marginTop: 6 },
    nextTxt:  { color: '#fff', fontWeight: '700', fontSize: 16 }
});
