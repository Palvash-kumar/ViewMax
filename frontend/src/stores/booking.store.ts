'use client';

import { create } from 'zustand';

interface BookingState {
  selectedShowtimeId: string | null;
  selectedSeats: string[];
  totalAmount: number;
  ticketPrice: number;
  setShowtime: (id: string, price: number) => void;
  toggleSeat: (seatNumber: string) => void;
  clearSelection: () => void;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  selectedShowtimeId: null,
  selectedSeats: [],
  totalAmount: 0,
  ticketPrice: 0,

  setShowtime: (id, price) =>
    set({ selectedShowtimeId: id, ticketPrice: price, selectedSeats: [], totalAmount: 0 }),

  toggleSeat: (seatNumber) => {
    const { selectedSeats, ticketPrice } = get();
    const exists = selectedSeats.includes(seatNumber);

    const newSeats = exists
      ? selectedSeats.filter((s) => s !== seatNumber)
      : [...selectedSeats, seatNumber];

    set({
      selectedSeats: newSeats,
      totalAmount: newSeats.length * ticketPrice,
    });
  },

  clearSelection: () =>
    set({ selectedShowtimeId: null, selectedSeats: [], totalAmount: 0, ticketPrice: 0 }),
}));
