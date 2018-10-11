const path = require("path");
const Mali = require("Mali");

const PROTO_PATH = path.resolve(__dirname, "./protos/todo.proto");

const todosCollection = [];

const createTodo = async ctx => {
  // Grab the todo from the request
  const { todo: todoPayload } = ctx.request.req;

  // Add an ID
  todoPayload.id = todosCollection.length;

  // Push to the array
  todosCollection.push(todoPayload);

  // Set the response to be the mutated todo
  ctx.res = {
    todo: todoPayload
  };
};

const getTodos = async ctx => {
  ctx.res = {
    todos: todosCollection
  };
};

const updateTodo = async ctx => {
  // Grab the todo from the request
  const { todo: todoPayload } = ctx.request.req;

  // Find the todo to update
  const todoIndex = todosCollection.findIndex(
    todo => todoPayload.id === todo.id
  );

  // Only update if found
  if (todoIndex !== -1) {
    todosCollection[todoIndex].done = todoPayload.done;
    todosCollection[todoIndex].name = todoPayload.name;
  }

  ctx.res = {
    todo: todosCollection[todoIndex]
  };
};

const main = () => {
  const app = new Mali(PROTO_PATH, "Todos", {
    defaults: true
  });
  app.use({ createTodo, getTodos, updateTodo });
  app.start("127.0.0.1:50051");
  console.log("Listening...");
};

main();
