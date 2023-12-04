import * as http from "http";
import * as WebSocket from "ws";
import jwt, { VerifyOptions } from "jsonwebtoken";
import { jwtKey } from "./config.json";
import { MessageType, IUser, AuthenticationType } from "./types";
import { Collection } from "./collection";

const clients = new Collection<string, WebSocket>();

const server = http.createServer();
const wss = new WebSocket.Server({
  server,
  verifyClient: function (info, callback) {
    var authentication = JSON.parse(String(info.req.headers.authentication)) as AuthenticationType;

    if (authentication.type == "auth_token") {
      var token = authentication.token;
      if (!token || typeof token != "string") callback(false, 401, "Unauthorized");
      else {
        const options: VerifyOptions = {};
        jwt.verify(token, jwtKey, options, function (err, decoded) {
          if (err) callback(false, 401, "Unauthorized");
          else {
            const decodedUser = decoded as IUser;
            if (!decodedUser) callback(false, 401, "Unauthorized");
            info.req.user = decodedUser;
            callback(true);
          }
        });
      }
    } else if (authentication.type == "auth_login") {
      console.log(authentication);
      callback(false, 401, "Unauthorized");
      // TODO: authentication login logik
    } else if (authentication.type == "auth_register") {
      console.log(authentication);
      callback(false, 401, "Unauthorized");
      // TODO: authentication register logik
    }
  },
});

wss.on("connection", (socket: WebSocket, req) => {
  clients.set(req.user.userID, socket);

  socket.on("message", (data: MessageType) => {
    const messageData = JSON.parse(String(data));

    if (messageData.type == "private_message") {
      const targetID = messageData.targetID;

      const target_websocket = clients.get(targetID);
      if (!target_websocket) return;

      target_websocket.send(JSON.stringify(messageData));
    }
  });
});

server.listen(3000, () => {
  console.log("server is running on port: 3000");
});
