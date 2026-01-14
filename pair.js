const express = require("express");
const fs = require("fs");
let router = express.Router();
const pino = require("pino");

const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");

const { upload } = require("./mega");

function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

/* =======================
   FAKE META QUOTE OBJECT
   ======================= */
const meta = {
  key: {
    participant: `13135550002@s.whatsapp.net`,
    remoteJid: `13135550002@s.whatsapp.net`,
    fromMe: false,
    id: "FAKE_META_ukqw2pzpid",
  },
  message: {
    contactMessage: {
      displayName: "Danuz",
      vcard: `BEGIN:VCARD
VERSION:3.0
N:Danuz;;;;
FN:Danzz
TEL;waid=13135550002:+1 313 555 0002
END:VCARD`,
      sendEphemeral: true,
    },
  },
  messageTimestamp: 1762719363,
  pushName: "Meta AI",
};

router.get("/", async (req, res) => {
  let num = req.query.number;

  async function IzumiPair() {
    const { state, saveCreds } = await useMultiFileAuthState("./session");

    try {
      let IzumiPairWeb = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: "fatal" })
          ),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
      });

      if (!IzumiPairWeb.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, "");
        const code = await IzumiPairWeb.requestPairingCode(num);
        if (!res.headersSent) res.send({ code });
      }

      IzumiPairWeb.ev.on("creds.update", saveCreds);

      IzumiPairWeb.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;

        if (connection === "open") {
          try {
            await delay(10000);

            const auth_path = "./session/";
            const user_jid = jidNormalizedUser(IzumiPairWeb.user.id);

            function randomMegaId(len = 6, numLen = 4) {
              const chars =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              let out = "";
              for (let i = 0; i < len; i++) {
                out += chars[Math.floor(Math.random() * chars.length)];
              }
              return out + Math.floor(Math.random() * 10 ** numLen);
            }

            const mega_url = await upload(
              fs.createReadStream(auth_path + "creds.json"),
              `${randomMegaId()}.json`
            );

            const session_id = mega_url.replace(
              "https://mega.nz/file/",
              ""
            );

            const caption = `
🎀 𝐈𝐙𝐔𝐌𝐈 𝐋𝐈𝐓𝐄 – 𝐒𝐄𝐒𝐒𝐈𝐎𝐍 𝐈𝐃 🎀

❝ \`${session_id}\` ❞

• ᴅᴏ ɴᴏᴛ ꜱʜᴀʀᴇ ᴛʜɪꜱ ᴄᴏᴅᴇ
• ᴘᴀꜱᴛᴇ ɪɴᴛᴏ ʏᴏᴜʀ ʙᴏᴛ ᴄᴏɴꜰɪɢ

> Dev.RabbitZz 🥕
`;

            /* =======================
               SESSION MESSAGE
               ======================= */
            await IzumiPairWeb.sendMessage(user_jid, {
              image: { url: "https://www.movanest.xyz/LzhLzc.png" },
              caption,
            });

            /* =======================
               FAKE META QUOTED MESSAGE
               ======================= */
            await IzumiPairWeb.sendMessage(
              user_jid,
              { text: " " },
              { quoted: meta }
            );

            /* =======================
               THANK YOU MESSAGE
               ======================= */
            await IzumiPairWeb.sendMessage(
              user_jid,
              {
                text: `
✨ 𝐓𝐡𝐚𝐧𝐤 𝐘𝐨𝐮 ✨

Thank you for using  
🎀 *Izumi Session Generator Web* 🎀

We wish you a smooth & secure bot experience.

— Izumi Team
`,
              },
              { quoted: meta }
            );

          } catch (e) {
            console.error("IZUMI error:", e);
          }

          await delay(100);
          removeFile("./session");
          process.exit(0);
        }

        if (
          connection === "close" &&
          lastDisconnect?.error?.output?.statusCode !== 401
        ) {
          await delay(10000);
          IzumiPair();
        }
      });

    } catch (err) {
      console.error(err);
      removeFile("./session");
      if (!res.headersSent) res.send({ code: "Service Unavailable" });
    }
  }

  IzumiPair();
});

module.exports = router;
