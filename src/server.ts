import * as http from "http";
import * as WebSocket from "ws";
import jwt, { VerifyOptions } from "jsonwebtoken";
import { jwtKey } from "./config.json";
import { MessageType, IUser, AuthenticationType, IStatus, IncomingFriendRequest, PrivateMessage } from "./types";
import { Collection } from "./collection";
import userModel from "./schemas/user";
import { checkPassword, hashPassword } from "./functions/passwordValidation";
import mongoose from "mongoose";
import { checkIfFriendship, sendFriendRequest } from "./functions/friendship";
import friendshipModel from "./schemas/friendship";

const clients = new Collection<string, WebSocket>();
const openMessages = new Collection<string, PrivateMessage>();
const openFriendRequest = new Collection<string, IncomingFriendRequest>();

const server = http.createServer();
const wss = new WebSocket.Server({
  server,
  verifyClient: async function (info, callback) {
    var authentication = JSON.parse(String(info.req.headers.authentication)) as AuthenticationType;

    if (authentication.type == "auth_token") {
      var { token } = authentication;
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
      var { username, password } = authentication;

      if (!username || !password) callback(false, 401, "Unauthorized");
      else {
        const foundUser = await userModel.findOne({ username });
        if (!foundUser) callback(false, 401, "Unauthorized");
        else {
          const comparedPassword = await checkPassword(password, String(foundUser.password));
          if (!comparedPassword) callback(false, 401, "Unauthorized");
          else {
            const user: IUser = { createdAt: foundUser.createdAt, id: foundUser.id, username: foundUser.username };
            info.req.user = user;
            info.req.token = jwt.sign(user, jwtKey, { expiresIn: 1 * 24 * 60 * 60 * 1000 });
            callback(true, 201, "Authorized");
          }
        }
      }
    } else if (authentication.type == "auth_register") {
      var { username, password, email } = authentication;

      if (!username || !password || !email) callback(false, 401, "Unauthorized");
      else {
        const foundUser = await userModel.findOne({ username });
        if (foundUser) callback(false, 401, "Unauthorized");
        else {
          new userModel({
            username,
            password: await hashPassword(password),
            email,
          })
            .save()
            .then((newUser) => {
              const user: IUser = { createdAt: newUser.createdAt, id: newUser.id, username: newUser.username };
              info.req.user = user;
              info.req.token = jwt.sign(user, jwtKey, { expiresIn: 1 * 24 * 60 * 60 * 1000 });
              callback(true, 201, "Authorized");
            })
            .catch((err) => {
              callback(false, 401, "Unauthorized");
              console.log(err);
            });
        }
      }
    } else {
      callback(false, 401, "Unauthorized");
    }
  },
});

wss.on("connection", (socket: WebSocket, req) => {
  clients.set(req.user.id, socket);

  if (openMessages.has(req.user.id)) {
    openMessages.forEach((message) => {
      socket.send(JSON.stringify(message));
    });
  }

  if (openFriendRequest.has(req.user.id)) {
    openFriendRequest.forEach((friendRequest) => {
      socket.send(JSON.stringify(friendRequest));
    });
  }

  const authenticationStatus: IStatus = {
    type: "authentication_status",
    message: { user: req.user, token: req.token },
  };

  socket.send(JSON.stringify(authenticationStatus));

  socket.on("message", async (data: MessageType) => {
    const messageData = JSON.parse(String(data)) as MessageType;

    if (messageData.type == "private_message") {
      var { target_id, author_id } = messageData;

      const isFriend = await checkIfFriendship(author_id, target_id);

      if (!isFriend) return;
      else {
        const target_websocket = clients.get(target_id);
        if (!target_websocket) {
          // TODO: target_websocket offline
          openMessages.set(messageData.target_id, messageData);
        } else {
          target_websocket.send(JSON.stringify(messageData));
        }
      }
    } else if (messageData.type == "friend_request") {
      var { target_name, author_id } = messageData;

      if (!target_name || !author_id) return;
      else {
        const found_target = await userModel.findOne({ username: target_name });
        const found_author = await userModel.findById(author_id);

        if (!found_author || !found_target) return;
        else {
          const isOpenRequest = await sendFriendRequest(found_author.id, found_target.id);

          if (isOpenRequest) {
            const incomingFriendRequest: IncomingFriendRequest = {
              type: "incoming_friend_request",
              author_name: found_author.username,
              target_name: found_target.username,
              status: "pending",
            };

            const target_websocket = clients.get(found_target.id);
            if (!target_websocket) {
              // TODO: target_websocket offline
              openFriendRequest.set(found_target.id, incomingFriendRequest);
            } else {
              target_websocket.send(JSON.stringify(incomingFriendRequest));
              socket.send(JSON.stringify(incomingFriendRequest));
            }
          } else {
            // TODO: already send a friend_request
          }
        }
      }
    } else if (messageData.type == "accepted_friend_request") {
      var { target_name, author_id } = messageData;

      if (!target_name || !author_id) return;
      else {
        const found_target = await userModel.findOne({ username: target_name });
        const found_author = await userModel.findById(author_id);

        if (!found_author || !found_target) return;
        else {
          const pendingFriendRequest = await friendshipModel.findOne({
            $or: [
              { user1: found_author.id, user2: found_target.id },
              { user1: found_target.id, user2: found_author.id },
            ],
          });

          if (!pendingFriendRequest) return;
          else {
            pendingFriendRequest.status = "accepted";
            pendingFriendRequest.save();

            const incomingFriendRequest: IncomingFriendRequest = {
              type: "incoming_friend_request",
              author_name: found_author.username,
              target_name: found_target.username,
              status: "accepted",
            };

            const target_websocket = clients.get(found_target.id);
            if (!target_websocket) {
              // TODO: target_websocket offline
              openFriendRequest.set(found_target.id, incomingFriendRequest);
            } else {
              target_websocket.send(JSON.stringify(incomingFriendRequest));
              socket.send(JSON.stringify(incomingFriendRequest));
            }
          }
        }
      }
    } else {
      const invalidMessageType: IStatus = {
        type: "invalid_message_type",
        message: "Invalid message type",
      };
      socket.send(JSON.stringify(invalidMessageType));
    }
  });
});

mongoose.connect("mongodb://127.0.0.1/whispr").then(() => {
  console.log("mongoose connection established");
  server.listen(3000, () => {
    console.log("server is running on port: 3000");
  });
});
