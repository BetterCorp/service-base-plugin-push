//import { Tools } from '@bettercorp/tools/lib/Tools';
import * as WebPush from 'web-push';
import { IPushPluginConfig } from './sec.config';
import { CPlugin } from '@bettercorp/service-base/lib/interfaces/plugins';
import { fastify } from '@bettercorp/service-base-plugin-web-server/lib/plugins/fastify/fastify';
import { readFileSync } from 'fs';
import { join } from 'path';
import { subscriptionRequest } from './lib';

export class Plugin extends CPlugin<IPushPluginConfig> {
  fastify!: fastify;
  clientFileBase!: string;
  init(): Promise<void> {
    const self = this;
    return new Promise(async (resolve) => {
      self.clientFileBase = join(self.cwd, 'content');
      if (!require('fs').existsSync(join(self.clientFileBase, 'WEB_PUSH')))
        self.clientFileBase = join(self.cwd, 'node_modules/@bettercorp/service-base-plugin-push/content');
      self.fastify = new fastify(self);
      WebPush.setVapidDetails(`mailto:${ (await self.getPluginConfig()).email }`, (await self.getPluginConfig()).publicKey, (await self.getPluginConfig()).privateKey);

      self.fastify.get('/client.js', async (req, res) => {
        self.log.debug(`GET: client.js`);
        let varsToSend = {
          publicKey: (await self.getPluginConfig()).publicKey,
          subscribeUrl: `${ (await self.getPluginConfig()).host }/subscribe`,
          serviceWorkerUrl: (await self.getPluginConfig()).serviceWorkerJSPath,
        };
        let contentToChange = readFileSync(join(self.clientFileBase, 'client.js')).toString().replace('{VARIABLES}', JSON.stringify(varsToSend));
        res.status(200).send(contentToChange);
      });
      self.fastify.post('/subscribe', async (req, res) => {
        await self.emitEvent<subscriptionRequest>(null, 'subscribe', {
          subscription: req.body.subscription,
          token: req.body.token,
          headers: req.headers
        });
        const payload = JSON.stringify({
          action: 'SW_REGISTRATION_SUBSCRIPTION',
          data: true
        });
        WebPush.sendNotification(req.body.subscription, payload)
          .catch(error => console.error(error));
        res.status(202).send();
      });
      self.fastify.delete('/subscribe', async (req, res) => {
        await self.emitEvent<subscriptionRequest>(null, 'unsubscribe', {
          subscription: req.body.subscription,
          token: req.body.token,
          headers: req.headers
        });
        res.status(202).send();
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
