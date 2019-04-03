// Exporting a new class PostedMessage so it can be used outside of this file.
export class Meme {
  id: i32;
  sender: string;
  timeMs: i32;
  imgUrl: string;
  topText: string;
  middleText: string;
  bottomText: string;
}