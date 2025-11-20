'use strict';

const { OAuth2Driver } = require('homey-oauth2app');

class UserDriver extends OAuth2Driver {
  /**
   * @override
   * @return {Promise<void>}
   */
  async onOAuth2Init() {
    this.eventTaskDeviceTriggerCard = this.homey.flow.getDeviceTriggerCard('trigger_event_task');

    this.projectTasksFetchedDeviceTriggerCard = this.homey.flow.getDeviceTriggerCard(
      'trigger_project_tasks_fetched'
    );

    this.registerEventTaskDeviceTrigger();
    this.registerProjectTasksFetchedDeviceTrigger();

    this.registerTaskExistsCondition();

    this.registerProjectTaskAction();
    this.registerProjectDueStringTaskAction();
    this.registerProjectDueDateTaskAction();
    this.registerProjectDueDateDueTimeTaskAction();

    this.registerFetchProjectTasksAction();
    this.registerCompleteTasksAction();
  }

  registerCompleteTasksAction() {
    const actionCompleteTasks = this.homey.flow.getActionCard('action_complete_tasks');

    actionCompleteTasks.registerRunListener(async (args, state) => {
      if (args.filter.trim() === '') {
        throw new Error(this.homey.__('invalidFilter'));
      }

      let filter = `search: ${args.filter}`;
      if(args.project?.id) {
        const project = await args.device.oAuth2Client.getProject({ project_id: args.project.id });
        filter += ` & #${project.name}`;
      }

      const tasks = await args.device.oAuth2Client.getTasks({
        filter,
      });

      this.log(tasks);

      await Promise.all(tasks.map(async task => {
        await args.device.oAuth2Client.closeTask(task.id);
      }));
    });

    actionCompleteTasks.registerArgumentAutocompleteListener(
      'project',
      this.projectAutocompleteListener
    );
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
      if (args.event_name === state.event_name) {
        return true;
      }

      return false;
    });
  }

  registerProjectTasksFetchedDeviceTrigger() {
    this.projectTasksFetchedDeviceTriggerCard.registerRunListener(async (args, state) => {
      if (args.project.id === state.project_id) {
        return true;
      }

      return false;
    });

    this.projectTasksFetchedDeviceTriggerCard.registerArgumentAutocompleteListener(
      'project',
      this.projectAutocompleteListener
    );
  }

  registerTaskExistsCondition() {
    const conditionTaskExists = this.homey.flow.getConditionCard('condition_task_exists');

    conditionTaskExists.registerRunListener(async (args, state) => {
      let filter = `search: ${args.filter}`;
      if(args.project?.id) {
        const project = await args.device.oAuth2Client.getProject({ project_id: args.project.id });
        filter += ` & #${project.name}`;
      }

      const tasks = await args.device.oAuth2Client.getTasks({
        filter
      });

      if (tasks.length > 0) {
        return true;
      }

      return false;
    });

    conditionTaskExists.registerArgumentAutocompleteListener(
      'project',
      this.projectAutocompleteListener
    );
  }

  registerProjectTaskAction() {
    const actionProjectTask = this.homey.flow.getActionCard('action_project_task');

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

  registerProjectDueStringTaskAction() {
    const actionProjectDueStringTask = this.homey.flow.getActionCard(
      'action_project_due_string_task'
    );

    actionProjectDueStringTask.registerRunListener(async (args, state) => {
      await args.device.oAuth2Client.createTask({
        content: args.content,
        project_id: args.project.id,
        due_string: args.due_string,
      });

      return true;
    });

    actionProjectDueStringTask.registerArgumentAutocompleteListener(
      'project',
      this.projectAutocompleteListener
    );
  }

  registerProjectDueDateTaskAction() {
    const actionProjectDueDateTask = this.homey.flow.getActionCard('action_project_due_date_task');

    actionProjectDueDateTask.registerRunListener(async (args, state) => {
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

  registerFetchProjectTasksAction() {
    const actionFetchProjectTasks = this.homey.flow.getActionCard('action_fetch_project_tasks');

    actionFetchProjectTasks.registerRunListener(async (args, state) => {
      const tasks = await args.device.oAuth2Client.getTasks({
        project_id: args.project.id,
      });

      const taskStrings = [];

      taskStrings.push(`${this.homey.__('project')}: ${args.project.name}`);

      const bull = String.fromCharCode(0x2022);

      if (tasks.length === 0) {
        taskStrings.push(this.homey.__('emptyTasks'));
      }

      for (const task of tasks) {
        if (task.due != null) {
          taskStrings.push(`${bull} ${task.content}\n- ${task.due.string}`);
          continue;
        }

        taskStrings.push(`${bull} ${task.content}`);
      }

      const triggerTokens = {
        tasks: taskStrings.join('\n'),
      };

      const triggerState = {
        project_id: args.project.id,
      };

      await this.projectTasksFetchedDeviceTriggerCard.trigger(
        args.device,
        triggerTokens,
        triggerState
      );

      return true;
    });

    actionFetchProjectTasks.registerArgumentAutocompleteListener(
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
