import { Tools } from "@bettercorp/tools/lib/Tools";
import { generateVAPIDKeys } from "web-push";
import { SecConfig } from "@bettercorp/service-base";

export interface IPushPluginConfig {
  publicKey: string; // VAPID Public Key
  privateKey: string; // VAPID Private Key
  email: string; // Company Email
  host: string; // My Host
  serviceWorkerJSPath: string; // Service worker path: The /sw.js path on the client app
}

export class Config extends SecConfig<IPushPluginConfig> {
  migrate(
    mappedPluginName: string,
    existingConfig: IPushPluginConfig
  ): IPushPluginConfig {
    if (
      Tools.isNullOrUndefined(existingConfig) ||
      Tools.isNullOrUndefined(existingConfig!.publicKey) ||
      Tools.isNullOrUndefined(existingConfig!.privateKey)
    ) {
      const vapidKeys = generateVAPIDKeys();
      existingConfig = {
        publicKey: vapidKeys.publicKey,
        privateKey: vapidKeys.privateKey,
        email: "test@example.com",
        host: "http://localhost",
        serviceWorkerJSPath: "/sw.js",
      };
    }
    return {
      publicKey: existingConfig!.publicKey,
      privateKey: existingConfig!.privateKey,
      email: existingConfig!.email || "test@example.com",
      host: existingConfig!.host || "http://localhost",
      serviceWorkerJSPath: existingConfig!.serviceWorkerJSPath || "/sw.js",
    };
  }
}
