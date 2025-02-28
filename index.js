const puppeteer = require("puppeteer");
const fs = require("fs");
const readline = require("readline");
require('colors');
const { displayHeader } = require('./helpers');

const MAGICNEWTON_URL = "https://www.magicnewton.com/portal/rewards";
const DEFAULT_SLEEP_TIME = 24 * 60 * 60 * 1000;
const RANDOM_EXTRA_DELAY = () => Math.floor(Math.random() * (10 - 5 + 1) + 5) * 60 * 1000;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getCurrentTime() {
  const options = { timeZone: "Asia/Jakarta", hour12: false };
  return new Date().toLocaleString("id-ID", options);
}

async function runAccount(cookie, accountIndex) {
  try {
    const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
    const page = await browser.newPage();
    await page.setCookie(cookie);
    await page.goto(MAGICNEWTON_URL, { waitUntil: "networkidle2", timeout: 60000 });

    const userAddress = await page.$eval("p.gGRRlH.WrOCw.AEdnq.hGQgmY.jdmPpC", el => el.innerText).catch(() => "Unknown");
    console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] 🏠 Your account: ${userAddress}`);

    let userCredits = await page.$eval("#creditBalance", el => el.innerText).catch(() => "Unknown");
    console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] 💰 Total your points: ${userCredits}`);

    await page.waitForSelector("button", { timeout: 30000 });
    const rollNowClicked = await page.$$eval("button", buttons => {
      const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Roll now"));
      if (target) { target.click(); return true; }
      return false;
    });
    if (rollNowClicked) console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] ✅ Starting daily roll...`);
    await delay(5000);

    const letsRollClicked = await page.$$eval("button", buttons => {
      const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Let's roll"));
      if (target) { target.click(); return true; }
      return false;
    });

    if (letsRollClicked) {
      await delay(5000);
      const throwDiceClicked = await page.$$eval("button", buttons => {
        const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Throw Dice"));
        if (target) { target.click(); return true; }
        return false;
      });

      if (throwDiceClicked) {
        console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] ⏳ Waiting for 20 seconds for dice animation...`);
        await delay(20000);

        for (let i = 1; i <= 5; i++) {
          const pressClicked = await page.$$eval("p.gGRRlH.WrOCw.AEdnq.gTXAMX.gsjAMe", buttons => {
            const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Press"));
            if (target) {
              target.click();
              return true;
            }
            return false;
          });

          if (pressClicked) {
            console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] 🖱️ Press button clicked (${i}/5)`);
            await delay(10000);
            console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] ⏳ Waiting result point press...`);
            await delay(10000);
          } else {
            console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] ⚠️ 'Press' button not found.`);
            break;
          }
          await delay(10000);
        }

        console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] ⏳ Waiting before click Bank...`);
        await delay(10000);

        const bankClicked = await page.$$eval("button:nth-child(3) > div > p", buttons => {
          const target = buttons.find(btn => btn.innerText && btn.innerText.includes("Bank"));
          if (target) {
            target.click();
            return true;
          }
          return false;
        });

        if (bankClicked) {
          console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] 🏦 Bank button clicked.`);
          await delay(10000);
        } else {
          console.log(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] ⚠️ 'Bank' button not found.`);
        }
      }
    }
    await browser.close();
  } catch (error) {
    console.error(`${getCurrentTime()} - 🔹 [Account ${accountIndex}] ❌ An error occurred:`, error);
  }
}

(async () => {
  console.clear();
  displayHeader();
  console.log(`${getCurrentTime()} - 🚀 Starting MagicNewton Bot...`);
  const data = fs.readFileSync("data.txt", "utf8").split("\n").filter(Boolean);

  while (true) {
    try {
      console.log(`${getCurrentTime()} - 🔄 Starting your account...`);
      for (let i = 0; i < data.length; i++) {
        const cookie = { name: "__Secure-next-auth.session-token", value: data[i], domain: ".magicnewton.com", path: "/", secure: true, httpOnly: true };
        await runAccount(cookie, i + 1);
      }
    } catch (error) {
      console.error(`${getCurrentTime()} - ❌ An error occurred:`, error);
    }
    const extraDelay = RANDOM_EXTRA_DELAY();
    console.log(`${getCurrentTime()} - 🔄 Daily roll completed. Bot will run again in 24 hours + random delay of ${extraDelay / 60000} minutes...`);
    await delay(DEFAULT_SLEEP_TIME + extraDelay);
  }
})();
