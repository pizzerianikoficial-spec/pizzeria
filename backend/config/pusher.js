import Pusher from "pusher";
import dotenv from "dotenv";

dotenv.config();

export const normalizeChannelName = (channelName) => {
  if (!channelName) return channelName;

  return channelName.startsWith("private-") ||
    channelName.startsWith("presence-") ||
    channelName.startsWith("encrypted-")
    ? channelName
    : `private-${channelName}`;
};

const appId = process.env.PUSHER_APP_ID;
const key = process.env.PUSHER_KEY;
const secret = process.env.PUSHER_SECRET;
const cluster = process.env.PUSHER_CLUSTER || "mt1";

export const pusher =
  appId && key && secret
    ? new Pusher({
        appId,
        key,
        secret,
        cluster,
        useTLS: true,
      })
    : null;

export const emitPusherEvent = (channel, event, payload) => {
  if (!pusher) return false;
  const targetChannel = normalizeChannelName(channel);
  return pusher.trigger(targetChannel, event, payload);
};
