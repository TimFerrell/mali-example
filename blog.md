# Introduction

At Auth0 we’re responsible for responding to a large volume of queries within a relatively small period of time. For each API call that’s made we must perform a variety of tasks: token verification, rate limiting, data access, payload validation, and external API calls to name a few. 

Hitting target response metrics while performing all of these calls requires a fair amount of thought with regard to service design. As part of a recent feature introduction, we added a new call into our authentication flow. Given the criticality of this flow we needed to assure that the new functionality had minimal impact on response times and success rates.

During discovery, we analyzed what technologies would be the most effective in transforming and persisting our data, performing application logic, and what would be the most effective transport for the service. 

When starting off with an API, it’s easy to go with defaults: HTTP/1.x and JSON, and these are entirely reasonable selections. HTTP is a well supported, tooled and observable protocol, and JSON is the de-facto standard for transferring payloads between services on the internet.

During initial research of our new project we looked into different technologies to see which fit our needs best. One of the technologies we looked into was gRPC, because of promising results from we'd heard from our peers. 

## What is gRPC?

gRPC is a framework originally created by Google for internal usage, but has since been opened sourced. It leverages an HTTP/2 transport, and Protocol Buffers as its service definition language (these are defaults, and can be changed.)

One of the key characteristics of gRPC is that supports a compressed, full duplex stream over HTTP2. Once a client is connected to a server, either side is free to send and receive messages at will. This always-connected, full duplex connection is ideal for our service, as it allows the calling service to utilize a pre-established stream to call into the downstream service without delay.

Services are defined in a definition language called Protocol Buffers. Protocol Buffers allows for strongly typed services (endpoints), messages (payloads) and fields (properties). These definitions enable messages to be marshaled in binary format over an existing connection very effectively, and allow the consumer of the message to reduce the guesswork when unmarshaling them. 

In contrast, HTTP is more oriented for request/response pairs. What is more significant than HTTP is the overhead of JSON. When comparing a well structured message to a message whose format is undefined there are significant performance improvements.

## Why would you use it?

It’s important to call out that we’re not suggesting gRPC in all of your services, or even any of them. However, when performance is absolutely critical, and you have the ability to influence the service implementation, consumption, and infrastructure then gRPC is something you may want to look into.


## Setting up a gRPC app using Node

First, we’re going to get our project configured:

```bash
mkdir grpc-demo && cd $_ && npm init -y && npm i "grpc"@"^1.15.1" "mali"@"^0.9.1" "path"@"^0.12.7" "@grpc/proto-loader"@"~0.3.0"
```

This command creates a directory for our project, initializes NPM, and installs the packages that we’ll be using. 

### Server Implementation

Inside of our new directory we'll create a file called `server.js`, and wire up a very simple gRPC service.

```js
const path = require("path");
const Mali = require("Mali");

const PROTO_PATH = path.resolve(__dirname, "./protos/hello.proto");

const echo = async ctx => {
  ctx.res = {
    message: ctx.request.req.message,
    timestamp: Date.now()
  };
};

const main = () => {
  const app = new Mali(PROTO_PATH, "Hello", {
    defaults: true
  });
  app.use({ echo });
  app.start("127.0.0.1:50051");
  console.log("Listening...");
};

main();
```

This file is a very simple gRPC server that is implemented by using the Mali framework. Mali provides a way to implement gRPC services in a very simple way, in a design that's similar to how Koa handles HTTP services.

