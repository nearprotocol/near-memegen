import "allocator/arena";
export { memory };

import { context, storage, near } from "./near";

import { Meme } from "./model.near";

// --- contract code goes below 

// The maximum number of latest messages the contract returns.
const NUM_MESSAGES_KEY = "num";
const MEME_PREFIX = "m:";

// Adds a new message under the name of the sender's account id.
// NOTE: This is a change method. Which means it will modify the state.
// But right now we don't distinguish them with annotations yet.
export function addMeme(timeMs: i32, imgUrl: string, topText: string, middleText: string, bottomText: string): void {
  // Get the total number of messages as u64 type
  let num = getNumMemes();
  // Create a new instance of PostedMessage object
  let meme = new Meme();
  meme.id = num;
  meme.sender = context.sender;
  meme.timeMs = timeMs;
  meme.imgUrl = imgUrl;
  meme.topText = topText;
  meme.middleText = middleText;
  meme.bottomText = bottomText;
  // Storing serialized instance using a key like "message:5"
  storage.setBytes(
    MEME_PREFIX + meme.id.toString(),
    meme.encode()
  );
  num += 1;
  storage.setItem(NUM_MESSAGES_KEY, num.toString());
}

export function getNumMemes(): i32 {
  return I32.parseInt(storage.getItem(NUM_MESSAGES_KEY) || "0");
}

export function getMeme(id: i32): Meme {
  return Meme.decode(
      storage.getBytes(MEME_PREFIX + id.toString()));
}
