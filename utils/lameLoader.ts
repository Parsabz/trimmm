import lamejs from 'lamejs';

let lameInstance: any = null;

export const getLameInstance = async () => {
  if (!lameInstance) {
    lameInstance = lamejs;
  }
  return lameInstance;
}; 