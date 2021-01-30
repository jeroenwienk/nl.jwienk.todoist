'use strict';

const { OAuth2Driver } = require('../../lib/replace_after_fix');

class UserDriver extends OAuth2Driver {
  /**
   * @override
   * @return {Promise<void>}
   */
  async onOAuth2Init() {
    this.eventTaskDeviceTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'trigger_event_task'
    );

    this.registerEventTaskDeviceTrigger();

    this.registerProjectTaskAction();
    this.registerProjectDueDateTaskAction();
    this.registerProjectDueDateDueTimeTaskAction();
  }

  /**
   * @override
   * @param oAuth2Client
   * @return {Promise<{data: {id}, name: string}[]>}
   */
  async onPairListDevices({ oAuth2Client }) {
    const result = await oAuth2Client.syncUser();
    this.log(result.user);

    return [
      {
        name: result.user.full_name,
        data: {
          id: result.user.id,
        },
      },
    ];
  }

  onWebhookEvent({ body }) {
    const device = this.getDevice({ id: body.user_id });
    this.eventTaskDeviceTriggerCard.trigger(
      device,
      { content: body.event_data.content },
      { event_name: body.event_name }
    );
  }

  registerEventTaskDeviceTrigger() {
    this.eventTaskDeviceTriggerCard.registerRunListener(async (args, state) => {
      const { device, event_name } = args;

      if (state.event_name === event_name) {
        return true;
      }

      return false;
    });
  }

  registerProjectTaskAction() {
    const actionProjectTask = this.homey.flow.getActionCard(
      'action_project_task'
    );

    actionProjectTask.registerRunListener(async (args, state) => {
      await args.device.oAuth2Client.createTask({
        content: args.content,
        project_id: args.project.id,
      });

      return true;
    });

    actionProjectTask.registerArgumentAutocompleteListener(
      'project',
      this.projectAutocompleteListener
    );
  }

  registerProjectDueDateTaskAction() {
    const actionProjectDueDateTask = this.homey.flow.getActionCard(
      'action_project_due_date_task'
    );

    actionProjectDueDateTask.registerRunListener(async (args, state) => {
      this.log(args);

      const due_date = args.due_date.split('-').reverse().join('-');

      await args.device.oAuth2Client.createTask({
        content: args.content,
        project_id: args.project.id,
        due_date: due_date,
      });

      return true;
    });

    actionProjectDueDateTask.registerArgumentAutocompleteListener(
      'project',
      this.projectAutocompleteListener
    );
  }

  registerProjectDueDateDueTimeTaskAction() {
    const actionProjectDueDateDueTimeTask = this.homey.flow.getActionCard(
      'action_project_due_date_due_time_task'
    );

    actionProjectDueDateDueTimeTask.registerRunListener(async (args, state) => {
      const due_date_parts = args.due_date.split('-').reverse();
      const due_time_parts = args.due_time.split(':');

      const date = new Date(
        due_date_parts[0],
        due_date_parts[1] - 1,
        due_date_parts[2],
        due_time_parts[0],
        due_time_parts[1]
      );

      const systemDate = new Date();
      systemDate.setMinutes(0, 0, 0);

      const timeZoneDate = new Date(
        systemDate.toLocaleString('en-US', {
          timeZone: this.homey.clock.getTimezone(),
          hour12: false,
        })
      );
      timeZoneDate.setMinutes(0, 0, 0);

      const offset = systemDate.getTime() - timeZoneDate.getTime();
      const actualDate = new Date(date.getTime() + offset);

      await args.device.oAuth2Client.createTask({
        content: args.content,
        project_id: args.project.id,
        due_datetime: actualDate.toISOString(),
      });

      return true;
    });

    actionProjectDueDateDueTimeTask.registerArgumentAutocompleteListener(
      'project',
      this.projectAutocompleteListener
    );
  }

  async projectAutocompleteListener(query, args) {
    const projects = await args.device.oAuth2Client.getProjects();

    const mapped = projects.map((project) => {
      return {
        id: project.id,
        name: project.name,
      };
    });

    return mapped.filter((project) => {
      return project.name.toLowerCase().includes(query.toLowerCase());
    });
  }
}

module.exports = UserDriver;
