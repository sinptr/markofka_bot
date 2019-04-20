require('dotenv').config();
const moment = require('moment');
const TelegramBot = require('node-telegram-bot-api');

const token = process.env.TOKEN;
let stickers = [];
let topSticker = {};
const users = new Map();
const utcOffset = 180; // Europe/Moscow
const options = { polling: true };

if (String(process.env.NODE_ENV).trim() === 'develop') {
  const Agent = require('socks5-https-client/lib/Agent');
  options.request = {
    agentClass: Agent,
    agentOptions: {
      socksHost: process.env.SOCKS5_HOST,
      socksPort: Number(process.env.SOCKS5_PORT),
    }
  };
}

const bot = new TelegramBot(token, options);

const getStickers = async (...args) => {
  const promises = args.map(setName => bot.getStickerSet(setName));
  const res = await Promise.all(promises);
  return res.map(({ stickers }) => stickers).reduce((arr, item) => [...arr, ...item], []);
};

getStickers('SmugSempai').then(res => {
  stickers = res;
});

getStickers('Hate_everything').then(res => {
  topSticker = res.find(({ emoji }) => emoji === '🙉')
});

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  if (!users.has(chatId)) {
    users.set(chatId, {
      time: '13:39',
      lastMsgTime: moment().utcOffset(utcOffset).add( -2, 'hours'),
    });
  }
});

bot.onText(/\/stop/, msg => {
  users.delete(msg.chat.id);
});

setInterval(function() {
  const curTime = moment().utcOffset(utcOffset);
  if (curTime.hours() > 10 && curTime.hours() < 21) {
    users.forEach((user, chatId) => {
      if (curTime.format('H:mm') === user.time) {
        bot.sendSticker(chatId, topSticker.file_id)
            .catch(console.log);
      }
      if (curTime.diff(user.lastMsgTime, 'hours') >= 2 && curTime.minutes() === 0) {
        bot.sendSticker(chatId, stickers[Math.floor(Math.random() * stickers.length)].file_id)
            .catch(console.log);
        user.lastMsgTime = moment().utcOffset(utcOffset);
      }
    })
  }
},60000);