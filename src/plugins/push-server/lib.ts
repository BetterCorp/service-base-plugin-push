import { FastifyHeadersWithIP } from '@bettercorp/service-base-plugin-web-server/lib/plugins/fastify/lib';
import { PushSubscription } from 'web-push';

export interface subscriptionRequest {
  subscription: PushSubscription;
  token: any | null;
  headers: FastifyHeadersWithIP;
}

export interface IWebPushData<T = any> {
  action: string;
  data: T;
}