//import { Tools } from '@bettercorp/tools/lib/Tools';
import * as WebPush from 'web-push';
import { IPushPluginConfig } from './sec.config';
import { CPlugin, CPluginClient } from '@bettercorp/service-base/lib/interfaces/plugins';
import { express } from '@bettercorp/service-base-plugin-web-server/lib/plugins/express/express';
import { json } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface IWebPushData<T = any> {
  action: string;
  data: T;
}
export class pushServer extends CPluginClient<any> {
  public readonly _pluginName: string = "push-server";

  onSubscribe(listener: (client: any) => void) {
    this.onEvent('subscribe', listener);
  }
  onUnSubscribe(listener: (client: any) => void) {
    this.onEvent('unsubscribe', listener);
  }
  send(subscription: WebPush.PushSubscription, data: IWebPushData) {
    return this.emitEventAndReturn('send', { subscription, data });
  }
}

export class Plugin extends CPlugin<IPushPluginConfig> {
  express!: express;
  clientFileBase!: string;
  init(): Promise<void> {
    const self = this;
    return new Promise(async (resolve) => {
      self.clientFileBase = join(self.cwd, 'content');
      if (!require('fs').existsSync(join(self.clientFileBase, 'WEB_PUSH')))
        self.clientFileBase = join(self.cwd, 'node_modules/@bettercorp/service-base-plugin-push/content');
      self.express = new express(self);
      self.express.use(async (req: any, res: any, next: Function) => {
        self.log.debug(`REQ[${ req.method }] ${ req.path } (${ JSON.stringify(req.query) })`);
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', '*');

        if (req.method.toUpperCase() === 'OPTIONS')
          return res.sendStatus(200);
        next();
      });
      self.log.info('USE JSON FOR EXPRESS');
      self.express.use(json({ limit: '5mb' }));
      WebPush.setVapidDetails(`mailto:${ (await self.getPluginConfig()).email }`, (await self.getPluginConfig()).publicKey, (await self.getPluginConfig()).privateKey);

      self.express.get('/client.js', async (req, res) => {
        self.log.debug(`GET: client.js`);
        res.setHeader('Content-Type', 'application/javascript');
        let varsToSend = {
          publicKey: (await self.getPluginConfig()).publicKey,
          subscribeUrl: `${ (await self.getPluginConfig()).host }/subscribe`,
          serviceWorkerUrl: (await self.getPluginConfig()).serviceWorkerJSPath,
        };
        let contentToChange = readFileSync(join(self.clientFileBase, 'client.js')).toString().replace('{VARIABLES}', JSON.stringify(varsToSend));
        res.status(200).send(contentToChange);
      });
      self.express.post('/subscribe', async (req, res) => {
        await self.emitEvent(null, 'subscribe', req.body);
        const payload = JSON.stringify({
          action: 'SW_REGISTRATION_SUBSCRIPTION',
          data: true
        });
        WebPush.sendNotification(req.body.subscription, payload)
          .catch(error => console.error(error));
        res.sendStatus(202);
      });
      self.express.delete('/subscribe', async (req, res) => {
        await self.emitEvent(null, 'unsubscribe', req.body);
        res.sendStatus(202);
      });

      await self.onReturnableEvent(null, 'send', (data): Promise<WebPush.SendResult> => new Promise((resolve, reject) => {
        WebPush.sendNotification(data.subscription, JSON.stringify(data.data))
          .then(resolve)
          .catch(reject);
      }));

      /* const payload = JSON.stringify({
         title: 'Push notifications with Service Workers',
       });
 
       console.log(JSON.parse(require('fs').readFileSync('./sub.json').toString()));
       WebPush.sendNotification(JSON.parse(require('fs').readFileSync('./sub.json').toString()).subscription, payload)
         .catch(error => console.error(error));*/

      resolve();
    });
  }
  loadedIndex: number = Number.POSITIVE_INFINITY;
  loaded(): Promise<void> {
    const self = this;
    return new Promise(async (resolve) => {
      self.log.info(`Push server ready`);
      self.log.info(`@ ${ (await self.getPluginConfig()).host }/client.js`);
    });
  }
}
