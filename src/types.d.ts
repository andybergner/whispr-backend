export type User = {
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
  author: User;
  targetID: string;
  message: Message;
}

// Typ für friend_request
interface FriendRequest {
  type: "friend_request";
  // ... (fülle die Eigenschaften entsprechend aus)
}

// Typ für create_group
interface CreateGroup {
  type: "create_group";
  // ... (fülle die Eigenschaften entsprechend aus)
}

type MessageType = PrivateMessage | FriendRequest | CreateGroup;

declare module "http" {
  interface IncomingMessage {
    user: User; // Replace 'any' with the actual type of your 'user' property
  }
}
