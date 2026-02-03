import { createMMKV } from 'react-native-mmkv';

export const storage =  createMMKV({
    id: 'my-app-storage',
    encryptionKey: 'my-super-secret-key',
});

export const mmkvStorage = {
    setItem: (key: string, value: string) => {
        storage.set(key, value);
    },
    getItem: (key: string) => {
        return storage.getString(key);
    },
    removeItem: (key: string) => {
        storage.remove(key);
    },
};

