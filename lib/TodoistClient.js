const { OAuth2Client, OAuth2Error } = require('homey-oauth2app');
const { URLSearchParams } = require('url');

class TodoistClient extends OAuth2Client {
  // Required:
  // static API_URL = 'https://api.todoist.com';
  // static TOKEN_URL = 'https://todoist.com/oauth/access_token';
  // static AUTHORIZATION_URL = 'https://todoist.com/oauth/authorize';
  // static SCOPES = [ 'data:read_write' ];

  // Optional:
  // static TOKEN = MyBrandOAuth2Token; // Default: OAuth2Token
  // static REDIRECT_URL = 'https://callback.athom.com/oauth2/callback'; // Default: 'https://callback.athom.com/oauth2/callback'

  async syncUser() {
    const params = new URLSearchParams();
    params.append('token', this._token.access_token);
    params.append('sync_token', '*');
    params.append('resource_types', '["user"]');

    return await this.post({
      path: '/sync/v8/sync',
      body: params,
    });
  }

  async createTask({
    content,
    project_id,
    due_date,
    due_datetime,
    due_string,
  }) {
    return this.post({
      path: '/rest/v1/tasks',
      json: {
        content,
        project_id: project_id,
        due_date: due_date,
        due_datetime: due_datetime,
        due_string: due_string,
      },
    });
  }

  async getTasks({ project_id }) {
    return this.get({
      path: '/rest/v1/tasks',
      query: {
        project_id: project_id,
      },
    });
  }

  async getProjects() {
    if (this._projects) {
      return await this._projects;
    }

    this._projects = this.get({
      path: '/rest/v1/projects ',
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
