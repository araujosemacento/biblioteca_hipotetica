
# Inserçor para Banco de Dados I

Um conjunto de funções que funcionam basicamente como um CRUD pra cada tabela documentada no projeto da minha equipe de banco de dados.

## Referenciação

Os links abaixo levam a pacotes/bibliotecas que são essenciais pro uso e manipulação do código escrito, seria prudente olhar a ***Documentação*** de ambos(as), se não entender como algo funciona.

- [mysql2](https://www.npmjs.com/package/mysql2)
- [dotenv](https://www.npmjs.com/package/dotenv)
  
Para além disso, esse repositório não teria sido possível sem a ajuda do repositório [consultas_bn](https://github.com/libmin/consultas_bn) que foi generosamente feito público através de [libmin](https://github.com/libmin), que apesar de já não ser mais um repositório mantido ativamente, foi muito útil pra mim.

## Variáveis de Ambiente

Caso queira ignorar a sugestão anterior, é melhor saber pelo menos que, para rodar esse projeto você vai precisar criar um arquivo `.env`. As informações contidas nele não são salvas nos commits e isso é intencional, pra que cada pessoa que mexe no projeto possa acessar a database com suas próprias credenciais, afinal foi pra isso que eu criei elas... as variáveis de ambiente necessárias no seu arquivo .env são:

    DB_USER='<Seu_Usuario>'
    DB_PASSWORD='<Sua_Senha>'
    DB_ADDRESS='<Endereço_do_servidor>
    DB_NAME='Nome_da_Database'

E por favor, não esqueça que se as chamadas que você está fazendo nunca são completadas, não importa o que você muda no código e sempre mostram um erro de dependência, você provavelmente esqueceu de executar o comando `npm i` ou `npm install -y` pra que todas as dependências, ou seja, todos os pacotes que o código utiliza pra funcionar sejam instalados antes de executá-lo.

## Funcionalidades

- Tentativa de facilitar o armazenamento das informações sobre usuários, categorias, autores, livros, reservas e empréstimos no banco de dados do projeto.
- Funções feitas pra criar, ler (todos os itens, ou um item específicos), atualizar ou remover registros em cada uma das tabelas.
- Além disso, o código inclui o que acredito ser um modo eficiente de filtragem contra entradas exploradoras de vulnerabilidades, que "converte" caracteres especiais em caracteres de escape.

## Uso/Exemplos

    import puppeteer from 'puppeteer-extra';
    import StealthPlugin from 'puppeteer-extra-plugin-stealth';
    import * as cheerio from 'cheerio';
    import { createLivro, createCategoria, createAutor, getCategorias, getAutores } from './database.min.js';

    puppeteer.use(StealthPlugin());

    /**
     * Cadastra um livro na biblioteca a partir de uma URL da Biblioteca Nacional
     * @param {string} url - URL da página de detalhes do livro
     * @returns {Promise<Object>} Dados do livro cadastrado
     */
    export async function cadastrarLivroPelaURLDaBN(url) {
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
        title: $('h1.titulo[itemprop="name"]').first().text().trim() || 'Título Desconhecido',
        material: $('p[itemprop="genre"]').text().trim() || 'Material Desconhecido',
        language: $('p[itemprop="inLanguage"]').text().trim() || 'Idioma Desconhecido',
        isbn_code: $('p[itemprop="isbn"]').text().trim() || 'ISBN Desconhecido',
        dewey: $('.classifDewey').text().trim() || 'Classificação Desconhecida',
        location: $('.localizacao').text().trim() || 'Localização Desconhecida',
        uniform_title: $('.outrosTitulos').text().trim() || 'Sem título uniforme',
        publisher: $('p[itemprop="publisher"]').text().trim() || 'Editora Desconhecida',
        physical_description: $('p[itemprop="numberOfPages"]').text().trim() || 'Descrição física indisponível',
        general_note: $('.texto-completo').first().text().trim() || 'Sem notas',
        subjects: $('span[itemprop="about"] a').map((_, el) => $(el).text().trim()).get() || ['Assunto não classificado'],
        authors: $('span[itemprop="name"] a').map((_, el) => $(el).text().trim()).get() || ['Autor Desconhecido'],
        cover_image: 'https://acervo.bn.gov.br' + ($('img[itemprop="image"]').attr('src') || '/imagem-indisponivel.jpg')
      };

      // Cadastrar categorias
      const existingCategories = await getCategorias();
      for (const subject of book.subjects) {
        if (!existingCategories.some(cat => cat.nome === subject)) {
          await createCategoria(subject);
        }
      }

      // Cadastrar autores
      const existingAuthors = await getAutores();
      for (const author of book.authors) {
        if (!existingAuthors.some(aut => aut.nome === author)) {
          await createAutor(author, 'Nacionalidade não informada');
        }
      }

      // Extrair ano de publicação da descrição física ou usar valor padrão
      const yearMatch = book.physical_description.match(/\d{4}/);
      const publicationYear = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear();

      // Cadastrar livro usando a primeira categoria como referência
      const categories = await getCategorias();
      const categoryId = categories.find(cat => cat.nome === book.subjects[0])?.categoria_id || 1;

      await createLivro(
        book.title,
        publicationYear,
        book.publisher,
        categoryId
      );

      console.log(`Livro cadastrado com sucesso: ${book.title}`);
      return book;
    };

    // Exemplo de uso:
    const url = 'https://acervo.bn.gov.br/Sophia_web/acervo/detalhe/1739805';
    console.log(await cadastrarLivroPelaURLDaBN(url));

Não vou mentir, eu tô com preguiça e não quero pensar em diferentes exemplos, então coloquei aqui o código que eu usei pra testar o funcionamento do meu código e como funcionou conforme o previsto, decidi que era um bom exemplo, talvez eu pense em algo melhor estruturado pra colocar aqui depois, mas sejamos francos, ninguém chegou a ler até aqui.

## Stack utilizada

**Back-end:** Node.js (tecnicamente MySQL também)

## Licença

[![GPLv3 License](https://img.shields.io/badge/License-GPL%20v3-yellow.svg)](https://www.gnu.org/licenses/gpl-3.0.en.html)

## FAQ

### Por que abranger o projeto numa licença sendo que os únicos utilizando vão ser nossa equipe de banco de dados?

¯\\*(ツ)*/¯

### Por que sequer fazer um Readme se tu sabe que ninguém vai ler isso aqui?

Me deixa! Nunca fiz um Readme. Dessa vez, decidi que se eu tô fazendo um projeto tão nos trinques (sério me esforcei pra tentar deixar o código bonitinho e funcional, apesar de ser aquele desastre monolítico) ele merecia uma vitrine decente também.

## Feedback

Se você tiver algum feedback, seja dúvida, sugestão ou crítica, por favor me contate através do meu número de telefone, caso já o possua, ou através do e-mail <araujosemacento@alu.ufc.br>!
