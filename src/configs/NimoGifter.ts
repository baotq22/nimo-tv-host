import puppeteer, { Browser, Page } from "puppeteer";
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const { NIMO_USERNAME, NIMO_PASSWORD } = process.env;
export class NimoGifter {

  browers: Browser[] = [];


  browser: Browser | null = null;

  HOST_NAME = 'https://www.nimo.tv';

  DIRECT_URL = `${this.HOST_NAME}/lives`;

  mainPage: Page | null = null

  listIgnore: string[] = [];

  dataDir = './data';

  init = async () => {
    this.browser = await puppeteer.launch({
      headless: false,
      handleSIGINT: true,
      handleSIGHUP: true,
      handleSIGTERM: true,
      args: [
        '--window-size=1920,1080',
      ],
      // args: [
      //   '--no-sandbox',
      //   '--disable-setuid-sandbox',
      //   "--incognito",
      //   "--no-zygote",
      //   // "--single-process"
      // ],
    });
    this.browers.push(this.browser);
    this.mainPage = await this.browser.newPage();
    await this.mainPage.setViewport({
      width: 1500,
      height: 1000
    });
    const cookies = await this.getCookie();
    for (const cookie of cookies) {
      this.mainPage.setCookie(cookie);
    }
    await this.mainPage.goto(this.DIRECT_URL);
    await this.loginNimo();
    await this.autoScroll();
  }

  reloadMainPage = async () => {
    if (!this.mainPage) throw new Error(`Open ${this.DIRECT_URL} first`)
    await this.mainPage.reload({ waitUntil: ["networkidle0", "domcontentloaded"] });
    await this.autoScroll();
  }

  loginNimo = async () => {
    if (!this.mainPage) throw new Error(`Open ${this.DIRECT_URL} first`)
    const element = await this.mainPage.waitForSelector('.nimo-btn-group.reg-login-btn', { timeout: 3000 }).catch(console.log);
    if (element) {

      const isLogin = await this.mainPage.evaluate(() => {
        const listBtn = Array.from(document.querySelectorAll('.nimo-btn-group.reg-login-btn'));
        if (listBtn.length === 2) {
          const button = listBtn[1].querySelector('button');
          button?.click();
          return true;
        }
        return false;
      })
      if (isLogin) {
        await this.mainPage.waitForSelector('input.phone-number-input', { timeout: 5000 });
        await this.mainPage.type('input.phone-number-input', NIMO_USERNAME!);
        await this.mainPage.type('input[type=password]', NIMO_PASSWORD!);
        await this.mainPage.waitForSelector('button.nimo-login-body-button', { timeout: 5000 });

        await this.mainPage.click('button.nimo-login-body-button');
        await this.mainPage.waitFor(10000);
        // await this.mainPage.waitForNavigation({waitUntil: 'load'});
        await this.setCookie();
      }
    }

    await this.mainPage.click('.nimo-header-c-country-entry');
    // await this.mainPage.waitForSelector('.CountryList__item', { timeout: 5000 });
    await this.mainPage.waitFor(1000);
    await this.mainPage.click('.CountryList__item[title="Global"]');

  }

  takeGift = async (link?: string) => {
    if (!link) return
    if (!this.browser) throw new Error('Not found browser');
    const cookies = await this.mainPage!.cookies();
    const browser = await puppeteer.launch({
      headless: false,
      handleSIGINT: true,
      handleSIGHUP: true,
      handleSIGTERM: true,
      timeout: 5000,
      args: [
        '--window-size=1725,500',
      ],
    });
    this.browers.push(browser);


    const [page] = await browser.pages();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['image', 'font'].indexOf(request.resourceType()) !== -1) {
        request.abort();
      } else {
        request.continue();
      }
    });
    for (const cookie of cookies) {
      page.setCookie(cookie);
    }
    await page.setViewport({
      width: 1200,
      height: 800
    });
    await page.goto(`${this.HOST_NAME}${link}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitFor(25000);
    // await page.evaluate(() => {
    //   const listClass = [
    //     'nimo-room__player__wrap',
    //     'nimo-room-replay-tab',
    //     'n-as-mrgh-xxs-back n-fx-bn'];
    //   for (const className of listClass) {
    //     const elements = document.getElementsByClassName(`${className}`);
    //     for (const element of Array.from(elements)) {
    //       element?.parentNode?.removeChild(element);
    //     }
    //   }
    // })
    this.listIgnore.push(link);

    const time2Close = await page.evaluate(() => {
      const boxGift = document.querySelector('.nimo-box-gift__box');
      const quantity = document.querySelector('.nimo-box-gift__box .nimo-badge-count') as HTMLElement;
      const title = document.querySelector('.nimo-rm_title-name') as HTMLElement;
      console.log(title?.innerText, !!boxGift);
      if (boxGift) {
        const MAX_TIME = parseInt(quantity?.innerText || '1') * 60000 * 3;
        let isClick = false;
        const timmer = setInterval(() => {
          const btn = document.querySelector('.nimo-box-gift__box__btn') as HTMLElement;
          if (btn && !isClick) {
            btn?.click();
            isClick = true;
            setTimeout(() => {
              isClick = false;
            }, 1000)
          }
        }, 1);
        setTimeout(() => {
          clearInterval(timmer);
        }, MAX_TIME)
        return MAX_TIME
      }
      return 0
    });
    setTimeout(() => {
      const index2Delete = this.listIgnore.findIndex((item) => item === link);
      if (index2Delete !== -1) {
        this.listIgnore.splice(index2Delete, 1)
      }
      // page.close();
      browser.close();
    }, time2Close + 100)
  }

  getListLink = async () => {
    if (!this.mainPage) throw new Error(`Open ${this.DIRECT_URL} first`);

    await this.mainPage.waitForSelector('.controlZindex');
    const list = await this.mainPage.evaluate(() => {
      let items = Array.from(document.querySelectorAll(".controlZindex"));
      const res = items.map((item) => item.getAttribute("href"));
      return res
    })

    return list.filter((link) => link && !this.listIgnore.includes(link))
  }

  autoScroll = async () => {
    if (!this.mainPage) throw new Error(`Open ${this.DIRECT_URL} first`);

    await this.mainPage.evaluate(() => {
      return new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;

        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight *6/7 ;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve('')
          }
        }, 300);
      })
    });
  }

  closeAllBrowers = async () => {
    for await (const br of this.browers) {
      br.close();
    }
  }

  setCookie = async () => {
    if (!this.mainPage) throw new Error('Not found mainPage');

    const cookies = await this.mainPage!.cookies();
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
    fs.writeFileSync(`${this.dataDir}/cookies.json`, JSON.stringify({ cookies }));
    return cookies;
  }

  getCookie = async () => {
    if (!fs.existsSync(this.dataDir)) {
      const cookies = await this.setCookie();
      return cookies;
    };
    const data = fs.readFileSync(`${this.dataDir}/cookies.json`, 'utf8');
    const dataObject = JSON.parse(data);
    return dataObject.cookies

  }

}

