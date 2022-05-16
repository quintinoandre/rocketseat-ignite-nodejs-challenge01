const express = require("express");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function getUserIndex(userId) {
  return users.findIndex((user) => user.id === userId);
}

function replaceUser(userIndex, newUser) {
  users.splice(userIndex, 1, { ...newUser });
}

function getAllUserTodos(userId) {
  return users.find((user) => user.id === userId).todos;
}

function getTodo(todos, todoId) {
  return todos.find((todo) => todo.id === todoId);
}

function getTodoIndex(todos, todoId) {
  return todos.findIndex((todo) => todo.id === todoId);
}

function checksExistsUserAccount(request, response, next) {
  const {
    headers: { username },
  } = request;

  const user = users.find((user) => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found" });
  }

  request.user = user;

  return next();
}

function checksExistsUser(request, response, next) {
  const {
    body: { username },
  } = request;

  const user = users.find((user) => user.username === username);

  if (user) {
    return response.status(400).json({ error: "User already exists" });
  }

  request.username = username;

  return next();
}

function checksExistsTodo(request, response, next) {
  const {
    headers: { username },
    params: { id },
  } = request;

  const user = users.find((user) => user.username === username);

  const todo = getTodo(user.todos, id);

  if (!todo) {
    return response.status(404).json({ error: "Todo not found" });
  }

  request.todoId = id;

  return next();
}

app.post("/users", checksExistsUser, (request, response) => {
  const {
    body: { name },
    username,
  } = request;

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: [],
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const {
    body: { title, deadline },
    user,
  } = request;

  const newTodo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  user.todos.push(newTodo);

  const userIndex = getUserIndex(user.id);

  replaceUser(userIndex, user);

  const allUserTodos = getAllUserTodos(user.id);

  const todoToBeReturned = getTodo(allUserTodos, newTodo.id);

  return response.status(201).json(todoToBeReturned);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const {
      body: { title, deadline },
      params: { id },
      user,
    } = request;

    const todoIndex = getTodoIndex(user.todos, id);

    const updatedTodo = {
      ...user.todos[todoIndex],
      title,
      deadline: new Date(deadline),
    };

    user.todos.splice(todoIndex, 1, { ...updatedTodo });

    const userIndex = getUserIndex(user.id);

    replaceUser(userIndex, user);

    const allUserTodos = getAllUserTodos(user.id);

    const todoToBeReturned = getTodo(allUserTodos, updatedTodo.id);

    return response.json(todoToBeReturned);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const {
      params: { id },
      user,
    } = request;

    const todoIndex = getTodoIndex(user.todos, id);

    const updatedTodo = {
      ...user.todos[todoIndex],
      done: true,
    };

    user.todos.splice(todoIndex, 1, { ...updatedTodo });

    const userIndex = getUserIndex(user.id);

    replaceUser(userIndex, user);

    const allUserTodos = getAllUserTodos(user.id);

    const todoToBeReturned = getTodo(allUserTodos, updatedTodo.id);

    return response.json(todoToBeReturned);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksExistsTodo,
  (request, response) => {
    const {
      params: { id },
      user,
    } = request;

    const todoIndex = getTodoIndex(user.todos, id);

    user.todos.splice(todoIndex, 1);

    const userIndex = getUserIndex(user.id);

    replaceUser(userIndex, user);

    return response.sendStatus(204);
  }
);

module.exports = app;
