// @flow
import type { TurboModule } from 'react-native/Libraries/TurboModule/RCTExport';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
    captureRef<T>(viewRef: number | ReactInstance | RefObject<T>, options?: Options): Promise<string>;
    captureScreen(options?: Options): Promise<string>;
    releaseCapture(uri: string): void;
}
export default (TurboModuleRegistry.getEnforcing< Spec > (
    'ViewShotTurboModule'
): ?Spec);