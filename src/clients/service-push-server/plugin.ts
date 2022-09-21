import { ServiceCallable, ServicesClient } from "@bettercorp/service-base";
import {
  IWebPushData,
  subscriptionRequest,
} from "../../plugins/service-push-server/lib";
import { IPushPluginConfig } from "../../plugins/service-push-server/sec.config";
import { PushSubscription, SendResult } from "web-push";
import {
  PushEvents,
  PushReturnableEvents,
} from "../../plugins/service-push-server/plugin";

export class pushServer
  extends ServicesClient<
    ServiceCallable,
    PushEvents,
    PushReturnableEvents,
    ServiceCallable,
    ServiceCallable,
    IPushPluginConfig
  >
  implements PushReturnableEvents
{
  public override readonly _pluginName = "service-push-server";

  async send(
    subscription: PushSubscription,
    data: IWebPushData<any>
  ): Promise<SendResult> {
    return await this._plugin.emitEventAndReturn("send", subscription, data);
  }
  async onSubscribe(listener: {
    (subscription: subscriptionRequest): Promise<void>;
  }): Promise<void> {
    await this._plugin.onEvent("onSubscribe", listener);
  }
  async onUnSubscribe(listener: {
    (subscription: subscriptionRequest): Promise<void>;
  }): Promise<void> {
    await this._plugin.onEvent("onUnSubscribe", listener);
  }
}
