// import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { CronJob } from 'cron';
import { NimoGifter } from './configs/NimoGifter';
import { start1Round } from './helpers/handleGift';

dotenv.config();

// const { BOT_TOKEN } = process.env;
// const URL = process.env.URL || 'https://your-heroku-app.herokuapp.com';
// const bot = new Telegraf(BOT_TOKEN!);
// bot.telegram.setWebhook(`${URL}/bot${BOT_TOKEN}`);

let job: CronJob | null = null;

let nimoGifter: NimoGifter | null = null;

// bot.command('nimo', (ctx: any) => {
//   ctx.telegram.sendMessage(
//     ctx.chat.id,
//     'Săn trứng nimo tool!!',
//     {
//       reply_markup: {
//         inline_keyboard: [
//           [
//             {
//               text: 'Start', callback_data: 'START'
//             },
//           ]
//         ]
//       }
//     }
//   )
// })

// bot.action('START', async (ctx) => {
//   ctx.deleteMessage();
//   ctx.reply('Start!!');
//   try {
//     if (nimoGifter) {
//       ctx.reply('reset!!');
//       nimoGifter.browser?.close();
//       if (job) {
//         job.stop()
//       }
//     }
//     nimoGifter = new NimoGifter();
//     await nimoGifter.init();

//     await start1Round(nimoGifter);

//     job = new CronJob('*/7 * * * *', async () => {
//       if (!nimoGifter) {
//         throw new Error('Chưa khởi tạo bot')
//       }
//       await nimoGifter.reloadMainPage();
//       await start1Round(nimoGifter);

//     }, null, true, 'America/Los_Angeles');
//     job.start();
//   } catch (e) {
//     ctx.reply('Có lỗi!!');
//     ctx.reply(e.toString());

//   }
// })

// bot.action('STOP', async (ctx) => {
//   try {
//     if (nimoGifter) {
//       nimoGifter.browser?.close();
//     }
//     if (job) {
//       job.stop()
//     }
//     ctx.reply('stop!!');
//   } catch (e) {
//     ctx.reply('Có lỗi!!');

//   }
// })

// bot.action('LIVES', async (ctx) => {
//   try {
//     ctx.reply(`có ${nimoGifter?.listIgnore || 0} trang có trứng`);
//   } catch (e) {
//     ctx.reply('Có lỗi!!');

//   }
// })

// bot.launch();

const main = async () => {

  nimoGifter = new NimoGifter();
  await nimoGifter.init();
  
  await start1Round(nimoGifter);
  
  job = new CronJob('*/7 * * * *', async () => {
    if (!nimoGifter) {
      throw new Error('Chưa khởi tạo bot')
    }
    await nimoGifter.reloadMainPage();
    await start1Round(nimoGifter);
  
  }, null, true, 'America/Los_Angeles');
  job.start();
};

main();


process.on('SIGINT', () => {
  console.log(`Process ${process.pid} has been interrupted`);
  nimoGifter?.closeAllBrowers().then(() => {
    process.exit(0)
  });

})
