const express = require("express");
const app = express();
const port = 3001;

app.listen(port, () => {
  console.log("server running on port : ", port);
});
const {
  Client,
  Location,
  Poll,
  List,
  Buttons,
  LocalAuth,
} = require("whatsapp-web.js");

const client = new Client({
  authStrategy: new LocalAuth(),
  // proxyAuthentication: { username: 'username', password: 'password' },
  puppeteer: {
    // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
    headless: false,
  },
});

client.initialize();

client.on("loading_screen", (percent, message) => {
  console.log("LOADING SCREEN", percent, message);
});

client.on("qr", (qr) => {
  // NOTE: This event will not be fired if a session is specified.
  console.log("QR RECEIVED", qr);
});

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
});

client.on("auth_failure", (msg) => {
  // Fired if session restore was unsuccessful
  console.error("AUTHENTICATION FAILURE", msg);
});

client.on("ready", () => {
  console.log("READY");
});

client.on("message", async (msg) => {
  if (msg.body.toLowerCase() === "hai") {
    // Memeriksa jika pesan adalah 'hai' (tidak case sensitive)
    msg.reply(
      "Hallo, saya Noel! Saya adalah programmer mobile dan full stack. Saat ini saya bekerja dilembaga pendidikan milik keuskupan surabaya"
    );
  }
});

client.on("message_create", async (msg) => {
  // Fired on all message creations, including your own
  if (msg.fromMe) {
    // do stuff here
  }

  // Unpins a message
  if (msg.fromMe && msg.body.startsWith("!unpin")) {
    const pinnedMsg = await msg.getQuotedMessage();
    if (pinnedMsg) {
      // Will unpin a message
      const result = await pinnedMsg.unpin();
      console.log(result); // True if the operation completed successfully, false otherwise
    }
  }
});

client.on("message_ciphertext", (msg) => {
  // Receiving new incoming messages that have been encrypted
  // msg.type === 'ciphertext'
  msg.body = "Waiting for this message. Check your phone.";

  // do stuff here
});

client.on("message_revoke_everyone", async (after, before) => {
  // Fired whenever a message is deleted by anyone (including you)
  console.log(after); // message after it was deleted.
  if (before) {
    console.log(before); // message before it was deleted.
  }
});

client.on("message_revoke_me", async (msg) => {
  // Fired whenever a message is only deleted in your own view.
  console.log(msg.body); // message before it was deleted.
});

client.on("message_ack", (msg, ack) => {
  /*
        == ACK VALUES ==
        ACK_ERROR: -1
        ACK_PENDING: 0
        ACK_SERVER: 1
        ACK_DEVICE: 2
        ACK_READ: 3
        ACK_PLAYED: 4
    */

  if (ack == 3) {
    // The message was read
  }
});

client.on("group_join", (notification) => {
  // User has joined or been added to the group.
  console.log("join", notification);
  notification.reply("User joined.");
});

client.on("group_leave", (notification) => {
  // User has left or been kicked from the group.
  console.log("leave", notification);
  notification.reply("User left.");
});

client.on("group_update", (notification) => {
  // Group picture, subject or description has been updated.
  console.log("update", notification);
});

client.on("change_state", (state) => {
  console.log("CHANGE STATE", state);
});

// Change to false if you don't want to reject incoming calls
let rejectCalls = true;

client.on("call", async (call) => {
  console.log("Call received, rejecting. GOTO Line 261 to disable", call);
  if (rejectCalls) await call.reject();
  await client.sendMessage(
    call.from,
    `[${call.fromMe ? "Outgoing" : "Incoming"}] Phone call from ${
      call.from
    }, type ${call.isGroup ? "group" : ""} ${
      call.isVideo ? "video" : "audio"
    } call. ${
      rejectCalls ? "This call was automatically rejected by the script." : ""
    }`
  );
});

client.on("disconnected", (reason) => {
  console.log("Client was logged out", reason);
});

client.on("contact_changed", async (message, oldId, newId, isContact) => {
  /** The time the event occurred. */
  const eventTime = new Date(message.timestamp * 1000).toLocaleString();

  console.log(
    `The contact ${oldId.slice(0, -5)}` +
      `${
        !isContact
          ? " that participates in group " +
            `${(await client.getChatById(message.to ?? message.from)).name} `
          : " "
      }` +
      `changed their phone number\nat ${eventTime}.\n` +
      `Their new phone number is ${newId.slice(0, -5)}.\n`
  );

  /**
   * Information about the @param {message}:
   *
   * 1. If a notification was emitted due to a group participant changing their phone number:
   * @param {message.author} is a participant's id before the change.
   * @param {message.recipients[0]} is a participant's id after the change (a new one).
   *
   * 1.1 If the contact who changed their number WAS in the current user's contact list at the time of the change:
   * @param {message.to} is a group chat id the event was emitted in.
   * @param {message.from} is a current user's id that got an notification message in the group.
   * Also the @param {message.fromMe} is TRUE.
   *
   * 1.2 Otherwise:
   * @param {message.from} is a group chat id the event was emitted in.
   * @param {message.to} is @type {undefined}.
   * Also @param {message.fromMe} is FALSE.
   *
   * 2. If a notification was emitted due to a contact changing their phone number:
   * @param {message.templateParams} is an array of two user's ids:
   * the old (before the change) and a new one, stored in alphabetical order.
   * @param {message.from} is a current user's id that has a chat with a user,
   * whos phone number was changed.
   * @param {message.to} is a user's id (after the change), the current user has a chat with.
   */
});

client.on("group_admin_changed", (notification) => {
  if (notification.type === "promote") {
    /**
     * Emitted when a current user is promoted to an admin.
     * {@link notification.author} is a user who performs the action of promoting/demoting the current user.
     */
    console.log(`You were promoted by ${notification.author}`);
  } else if (notification.type === "demote")
    /** Emitted when a current user is demoted to a regular user. */
    console.log(`You were demoted by ${notification.author}`);
});

client.on("group_membership_request", async (notification) => {
  /**
   * The example of the {@link notification} output:
   * {
   *     id: {
   *         fromMe: false,
   *         remote: 'groupId@g.us',
   *         id: '123123123132132132',
   *         participant: 'number@c.us',
   *         _serialized: 'false_groupId@g.us_123123123132132132_number@c.us'
   *     },
   *     body: '',
   *     type: 'created_membership_requests',
   *     timestamp: 1694456538,
   *     chatId: 'groupId@g.us',
   *     author: 'number@c.us',
   *     recipientIds: []
   * }
   *
   */
  console.log(notification);
  /** You can approve or reject the newly appeared membership request: */
  await client.approveGroupMembershipRequestss(
    notification.chatId,
    notification.author
  );
  await client.rejectGroupMembershipRequests(
    notification.chatId,
    notification.author
  );
});
