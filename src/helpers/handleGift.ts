import { NimoGifter } from "src/configs/NimoGifter";

const start1Round = async (nimoGifter: NimoGifter) => {
  try {

    const listLink: any = [];
    let temp: any = []
    const list = await nimoGifter.getListLink();
    list.forEach((item, index) => {
      temp.push(item)
      // listLink.push(item)
      if(index % 3 === 0) {
        listLink.push(temp);
        temp = []
      }
    });
    for await (const [link1, link2, link3] of listLink) {
      // await nimoGifter.takeGift('/live/2622862')
      await Promise.all([
        nimoGifter.takeGift(link1).catch(console.log),
        nimoGifter.takeGift(link2).catch(console.log),
         nimoGifter.takeGift(link3).catch(console.log),
        //  nimoGifter.takeGift(link4).catch(console.log),
        //  nimoGifter.takeGift(link5).catch(console.log),

      ])
    }

  } catch (e) {
    console.log(e);
  }

  // await browser.close();
};

export { start1Round }
