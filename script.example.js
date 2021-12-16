const app = await Homey.apps.getApp({ id: 'nl.jwienk.todoist' });
const users = await app.apiGet('/users');

// if you have multiple users pick the right one
const me = users[0];
const userId = me.id;
const user = await app.apiGet(`/users/${userId}`);

// should be equal
console.log({
  me,
  user
});

const projects = await app.apiGet(`/users/${userId}/projects`);
const firstProject = projects[0] || {};
const project = await app.apiGet(`/users/${userId}/projects/${firstProject.id}`);

console.log({
  firstProject,
  project
});

const projectTasks = await app.apiGet(`/users/${userId}/projects/${firstProject.id}/tasks`);
const firstProjectTask = projectTasks[0] || {};
const projectTask = await app.apiGet(`/users/${userId}/projects/${firstProject.id}/tasks/${firstProjectTask.id}`);

console.log({
  firstProjectTask,
  projectTask
});

const allTasks = await app.apiGet(`/users/${userId}/tasks`);
const allTasksFirstTask = allTasks[0] || {};
const task = await app.apiGet(`/users/${userId}/tasks/${allTasksFirstTask.id}`);

console.log({
  allTasksFirstTask,
  task
})

// https://developer.todoist.com/rest/v1/?shell#create-a-new-task
const createdTask = await app.apiPost(`/users/${userId}/tasks`, { content: 'My task' });
const createdTask2 = await app.apiPost(`/users/${userId}/tasks`, { content: 'My task2' });
const createdTask3 = await app.apiPost(`/users/${userId}/tasks`, { content: 'My task3' });
// https://developer.todoist.com/rest/v1/?shell#update-a-task
await app.apiPost(`/users/${userId}/tasks/${createdTask.id}`, { content: 'My updated task' });

console.log({
  createdTask,
})

// complete/close task
await app.apiPost(`/users/${userId}/tasks/${createdTask.id}/close`);
await app.apiPost(`/users/${userId}/tasks/${createdTask2.id}/close`);
// reopen task
await app.apiPost(`/users/${userId}/tasks/${createdTask.id}/reopen`);

// delete task
await app.apiDelete(`/users/${userId}/tasks/${createdTask3.id}`);
