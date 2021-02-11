'use strict';

const { OAuth2Device } = require('homey-oauth2app');

class UserDevice extends OAuth2Device {
  /**
   * @override
   * @return {Promise<void>}
   */
  async onOAuth2Init() {
    this.log('onOAuth2Init');

    const data = this.getData();

    await this.homey.app.registerWebhookData({ data });
  }

  /**
   * @override
   * @return {Promise<void>}
   */
  async onOAuth2Deleted() {
    // Clean up here
  }
}

module.exports = UserDevice;
