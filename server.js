const path = require("path");
const Mali = require("mali");

const PROTO_PATH = path.resolve(__dirname, "./protos/hello.proto");

const echo = async ctx => {
  console.log("Received request.");
  console.log(ctx.res);
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
  app.start("0.0.0.0:50051");
  console.log("Listening...");
};

main();
