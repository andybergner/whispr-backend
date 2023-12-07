import { userInfo } from "os";
import friendshipModel from "../schemas/friendship";
import userModel from "../schemas/user";

export async function checkIfFriendship(userID1: string, userID2: string): Promise<boolean> {
  const foundFriendship = await friendshipModel
    .findOne({
      $or: [
        { user1: userID1, user2: userID2 },
        { user1: userID2, user2: userID1 },
      ],
      status: "accepted",
    })
    .catch(() => {
      console.log("test");
      return false;
    });

  console.log(foundFriendship !== null);

  return foundFriendship !== null;
}

export async function sendFriendRequest(author_id: string, target_id: string): Promise<boolean> {
  const existingFriendship = await friendshipModel.findOne({
    $or: [
      { user1: author_id, user2: target_id },
      { user1: target_id, user2: author_id },
    ],
  });

  if (existingFriendship) return false;
  else {
    const friendship = new friendshipModel({
      user1: author_id,
      user2: target_id,
    }).save();
    return true;
  }
}
