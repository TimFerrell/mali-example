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