After our `require`s, we define the path that our `proto` file resides at (which we'll add below), and then create a function called `echo`.

`echo` is an async function that provides a `ctx` argument. `ctx` contains `request` property. To read from the request, we use `ctx.request.req.<field name>`. 

In our implementation of `echo`, we're taking the provided input of `ctx.request.req.message`, and setting it as `ctx.res.message`, effectively echoing the input. We're also returning the current time to the caller via `timestamp` by calling `Date.now()`.

There's no need to return from the `echo` function; setting `ctx.res` with the fields you desire is all that's needed for the response to be delivered to the caller.

We use the `main` function as the entry point for our server. It's fairly simple, we create a new instance of `Mali`, provide the path to our service defintion, the name of our service, and some other configuration that's passed to the underlying Node library.

We then tell Mali to use the `echo` function we provided earlier, and listen locally on port `50051`. 

That's it. We're now listening. 


### Service Definition


We'll also add another file at the path of `protos/hello.proto`, which these contents:

```proto
syntax = "proto3";

service Hello {
    rpc Echo (EchoRequest) returns (EchoResponse) {};
}

message EchoRequest {
    string message = 1;
}

message EchoResponse {
    string message = 1;
    int32 timestamp = 2;
}
```

Before we jump into what's happening the in the server implementation, it's important to understand what's happening
in this `.proto` file. As stated above, gRPC uses Protocol Buffers for its service definition language. `hello.proto` is a 
Protocol Buffer file, which contains our service definition, along with the messages that our service will be using. 

Let's break down what's happening in this file.

```proto
syntax = "proto3";
```

This line defines the syntax that the file is using. There are multiple versions of Protocol Buffer syntax. This syntax
uses the latest version available at the time of writing. 

```proto
service Hello {
    rpc Echo (EchoRequest) returns (EchoResponse) {};
}
```

This section defines a `service`, which is what gRPC will use to expose a set of RPC endpoints. This example only exposes
the `Echo` RPC, which accepts a response message of `EchoRequest`, and returns a request message of `EchoResponse`.

```proto
 message EchoRequest {
     string message = 1;
 }
 
 message EchoResponse {
     string message = 1;
     int32 timestamp = 2;
 }
```

`EchoRequest` is a message containing only one field, `message`. `message` is a string (other types will be rejected by the server and client),
and it has a field number of `1`. Field numbers are used to indicate the unique index of a field within a message. These are used by the server 
and client to serialize and deserialize the message from binary format. 

`EchoResponse` is a message too, but has two fields `message` and `timestamp`. You may notice that it has the same field number, `1` as we used in 
the `EchoRequest`. Field numbers are unique to a message, so this is not a problem for us. We also add the new field `timestamp`. We will use this field
for returning the timestamp that the message was received at.


## Calling the API

At this point we have enough to begin calling our `Echo` RPC endpoint.

To do this, we'll install the `grpcc` client globally. We do this using `npm i -g grpcc`. Now that the `grpcc` client is installed, we can call start our service, and invoke an RPC endpoint.

From the project directory: `npm start` (start this in a terminal window)

In another terminal (again from the project directory), run `grpcc -i -p protos/hello.proto -a 127.0.0.1:50051 -e 'client.echo({message:"Hello"}, printReply)'`

Flags:
```
-i: stands up an insecure client (we need this because our service is listening insecurely)
-p: is the path to the proto definition
-a: specifies the address to the host and port that the service is listening on
-e: provides the command to be executed against the service 
```

The statement we provide to `grpcc` takes advantage of a few variables within the test client. `client` is an instantiated client of the service we provided earlier. In this case, `client` represents the `Hello` service. We use `client`, and call the `echo` function, which is converted to a RPC, and sent to the server. 

The first argument of the `echo` function is an object containing the named fields of `EchoRequest`. As you can see, we provide `message`, which is the only field in `EchoRequest`. The final argument is `printReply`, which is a callback variable provided by `grpcc`. This prints the reply of the RPC to the terminal so that we can observe the output.

If everything worked correctly, you should see this output from `grpcc`: 


```json
{
  "message": "Hello",
  "timestamp": "1546892703355"
}
```

Here, we see the response provided by our server. Just like we expected, we can see the two fields that we defined within `EchoResponse`: `message`, and `timestamp`. The `timestamp` field returns the current time, and the `message` field contains the message that we provided within our request.

## Conclusion

TODO: Marketing/Dan knows what to write here. 
