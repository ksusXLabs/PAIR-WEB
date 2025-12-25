const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
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
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get("/", async (req, res) => {
  let num = req.query.number;

  async function IzumiPair() {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    try {
      let IzumiPairWeb = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: "fatal" }).child({ level: "fatal" })
          ),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
      });

      if (!IzumiPairWeb.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, "");
        const code = await IzumiPairWeb.requestPairingCode(num);
        if (!res.headersSent) {
          await res.send({ code });
        }
      }

      IzumiPairWeb.ev.on("creds.update", saveCreds);

      IzumiPairWeb.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;

        if (connection === "open") {
          try {
            await delay(10000);

            const auth_path = "./session/";
            const user_jid = jidNormalizedUser(IzumiPairWeb.user.id);

            function randomMegaId(length = 6, numberLength = 4) {
              const characters =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              let result = "";
              for (let i = 0; i < length; i++) {
                result += characters.charAt(
                  Math.floor(Math.random() * characters.length)
                );
              }
              const number = Math.floor(
                Math.random() * Math.pow(10, numberLength)
              );
              return `${result}${number}`;
            }

            const mega_url = await upload(
              fs.createReadStream(auth_path + "creds.json"),
              `${randomMegaId()}.json`
            );

            const string_session = mega_url.replace(
              "https://mega.nz/file/",
              ""
            );

            /* =========================
               IZUMI LITE – AESTHETIC MSG
               ========================= */

            const caption = `
🎀 𝙄𝙕𝙐𝙈𝙄 𝙇𝙄𝙏𝙀 – 𝙎𝙀𝙎𝙎𝙄𝙊𝙉 𝘾𝙊𝘿𝙀 🎀

━━━━━━━━━━━━━━━━━━
𝒀𝒐𝒖𝒓 𝑾𝒉𝒂𝒕𝒔𝒂𝒑𝒑 𝑺𝒆𝒔𝒔𝒊𝒐𝒏
━━━━━━━━━━━━━━━━━━

❝  ${string_session}  ❞

━━━━━━━━━━━━━━━━━━
𝙄𝙉𝙎𝙏𝙍𝙐𝘾𝙏𝙄𝙊𝙉𝙎
━━━━━━━━━━━━━━━━━━
• Copy this Session ID  
• Paste it into your bot config file  
• Do NOT share this with anyone  

⚠️ Session security is your responsibility

━━━━━━━━━━━━━━━━━━
🌸 𝘿𝙚𝙫. 𝙍𝙖𝙗𝙗𝙞𝙩𝙕𝙯 🥕
━━━━━━━━━━━━━━━━━━
`;

            await IzumiPairWeb.sendMessage(user_jid, {
              image: {
                url: "https://files.catbox.moe/47wr3a.jpeg",
              },
              caption: caption,
            });

          } catch (e) {
            exec("pm2 restart izumi");
          }

          await delay(100);
          await removeFile("./session");
          process.exit(0);
        }

        else if (
          connection === "close" &&
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output.statusCode !== 401
        ) {
          await delay(10000);
          IzumiPair();
        }
      });

    } catch (err) {
      exec("pm2 restart izumi");
      await removeFile("./session");
      if (!res.headersSent) {
        await res.send({ code: "Service Unavailable" });
      }
    }
  }

  return await IzumiPair();
});

process.on("uncaughtException", function (err) {
  console.log("Caught exception: " + err);
  exec("pm2 restart izumi");
});

module.exports = router;
