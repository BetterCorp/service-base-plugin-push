import { CPluginClient } from '@bettercorp/service-base/lib/interfaces/plugins';
import { subscriptionRequest, IWebPushData } from './lib';
import { PushSubscription } from 'web-push';

export class pushServer extends CPluginClient<any> {
  public readonly _pluginName: string = "push-server";

  onSubscribe(listener: { (sub: subscriptionRequest): Promise<void>; }) {
    this.onEvent<subscriptionRequest>('subscribe', listener);
  }
  onUnSubscribe(listener: { (sub: subscriptionRequest): Promise<void>; }) {
    this.onEvent<subscriptionRequest>('unsubscribe', listener);
  }
  async send(subscription: PushSubscription, data: IWebPushData) {
    return await this.emitEventAndReturn('send', { subscription, data });
  }
}