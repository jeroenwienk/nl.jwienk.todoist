const { OAuth2Client, OAuth2Error } = require('homey-oauth2app');
const { URLSearchParams } = require('url');

class TodoistClient extends OAuth2Client {
  async syncUser() {
    const params = new URLSearchParams();
    params.append('token', this._token.access_token);
    params.append('sync_token', '*');
    params.append('resource_types', '["user"]');

    return await this.post({
      path: '/sync/v8/sync',
      body: params
    });
  }

  async createTask({ content, project_id, due_date, due_datetime }) {
    return this.post({
      path: '/rest/v1/tasks',
      json: {
        content,
        project_id: project_id,
        due_date: due_date,
        due_datetime: due_datetime
      }
    });
  }

  async getProjects() {
    if (this._projects) {
      return await this._projects;
    }

    this._projects = this.get({
      path: '/rest/v1/projects '
    });

    await this._projects;

    this.homey.clearTimeout(this._timeout);

    this._timeout = this.homey.setTimeout(() => {
      this._projects = null;
    }, 60000);

    return this._projects;
  }

  /**
   * @override
   * @param body
   * @param status
   * @param statusText
   * @param headers
   * @return {Promise<void>}
   */
  async onHandleNotOK({ body, status, statusText, headers }) {
    if (typeof body === 'string') {
      const error = new Error(statusText);
      error.message = body;
      error.status = status;
      error.statusText = statusText;
      throw error;
    }

    throw new OAuth2Error(body.error);
  }
}

module.exports = { TodoistClient };
