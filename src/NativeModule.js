// @flow
import { NativeModules, TurboModuleRegistry} from 'react-native';

// @ts-ignore
const isTurboModuleEnabled = TurboModuleRegistry.get("ViewShotTurboModule") != null;

const RNViewShot = isTurboModuleEnabled
  ? // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('./NativeViewShot').default
  : NativeModules.RNViewShot;

export default RNViewShot;