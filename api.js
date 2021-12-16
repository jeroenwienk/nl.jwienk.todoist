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
      const projects = await device.oAuth2Client.getProjects();

      const project = projects.find((project) => {
        return project.id.toString() === params.projectId.toString();
      });

      if (project != null) return project;
    }

    return null;
  },
  async getUserProjectTasks({ homey, params, query, body }) {
    const device = getUserDevice({ homey, userId: params.userId });

    if (device != null) {
      const projects = await device.oAuth2Client.getProjects();

      const project = projects.find((project) => {
        return project.id.toString() === params.projectId.toString();
      });

      if (project != null) {
        return await device.oAuth2Client.getTasks({
          project_id: project.id,
        });
      }
    }

    return [];
  },

  // async addSomething({ homey, body }) {
  //   // access the post body and perform some action on it.
  //
  //   const driver = homey.drivers.getDriver('user');
  //
  //   return driver;
  // },
  //
  // async updateSomething({ homey, params, body }) {
  //   return homey.app.updateSomething(params.id, body);
  // },
  //
  // async deleteSomething({ homey, params }) {
  //   return homey.app.deleteSomething(params.id);
  // },
};
