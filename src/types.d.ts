export type IUser = {
  username: string;
  userID: string;
  createdAt: Date;
};

interface Message {
  content: string;
  createdAt: Date;
}

interface PrivateMessage {
  type: "private_message";
  author: IUser;
  targetID: string;
  message: Message;
}

type MessageType = PrivateMessage;

interface IToken {
  type: "auth_token";
  token: string;
}

interface ILogin {
  type: "auth_login";
  password: string;
  username: string;
}

interface IRegister {
  type: "auth_register";
  password: string;
  username: string;
  email: string;
}

type AuthenticationType = ILogin | IToken | IRegister;

declare module "http" {
  interface IncomingMessage {
    user: User; // Replace 'any' with the actual type of your 'user' property
  }
  interface IncomingHttpHeaders {
    authentication: AuthenticationType;
  }
}
