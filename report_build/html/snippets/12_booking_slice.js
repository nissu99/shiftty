// store/bookingSlice.js — Redux Toolkit slice for the in-flight booking draft
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../api/client';

export const fetchPriceQuote = createAsyncThunk(
    'booking/fetchPriceQuote',
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/pricing/quote', payload);
            return data;                                   // { basic, standard, premium }
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Network error');
        }
    }
);

export const createBooking = createAsyncThunk(
    'booking/create',
    async (payload, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/bookings', payload);
            return data;                                   // Booking document
        } catch (err) {
            return rejectWithValue(err.response?.data || 'Unable to create booking');
        }
    }
);

const initialState = {
    source: null,
    destination: null,
    distance_km: 0,
    inventory: [],                // [{ item_name, quantity, is_fragile, category }]
    move_date: null,
    quote: null,                  // { basic, standard, premium }
    selected_package: null,
    recommended_package: null,
    booking: null,
    status: 'idle',               // idle | loading | success | error
    error: null
};

const bookingSlice = createSlice({
    name: 'booking',
    initialState,
    reducers: {
        setRoute(state, { payload }) {
            state.source      = payload.source;
            state.destination = payload.destination;
            state.distance_km = payload.distance_km;
        },
        addItem(state, { payload }) {
            const idx = state.inventory.findIndex(i => i.item_name === payload.item_name);
            if (idx >= 0) state.inventory[idx].quantity += payload.quantity;
            else state.inventory.push(payload);
        },
        removeItem(state, { payload: name }) {
            state.inventory = state.inventory.filter(i => i.item_name !== name);
        },
        setMoveDate(state, { payload }) { state.move_date = payload; },
        selectPackage(state, { payload }) { state.selected_package = payload; },
        setRecommendation(state, { payload }) { state.recommended_package = payload; },
        resetDraft: () => initialState
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchPriceQuote.pending,  (s)    => { s.status = 'loading'; })
            .addCase(fetchPriceQuote.fulfilled,(s, a) => { s.status = 'success'; s.quote = a.payload; })
            .addCase(fetchPriceQuote.rejected, (s, a) => { s.status = 'error';   s.error = a.payload; })
            .addCase(createBooking.fulfilled,  (s, a) => { s.booking = a.payload; });
    }
});

export const {
    setRoute, addItem, removeItem, setMoveDate,
    selectPackage, setRecommendation, resetDraft
} = bookingSlice.actions;

export default bookingSlice.reducer;
