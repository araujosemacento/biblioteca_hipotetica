import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import * as cheerio from 'cheerio';

puppeteer.use(StealthPlugin());

/**
 * Consulta uma página de detalhes de um livro na Biblioteca Nacional
 * e retorna um objeto com as informações do livro.
 *
 * @param {string} url URL da página de detalhes do livro
 * @returns {Promise<Object>} Um objeto com as informações do livro
 */
export async function consultarBN(url) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.goto(url, {
    waitUntil: 'domcontentloaded',
    timeout: 30000
  });

  const html = await page.content();
  await page.close();
  await browser.close();

  const $ = cheerio.load(html);

  const book = {
    title: $('h1.titulo[itemprop="name"]').first().text().trim(),
    material: $('p[itemprop="genre"]').text().trim(),
    language: $('p[itemprop="inLanguage"]').text().trim(),
    isbn_code: $('p[itemprop="isbn"]').text().trim(),
    dewey: $('.classifDewey').text().trim(),
    location: $('.localizacao').text().trim(),
    uniform_title: $('.outrosTitulos').text().trim(),
    publisher: $('p[itemprop="publisher"]').text().trim(),
    physical_description: $('p[itemprop="numberOfPages"]').text().trim(),
    general_note: $('.texto-completo').first().text().trim(),
    subjects: $('span[itemprop="about"] a').map((_, el) => $(el).text().trim()).get(),
    authors: $('span[itemprop="name"] a').map((_, el) => $(el).text().trim()).get(),
    cover_image: 'https://acervo.bn.gov.br' + $('img[itemprop="image"]').attr('src')
  };

  return book;
};

// Exemplo de uso:
//const url = 'https://acervo.bn.gov.br/Sophia_web/acervo/detalhe/1739805';
//console.log(await consultarBN(url));