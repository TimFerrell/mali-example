# Example gRPC Service using Mali

This example uses [Mali](https://github.com/malijs/mali) for providing a gRPC service. 
It's a very simple todo application that illustrates concepts 
at a high level.
 
It does not provide any safeguards that you'd expect in a real world application.

### Installing
Before the service can start it expects that all dependencies are provided; pull those down first.

`yarn install --pure-lockfile`

### Running
Launch the service!

`npm start`

## Calling the service
For this example we recommend using the [grpcc](https://github.com/njpatel/grpcc) client. It provides a very easy way to
prototype and iterate on your API.

`npm i -g grpcc`

Once installed, start the client from the directory that you cloned this repo to, then run:

`grpcc -i -p ./protos/todo.proto -a 127.0.0.1:50051`

This launches the client, configures it to interact with an insecure service listening at port `:50051`.

You should see output similar to this:
```
Connecting to unknown.Todos on 127.0.0.1:50051. Available globals:

  client - the client connection to Todos
    getTodos (GetTodosRequest, callback) returns GetTodosResponse
    createTodo (CreateTodoRequest, callback) returns CreateTodoResponse
    updateTodo (UpdateTodoRequest, callback) returns UpdateTodoResponse

  printReply - function to easily print a unary call reply (alias: pr)
  streamReply - function to easily print stream call replies (alias: sr)
  createMetadata - convert JS objects into grpc metadata instances (alias: cm)
  printMetadata - function to easily print a unary call's metadata (alias: pm)
```

All of the commands below should be entered from the `grpcc` client.
### Adding a todo
`client.createTodo({todo:{task:"Publish an example repo", done:false}}, pr);`

Returns:
```
Todos@127.0.0.1:50051>
{
  "todo": {
    "task": "Publish an example repo",
    "done": false,
    "id": 0
  }
}
```

### Updating a todo
`client.updateTodo({todo:{id:0, task:"Publish an example repo", done:true}}, pr);`

Returns:
```
{
  "todo": {
    "task": "Publish an example repo",
    "done": true,
    "id": 0
  }
}
```

### Getting all todos
`client.getTodos({}, pr);`

Returns:
```
Todos@127.0.0.1:50051>
{
  "todos": [
    {
      "task": "Publish an example repo",
      "done": true,
      "id": 0
    },
    {
      "task": "Publish a readme",
      "done": true,
      "id": 1
    }
  ]
}
```