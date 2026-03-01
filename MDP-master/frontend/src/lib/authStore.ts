import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    name: string;
    phone: string;
    address: string;
    emergencyContact: {
        name: string;
        phone: string;
    };
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    onboardingCompleted: boolean;

    // Actions
    login: (phone: string) => void;
    updateUser: (data: Partial<User>) => void;
    logout: () => void;
    completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            isAuthenticated: false,
            onboardingCompleted: false,

            login: (phone) =>
                set((state) => ({
                    isAuthenticated: true,
                    user: state.user ? { ...state.user, phone } : {
                        name: '',
                        phone,
                        address: '',
                        emergencyContact: { name: '', phone: '' }
                    }
                })),

            updateUser: (data) =>
                set((state) => ({
                    user: state.user ? { ...state.user, ...data } : null,
                })),

            logout: () =>
                set({
                    user: null,
                    isAuthenticated: false,
                    onboardingCompleted: false,
                }),

            completeOnboarding: () =>
                set({ onboardingCompleted: true }),
        }),
        {
            name: 'auth-storage',
        }
    )
);
