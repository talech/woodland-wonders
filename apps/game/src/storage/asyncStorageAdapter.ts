/** The only module that touches AsyncStorage (localStorage on web, native storage on iOS/Android). */
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { StorageAdapter } from './adapter.ts';

export const asyncStorageAdapter: StorageAdapter = {
  get: (key) => AsyncStorage.getItem(key),
  set: (key, value) => AsyncStorage.setItem(key, value),
  remove: (key) => AsyncStorage.removeItem(key),
};
