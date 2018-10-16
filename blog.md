# Introduction

At Auth0 we’re responsible for responding to a large volume of queries within a relatively small period of time. For each API call that’s made, we must perform a variety of tasks: token verification, rate limiting, data access, payload validation, and external API calls to name a few. 

Hitting target response metrics while performing all of these calls requires a fair amount of thought with regard to service design. As part of a recent feature introduction, we added a new call into our authentication flow. Given the criticality of this flow we needed to assure that the new functionality had minimal impact on response times and success rates.

During discovery, we analyzed what technologies would be the most effective in transforming and persisting our data, performing application logic, and what would be the most effective transport for the service. 

When starting off with an API, it’s easy to go with defaults: HTTP/1.x and JSON, and these are entirely reasonable selections. HTTP is a well supported, tooled and observable protocol, and JSON is the de-facto standard for transferring payloads between services on the internet.

However, these technologies both carry an overhead with them that is negligible for most cases, but becomes apparent once you increase load. To overcome these challenges we selected gRPC as our service transport.

In this post we’ll cover why we made the selection we did, and how you could implement your own gRPC service using Node.js.

## What is gRPC?

gRPC is an framework, originally created by Google for internal usage, but has since been opened sourced. It leverages an HTTP/2 transport, and Protocol Buffers as its service definition language (these are defaults, and can be changed.)

One of the key characteristics of gRPC is that supports a compressed, full duplex stream over HTTP2. Once a client is connected to a server, either side is free to send and receive messages at will. This always-connected, full duplex connection is ideal for our service, as it allows the calling service to utilize a pre-established stream to call into the downstream service without delay.

Services are defined in a definition language called Protocol Buffers. Protocol Buffers allows for strongly typed services (endpoints), messages (payloads) and fields (properties). These definitions enable messages to be marshaled in binary format over an existing connection very effectively, and allow the consumer of the message to reduce the guesswork when unmarshalling them. (TODO: contrast with JSON)   Compact binary encoded messages, combined with a compressed, full duplex stream provided very attractive characteristics to our service.

In contrast, HTTP is more oriented for request/response pairs (TODO: quick note of caveats and other considerations). What is more significant than HTTP is the overhead of JSON. When comparing a well structured message to a message whose format is undefined there are significant performance improvements. (TODO: details on this.)

## Why would you use it?

It’s important to call out that we’re not suggesting gRPC as a replacement to all HTTP/RESTful services. However, when performance is absolutely critical, and you have the ability to influence the service implementation and consumption, then gRPC is something you may want to consider.


## Setting up a gRPC app using Node

First, we’re going to get our project configured:

```bash
mkdir grpc-demo && cd $_ && npm init -y && npm i "grpc"@"^1.15.1" "mali"@"^0.9.1" "path"@"^0.12.7" "@grpc/proto-loader"@"~0.3.0"
```

This command creates a directory for our project, initializes NPM, and installs the packages that we’ll be using. 

Inside of our new directory we'll create a file called `server.js`, and wire up a very simple gRPC service.

```js
const path = require("path");
const Mali = require("Mali");

const PROTO_PATH = path.resolve(__dirname, "./protos/hello.proto");

const echo = async ctx => {
  ctx.res = {
    message: ctx.request.res.message,
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

This section is going to use an insecure config
This section is going to illustrate how to call the RPC

Configuring a secure connection using SSL

TODO

Next Up

In future posts we will cover how to authenticate clients using JWTs.








