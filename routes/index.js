var express = require('express');
var router = express.Router();
const puppeteer = require('puppeteer')
const fs = require('fs')

/* GET home page. */
router.get('/', async function (req, res, next) {
  await getData()
    .then((data) => {
      // res.json(data)
      fs.writeFile("diccionario.json", JSON.stringify(data), function (err, result) {
        if (err) console.log('error', err);
      });
      res.send('COMPLETADO!')
    })
    .catch((err) => {
      console.log(err)
    })
});

async function getData() {
  const browser = await puppeteer.launch({ headless: false, ignoreHTTPSErrors: true });
  const page = await browser.newPage();

  page.setDefaultTimeout(0);

  await page.goto('https://glosario.carpentries.org/en/');
  await page.setViewport({ width: 900, height: 768 });

  // Encontrar los términos
  const title = 'dt'
  await page.waitForSelector(title);
  const titulos = await page.evaluate(title => {
    const d = document.querySelectorAll(title);
    let a = []

    d.forEach(el => {
      a.push(el.innerHTML.trim())
    })

    return a
  }, title)

  const formateados = await page.evaluate(title => {
    const d = document.querySelectorAll(title);
    let a = []

    d.forEach(el => {
      a.push(el.innerHTML
        .trim()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase())
    })

    return a
  }, title)

  // Encontrar las definiciones
  const def = 'dd'
  await page.waitForSelector(def);
  const meanings = await page.evaluate(def => {
    const d = document.querySelectorAll(def);
    let a = []

    d.forEach(el => {
      let x = el.textContent.trim()
      let i = x.indexOf('\n')
      x = x.slice(0, i)
      a.push(x)
    })

    return a
  }, def)

  browser.close()

  let things = []

  for (let i = 0; i < titulos.length; i++) {
    things.push({
      term: titulos[i],
      normalized: formateados[i],
      meaning: meanings[i]
    })
  }

  return things
}

module.exports = router;
