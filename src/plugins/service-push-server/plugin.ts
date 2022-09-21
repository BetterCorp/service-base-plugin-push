import * as WebPush from "web-push";
import { fastify } from "@bettercorp/service-base-plugin-web-server";
import { readFileSync } from "fs";
import { join } from "path";
import { IWebPushData, subscriptionRequest } from "./lib";
import {
  IPluginLogger,
  ServiceCallable,
  ServicesBase,
} from "@bettercorp/service-base";
import { IPushPluginConfig } from "./sec.config";

export interface PushEvents extends ServiceCallable {
  onSubscribe(subscription: subscriptionRequest): Promise<void>;
  onUnSubscribe(subscription: subscriptionRequest): Promise<void>;
}

export interface PushReturnableEvents extends ServiceCallable {
  send(
    subscription: WebPush.PushSubscription,
    data: IWebPushData
  ): Promise<WebPush.SendResult>;
}

export class Service extends ServicesBase<
  ServiceCallable,
  PushEvents,
  PushReturnableEvents,
  ServiceCallable,
  ServiceCallable,
  IPushPluginConfig
> {
  private fastify: fastify;
  private clientFileBase!: string;
  constructor(pluginName: string, cwd: string, log: IPluginLogger) {
    super(pluginName, cwd, log);
    this.fastify = new fastify(this);
  }

  public override async init(): Promise<void> {
    const self = this;
    self.clientFileBase = join(self.cwd, "content");
    if (!require("fs").existsSync(join(self.clientFileBase, "WEB_PUSH")))
      self.clientFileBase = join(
        self.cwd,
        "node_modules/@bettercorp/service-base-plugin-push/content"
      );
    WebPush.setVapidDetails(
      `mailto:${(await self.getPluginConfig()).email}`,
      (await self.getPluginConfig()).publicKey,
      (await self.getPluginConfig()).privateKey
    );

    self.fastify.get("/client.js", async (req, res) => {
      self.log.debug(`GET: client.js`);
      let varsToSend = {
        publicKey: (await self.getPluginConfig()).publicKey,
        subscribeUrl: `${(await self.getPluginConfig()).host}/subscribe`,
        serviceWorkerUrl: (await self.getPluginConfig()).serviceWorkerJSPath,
      };
      let contentToChange = readFileSync(join(self.clientFileBase, "client.js"))
        .toString()
        .replace("{VARIABLES}", JSON.stringify(varsToSend));
      res
        .header("content-type", "application/javascript")
        .status(200)
        .send(contentToChange);
    });
    self.fastify.post<any, any, any, any>(
      "/subscribe",
      async (req: any, res) => {
        await self.emitEvent("onSubscribe", {
          subscription: req.body.subscription,
          token: req.body.token,
          headers: req.headers,
        });
        const payload = JSON.stringify({
          action: "SW_REGISTRATION_SUBSCRIPTION",
          data: true,
        });
        WebPush.sendNotification(req.body.subscription, payload).catch(
          (error) => console.error(error)
        );
        res.status(202).send();
      }
    );
    self.fastify.delete("/subscribe", async (req: any, res) => {
      await self.emitEvent("onUnSubscribe", {
        subscription: req.body.subscription,
        token: req.body.token,
        headers: req.headers,
      });
      res.status(202).send();
    });

    await self.onReturnableEvent(
      "send",
      (
        subscription: WebPush.PushSubscription,
        data: IWebPushData
      ): Promise<WebPush.SendResult> =>
        WebPush.sendNotification(subscription, JSON.stringify(data))
    );

    /* const payload = JSON.stringify({
       title: 'Push notifications with Service Workers',
     });

     console.log(JSON.parse(require('fs').readFileSync('./sub.json').toString()));
     WebPush.sendNotification(JSON.parse(require('fs').readFileSync('./sub.json').toString()).subscription, payload)
       .catch(error => console.error(error));*/
  }
}
