const { exec } = require("child_process");

const server = exec("npm run dev");

server.stdout.on("data", (data) => {
  console.log(data.toString());
});

server.stderr.on("data", (data) => {
  console.error(data.toString());
});