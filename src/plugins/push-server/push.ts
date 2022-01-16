import { CPluginClient } from '@bettercorp/service-base/lib/interfaces/plugins';
import { subscriptionRequest, IWebPushData } from './lib';
import { PushSubscription } from 'web-push';

export class pushServer extends CPluginClient<any> {
  public readonly _pluginName: string = "push-server";

  onSubscribe(listener: (sub: subscriptionRequest) => void) {
    this.onEvent('subscribe', listener);
  }
  onUnSubscribe(listener: (sub: subscriptionRequest) => void) {
    this.onEvent('unsubscribe', listener);
  }
  send(subscription: PushSubscription, data: IWebPushData) {
    return this.emitEventAndReturn('send', { subscription, data });
  }
}