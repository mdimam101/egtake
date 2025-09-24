// src/common/navigationRef.js
import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

// global ready flag
let _navReady = false;
export const isNavReady = () => _navReady;
export const setNavReady = (v) => { _navReady = !!v; };

// safe navigate (ready না হলে কিছুই করবে না)
export function navigate(name, params) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name, params);
  }
}

// current route name safely read
export function getCurrentRouteNameSafe() {
  if (!navigationRef.isReady()) return 'Home';
  const r = navigationRef.getCurrentRoute?.();
  return r?.name || 'Home';
}
