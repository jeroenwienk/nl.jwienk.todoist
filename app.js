'use strict';

const Homey = require('homey');
const { OAuth2App } = require('./lib/replace_after_fix');
const { TodoistClient } = require('./lib/TodoistClient');

if (process.env.DEBUG === '1') {
  require('inspector').open(9229, '0.0.0.0', true);
}

class App extends OAuth2App {
  /**
   * @override
   * @return {Promise<void>}
   */
  async onOAuth2Init() {
    this.log('onOAuth2Init');

    this.enableOAuth2Debug();
    this.setOAuth2Config({
      client: TodoistClient,
      clientId: '96cbbdd8c67c4c65ac33679ce1cda843',
      clientSecret: 'df993c90b5a94cb29a20e4fc3fa17bff',
      grantType: 'authorization_code',
      apiUrl: 'https://api.todoist.com',
      tokenUrl: 'https://todoist.com/oauth/access_token',
      authorizationUrl: 'https://todoist.com/oauth/authorize',
      redirectUrl: 'https://callback.athom.com/oauth2/callback',
      scopes: ['data:read_write'],
      allowMultiSession: true,
    });

    this.ids = new Set();
    this.webhook = null;
  }

  async registerWebhookData({ data }) {
    if (this.webhook) {
      await this.webhook.unregister();
    }

    this.ids.add(data.id);

    const id = Homey.env.WEBHOOK_ID;
    const secret = Homey.env.WEBHOOK_SECRET;
    const ids = [...this.ids];

    const myWebhook = await this.homey.cloud.createWebhook(id, secret, { ids });

    myWebhook.on('message', (args) => {
      const driver = this.homey.drivers.getDriver('user');

      driver.onWebhookEvent({ body: args.body });

      // this.log(driver);
      //
      // this.log('Got a webhook message!');
      // this.log('headers:', args.headers);
      // this.log('query:', args.query);
      // this.log('body:', args.body);
    });
  }
}

module.exports = App;
