import { sign } from "jsonwebtoken";
import WebSocket from "ws";
import { PrivateMessage, IUser } from "./types";
import { jwtKey } from "./config.json";
import * as readline from "readline";

const id = Math.floor(Math.random() * 2000);
const user: IUser = { userID: String(id), username: `test-${id}`, createdAt: new Date() };

const socket = new WebSocket("ws://192.168.178.73:3000", {
  headers: {
    token: sign(user, jwtKey, { expiresIn: 1 * 24 * 60 * 60 * 1000 }),
  },
});

socket.on("message", function message(data) {
  console.log("received: %s", data);
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log(id);

var targetID: string;

rl.question("target id? :", function (string) {
  targetID = string;
  console.log(string, targetID);
});

rl.on("line", (input) => {
  const privateMessage: PrivateMessage = {
    type: "private_message",
    author: user,
    targetID: targetID,
    message: {
      content: input,
      createdAt: new Date(),
    },
  };

  socket.send(JSON.stringify(privateMessage));
});
