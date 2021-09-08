import { Tools } from '@bettercorp/tools/lib/Tools';
import { generateVAPIDKeys } from 'web-push';

export interface IPushPluginConfig {
  publicKey: string;
  privateKey: string;
  email: string;
  host: string;
  serviceWorkerJSPath: string;
}

export default (pluginName: string, existingConfig?: IPushPluginConfig): IPushPluginConfig => {
  if (Tools.isNullOrUndefined(existingConfig) || Tools.isNullOrUndefined(existingConfig!.publicKey) || Tools.isNullOrUndefined(existingConfig!.privateKey)) {
    const vapidKeys = generateVAPIDKeys();
    existingConfig = {
      publicKey: vapidKeys.publicKey,
      privateKey: vapidKeys.privateKey,
      email: 'test@example.com',
      host: 'http://localhost',
      serviceWorkerJSPath: '/sw.js'
    };
  }
  return {
    publicKey: existingConfig!.publicKey,
    privateKey: existingConfig!.privateKey,
    email: existingConfig!.email || 'test@example.com',
    host: existingConfig!.host || 'http://localhost',
    serviceWorkerJSPath: existingConfig!.serviceWorkerJSPath || '/sw.js',
  };
};