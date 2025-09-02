/**
 * This file initializes and exports the `MMKV` storage instance.
 * `MMKV` is a high-performance, encrypted key-value store for mobile applications,
 * used here for persistent storage of application data.
 */

import { MMKV } from "react-native-mmkv";

/**
 * The initialized `MMKV` storage instance.
 * This object provides methods for storing and retrieving data synchronously.
 */
export const storage = new MMKV();
