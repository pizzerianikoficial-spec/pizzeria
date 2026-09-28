import Pusher from "pusher-js";

const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
const key = import.meta.env.VITE_PUSHER_KEY;
const cluster = import.meta.env.VITE_PUSHER_CLUSTER || "mt1";

const normalizePrivateChannel = (channelName) => {
  if (!channelName) return channelName;

  return channelName.startsWith("private-") ||
    channelName.startsWith("presence-") ||
    channelName.startsWith("encrypted-")
    ? channelName
    : `private-${channelName}`;
};

export const pusherClient = key
  ? new Pusher(key, {
      cluster,
      forceTLS: true,
      enabledTransports: ["ws", "wss"],
      authorizer: (channel) => {
        return {
          authorize: (socketId, callback) => {
            fetch(`${apiBase}/pusher/auth`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include", // Envía automáticamente la cookie acceso_token al backend
              body: JSON.stringify({
                socket_id: socketId,
                channel_name: channel.name,
              }),
            })
              .then(async (response) => {
                if (!response.ok) {
                  const errorData = await response.json().catch(() => ({}));
                  throw new Error(
                    errorData.error ||
                      `Error de autenticación (${response.status})`,
                  );
                }
                return response.json();
              })
              .then((data) => {
                callback(null, data);
              })
              .catch((error) => {
                console.error("Error autenticando canal Pusher:", error);
                callback(error);
              });
          },
        };
      },
    })
  : null;

export const subscribeToPusher = ({ channelName, events }) => {
  if (!pusherClient || !channelName) {
    return () => {};
  }

  const normalizedChannelName = normalizePrivateChannel(channelName);

  // 1. Verificamos si el canal ya está creado en la instancia activa
  let channel = pusherClient.channel(normalizedChannelName);

  // 2. Solo llamamos a subscribe() (lo que dispara /auth) si el canal NO existe
  if (!channel) {
    channel = pusherClient.subscribe(normalizedChannelName);
  }

  const handlers = {};

  Object.entries(events).forEach(([eventName, handler]) => {
    channel.bind(eventName, handler);
    handlers[eventName] = handler;
  });

  // 3. Al desmontar, desvinculamos solo los oyentes, manteniendo el canal abierto
  const unsubscribe = () => {
    Object.entries(handlers).forEach(([eventName, handler]) => {
      channel.unbind(eventName, handler);
    });
  };

  return unsubscribe;
};
