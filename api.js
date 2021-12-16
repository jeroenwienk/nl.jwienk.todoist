function getUserDevice({ homey, userId }) {
  const driver = homey.drivers.getDriver('user');
  const devices = driver.getDevices();
  return devices.find((device) => {
    return device.getData().id.toString() === userId.toString();
  });
}

module.exports = {
  async getUsers({ homey, params, query, body }) {
    const driver = homey.drivers.getDriver('user');
    const devices = driver.getDevices();
    const result = [];

    for (const device of devices) {
      result.push({
        id: device.getData().id,
        name: device.getName(),
      });
    }

    return result;
  },
  async getUser({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      return {
        id: device.getData().id,
        name: device.getName(),
      };
    }

    return null;
  },
  async getUserProjects({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      return await device.oAuth2Client.getProjects();
    }

    return [];
  },
  async getUserProject({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      return await device.oAuth2Client.getProject({
        project_id: params.projectId,
      });
    }

    return null;
  },
  async getUserProjectTasks({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      return await device.oAuth2Client.getTasks({
        project_id: params.projectId,
      });
    }

    return [];
  },
  async getUserProjectTask({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      return await device.oAuth2Client.getTask({
        task_id: params.taskId,
      });
    }

    return null;
  },
  async getUserTasks({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      return await device.oAuth2Client.getTasks();
    }

    return null;
  },
  async getUserTask({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      return await device.oAuth2Client.getTask({
        task_id: params.taskId,
      });
    }

    return null;
  },
  async createUserTask({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      return await device.oAuth2Client.createTask(body);
    }

    return null;
  },
  async updateUserTask({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      return await device.oAuth2Client.updateTask(params.taskId, body);
    }

    return null;
  },
  async closeUserTask({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      return await device.oAuth2Client.closeTask(params.taskId);
    }

    return null;
  },
  async reopenUserTask({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      return await device.oAuth2Client.reopenTask(params.taskId);
    }

    return null;
  },
  async deleteUserTask({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      return await device.oAuth2Client.deleteTask(params.taskId);
    }

    return null;
  },
};
