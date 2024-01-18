// @flow
import { NativeModules } from 'react-native';

// @ts-ignore
const isTurboModuleEnabled = global.__turboModuleProxy != null;

const RNViewShot = isTurboModuleEnabled
  ? // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('./NativeViewShot').default
  : NativeModules.RNViewShot;

export default RNViewShot;