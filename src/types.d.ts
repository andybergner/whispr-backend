export type IUser = {
  username: string;
  id: string;
  createdAt: Date;
};

export interface Message {
  content: string;
  createdAt: Date;
}

export interface FriendRequestMessage {
  type: "friend_request_message";
  from: string;
}

export interface PrivateMessage {
  type: "private_message";
  author_id: string;
  target_id: string;
  message: Message;
}

export interface FriendRequest {
  type: "friend_request";
  author_id: string;
  target_name: string;
}

export interface AcceptedFriendRequest {
  type: "accepted_friend_request";
  author_id: string;
  target_name: string;
}

export interface IncomingFriendRequest {
  type: "incoming_friend_request";
  author_name: string;
  target_name: string;
  status: string;
}

export type MessageType = PrivateMessage | FriendRequest | AcceptedFriendRequest;

export interface IToken {
  type: "auth_token";
  token: string;
}

export interface ILogin {
  type: "auth_login";
  password: string;
  username: string;
}

export interface IRegister {
  type: "auth_register";
  password: string;
  username: string;
  email: string;
}

export type AuthenticationType = ILogin | IToken | IRegister;

export interface IAuthStatus {
  user: IUser;
  token: string;
}

export const StatusType = {
  authentication_status: "authentication_status",
  invalid_message_type: "invalid_message_type",
};

export interface IStatus {
  type: keyof typeof StatusType;
  message: IAuthStatus | string;
}

declare module "http" {
  interface IncomingMessage {
    user: IUser; // Replace 'any' with the actual type of your 'user' property
    token: string;
  }
  interface IncomingHttpHeaders {
    authentication: AuthenticationType;
    token: string;
  }
}
