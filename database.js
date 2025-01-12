/**
 * Configuração e funções do banco de dados
 */

import dotenv from 'dotenv';
import mysql from 'mysql2';

dotenv.config();

const env = process.env;

/**
 * Configuração da pool de conexões do MySQL
 */
const pool = mysql.createPool({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
}).promise();

/**
 * Escapa caracteres especiais em uma string
 * @param {string} str - String a ser escapada
 * @returns {string} String com caracteres especiais escapados
 */
function escapeSpecialChars(str) {
  return str.replace(/[áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ'"\\-]/g, char => {
    const escapeMap = {
      'á': '\\á', 'à': '\\à', 'ã': '\\ã', 'â': '\\â', 'ä': '\\ä',
      'é': '\\é', 'è': '\\è', 'ê': '\\ê', 'ë': '\\ë',
      'í': '\\í', 'ì': '\\ì', 'î': '\\î', 'ï': '\\ï',
      'ó': '\\ó', 'ò': '\\ò', 'õ': '\\õ', 'ô': '\\ô', 'ö': '\\ö',
      'ú': '\\ú', 'ù': '\\ù', 'û': '\\û', 'ü': '\\ü',
      'ç': '\\ç',
      'Á': '\\Á', 'À': '\\À', 'Ã': '\\Ã', 'Â': '\\Â', 'Ä': '\\Ä',
      'É': '\\É', 'È': '\\È', 'Ê': '\\Ê', 'Ë': '\\Ë',
      'Í': '\\Í', 'Ì': '\\Ì', 'Î': '\\Î', 'Ï': '\\Ï',
      'Ó': '\\Ó', 'Ò': '\\Ò', 'Õ': '\\Õ', 'Ô': '\\Ô', 'Ö': '\\Ö',
      'Ú': '\\Ú', 'Ù': '\\Ù', 'Û': '\\Û', 'Ü': '\\Ü',
      'Ç': '\\Ç',
      "'": "\\'",
      '"': '\\"',
      '\\': '\\\\',
      '-': '\\-'
    };
    return escapeMap[char] || char;
  });
}

/**
 * Remove o escape de caracteres especiais de uma string
 * @param {string} str - String com caracteres escapados
 * @returns {string} String com caracteres especiais normalizados
 */
function unescapeSpecialChars(str) {
  return str.replace(/\\([áàãâäéèêëíìîïóòõôöúùûüçÁÀÃÂÄÉÈÊËÍÌÎÏÓÒÕÔÖÚÙÛÜÇ'"\\-])/g, (_, char) => char);
}

/**
 * Funções para manipulação de Usuários
 */

/**
 * Cria um novo usuário no banco de dados
 * @param {string} nome - Nome do usuário
 * @param {string[]} emails - Lista de emails do usuário
 * @param {string[]} telefones - Lista de telefones do usuário
 * @returns {Promise} Resultado da operação de inserção
 */
export async function createUsuario(nome, emails, telefones) {
  const escapedNome = escapeSpecialChars(nome);
  const escapedEmails = emails.map(email => escapeSpecialChars(email));
  const escapedPhones = telefones.map(phone => escapeSpecialChars(phone));

  const [existingEmails] = await pool.query('SELECT email FROM Usuario');
  const [existingPhones] = await pool.query('SELECT telefone FROM Usuario');
  
  const allEmails = existingEmails.flatMap(u => JSON.parse(u.email));
  const allPhones = existingPhones.flatMap(u => JSON.parse(u.telefone));
  
  const uniqueEmails = escapedEmails.filter(email => !allEmails.includes(email));
  const uniquePhones = escapedPhones.filter(phone => !allPhones.includes(phone));
  
  const emailJson = JSON.stringify(uniqueEmails);
  const phoneJson = JSON.stringify(uniquePhones);

  const [result] = await pool.query(
    'INSERT INTO Usuario (nome, email, telefone) VALUES (?, ?, ?)',
    [escapedNome, emailJson, phoneJson]
  );
  return result;
}

/**
 * Retorna todos os usuários cadastrados
 * @returns {Promise<Array>} Lista de usuários
 */
export async function getUsuarios() {
  const [rows] = await pool.query('SELECT * FROM Usuario');
  return rows.map(user => ({
    ...user,
    nome: unescapeSpecialChars(user.nome),
    email: JSON.parse(user.email).map(email => unescapeSpecialChars(email)),
    telefone: JSON.parse(user.telefone).map(phone => unescapeSpecialChars(phone))
  }));
}

/**
 * Busca um usuário pelo ID
 * @param {number} id - ID do usuário
 * @returns {Promise<Object|null>} Dados do usuário ou null se não encontrado
 */
export async function getUsuarioById(id) {
  const [rows] = await pool.query('SELECT * FROM Usuario WHERE usuario_id = ?', [id]);
  if (rows[0]) {
    return {
      ...rows[0],
      nome: unescapeSpecialChars(rows[0].nome),
      email: JSON.parse(rows[0].email).map(email => unescapeSpecialChars(email)),
      telefone: JSON.parse(rows[0].telefone).map(phone => unescapeSpecialChars(phone))
    };
  }
  return null;
}

/**
 * Atualiza os dados de um usuário
 * @param {number} id - ID do usuário
 * @param {string} nome - Novo nome do usuário
 * @param {string[]} newEmails - Nova lista de emails
 * @param {string[]} newPhones - Nova lista de telefones
 * @returns {Promise} Resultado da operação de atualização
 */
export async function updateUsuario(id, nome, newEmails, newPhones) {
  const escapedNome = escapeSpecialChars(nome);
  const escapedEmails = newEmails.map(email => escapeSpecialChars(email));
  const escapedPhones = newPhones.map(phone => escapeSpecialChars(phone));

  const [existingEmails] = await pool.query('SELECT email FROM Usuario WHERE usuario_id != ?', [id]);
  const [existingPhones] = await pool.query('SELECT telefone FROM Usuario WHERE usuario_id != ?', [id]);
  
  const allEmails = existingEmails.flatMap(u => JSON.parse(u.email));
  const allPhones = existingPhones.flatMap(u => JSON.parse(u.telefone));
  
  const uniqueEmails = escapedEmails.filter(email => !allEmails.includes(email));
  const uniquePhones = escapedPhones.filter(phone => !allPhones.includes(phone));
  
  const emailJson = JSON.stringify(uniqueEmails);
  const phoneJson = JSON.stringify(uniquePhones);

  const [result] = await pool.query(
    'UPDATE Usuario SET nome = ?, email = ?, telefone = ? WHERE usuario_id = ?',
    [escapedNome, emailJson, phoneJson, id]
  );
  return result;
}

/**
 * Remove um usuário do banco de dados
 * @param {number} id - ID do usuário a ser removido
 * @returns {Promise} Resultado da operação de remoção
 */
export async function deleteUsuario(id) {
  const [result] = await pool.query('DELETE FROM Usuario WHERE usuario_id = ?', [id]);
  return result;
}

/**
 * Funções para gerenciamento de Categorias
 */

/**
 * Cria uma nova categoria
 * @param {string} nome - Nome da categoria
 * @returns {Promise} Resultado da operação de inserção
 */
export async function createCategoria(nome) {
  const escapedNome = escapeSpecialChars(nome);
  const [result] = await pool.query(
    'INSERT INTO Categoria (nome) VALUES (?)',
    [escapedNome]
  );
  return result;
}

/**
 * Retorna todas as categorias cadastradas
 * @returns {Promise<Array>} Lista de todas as categorias
 */
export async function getCategorias() {
  const [rows] = await pool.query('SELECT * FROM Categoria');
  return rows.map(categoria => ({
    ...categoria,
    nome: unescapeSpecialChars(categoria.nome)
  }));
}

/**
 * Busca uma categoria específica pelo ID
 * @param {number} id - ID da categoria
 * @returns {Promise<Object|null>} Dados da categoria ou null se não encontrada
 */
export async function getCategoriaById(id) {
  const [rows] = await pool.query('SELECT * FROM Categoria WHERE categoria_id = ?', [id]);
  if (rows[0]) {
    return {
      ...rows[0],
      nome: unescapeSpecialChars(rows[0].nome)
    };
  }
  return null;
}

/**
 * Atualiza os dados de uma categoria
 * @param {number} id - ID da categoria
 * @param {string} nome - Novo nome da categoria
 * @returns {Promise} Resultado da operação de atualização
 */
export async function updateCategoria(id, nome) {
  const escapedNome = escapeSpecialChars(nome);
  const [result] = await pool.query(
    'UPDATE Categoria SET nome = ? WHERE categoria_id = ?',
    [escapedNome, id]
  );
  return result;
}

/**
 * Remove uma categoria do banco de dados
 * @param {number} id - ID da categoria a ser removida
 * @returns {Promise} Resultado da operação de remoção
 */
export async function deleteCategoria(id) {
  const [result] = await pool.query('DELETE FROM Categoria WHERE categoria_id = ?', [id]);
  return result;
}

/**
 * Funções para gerenciamento de Autores
 */

/**
 * Cria um novo autor
 * @param {string} nome - Nome do autor
 * @param {string} nacionalidade - Nacionalidade do autor
 * @returns {Promise} Resultado da operação de inserção
 */
export async function createAutor(nome, nacionalidade) {
  const escapedNome = escapeSpecialChars(nome);
  const escapedNacionalidade = escapeSpecialChars(nacionalidade);
  const [result] = await pool.query(
    'INSERT INTO Autor (nome, nacionalidade) VALUES (?, ?)',
    [escapedNome, escapedNacionalidade]
  );
  return result;
}

/**
 * Retorna todos os autores cadastrados
 * @returns {Promise<Array>} Lista de todos os autores
 */
export async function getAutores() {
  const [rows] = await pool.query('SELECT * FROM Autor');
  return rows.map(autor => ({
    ...autor,
    nome: unescapeSpecialChars(autor.nome),
    nacionalidade: unescapeSpecialChars(autor.nacionalidade)
  }));
}

/**
 * Busca um autor específico pelo ID
 * @param {number} id - ID do autor
 * @returns {Promise<Object|null>} Dados do autor ou null se não encontrado
 */
export async function getAutorById(id) {
  const [rows] = await pool.query('SELECT * FROM Autor WHERE autor_id = ?', [id]);
  if (rows[0]) {
    return {
      ...rows[0],
      nome: unescapeSpecialChars(rows[0].nome),
      nacionalidade: unescapeSpecialChars(rows[0].nacionalidade)
    };
  }
  return null;
}

/**
 * Atualiza os dados de um autor
 * @param {number} id - ID do autor
 * @param {string} nome - Novo nome do autor
 * @param {string} nacionalidade - Nova nacionalidade do autor
 * @returns {Promise} Resultado da operação de atualização
 */
export async function updateAutor(id, nome, nacionalidade) {
  const escapedNome = escapeSpecialChars(nome);
  const escapedNacionalidade = escapeSpecialChars(nacionalidade);
  const [result] = await pool.query(
    'UPDATE Autor SET nome = ?, nacionalidade = ? WHERE autor_id = ?',
    [escapedNome, escapedNacionalidade, id]
  );
  return result;
}

/**
 * Remove um autor do banco de dados
 * @param {number} id - ID do autor a ser removido
 * @returns {Promise} Resultado da operação de remoção
 */
export async function deleteAutor(id) {
  const [result] = await pool.query('DELETE FROM Autor WHERE autor_id = ?', [id]);
  return result;
}

/**
 * Funções para gerenciamento de Livros
 */

/**
 * Cria um novo livro no banco de dados
 * @param {string} titulo - Título do livro
 * @param {number} ano_publicacao - Ano de publicação do livro
 * @param {string} editora - Nome da editora
 * @param {number} categoria_id - ID da categoria do livro
 * @returns {Promise} Resultado da operação de inserção
 */
export async function createLivro(titulo, ano_publicacao, editora, categoria_id) {
  const escapedTitulo = escapeSpecialChars(titulo);
  const escapedEditora = escapeSpecialChars(editora);
  const [result] = await pool.query(
    'INSERT INTO Livro (titulo, ano_publicacao, editora, categoria_id) VALUES (?, ?, ?, ?)',
    [escapedTitulo, ano_publicacao, escapedEditora, categoria_id]
  );
  return result;
}

/**
 * Retorna todos os livros cadastrados
 * @returns {Promise<Array>} Lista de livros
 */
export async function getLivros() {
  const [rows] = await pool.query('SELECT * FROM Livro');
  return rows.map(livro => ({
    ...livro,
    titulo: unescapeSpecialChars(livro.titulo),
    editora: unescapeSpecialChars(livro.editora)
  }));
}

/**
 * Busca um livro específico pelo ID
 * @param {number} id - ID do livro
 * @returns {Promise<Object|null>} Dados do livro ou null se não encontrado
 */
export async function getLivroById(id) {
  const [rows] = await pool.query('SELECT * FROM Livro WHERE livro_id = ?', [id]);
  if (rows[0]) {
    return {
      ...rows[0],
      titulo: unescapeSpecialChars(rows[0].titulo),
      editora: unescapeSpecialChars(rows[0].editora)
    };
  }
  return null;
}

/**
 * Atualiza os dados de um livro
 * @param {number} id - ID do livro
 * @param {string} titulo - Novo título do livro
 * @param {number} ano_publicacao - Novo ano de publicação
 * @param {string} editora - Nova editora
 * @param {number} categoria_id - Novo ID da categoria
 * @returns {Promise} Resultado da operação de atualização
 */
export async function updateLivro(id, titulo, ano_publicacao, editora, categoria_id) {
  const escapedTitulo = escapeSpecialChars(titulo);
  const escapedEditora = escapeSpecialChars(editora);
  const [result] = await pool.query(
    'UPDATE Livro SET titulo = ?, ano_publicacao = ?, editora = ?, categoria_id = ? WHERE livro_id = ?',
    [escapedTitulo, ano_publicacao, escapedEditora, categoria_id, id]
  );
  return result;
}

/**
 * Remove um livro do banco de dados
 * @param {number} id - ID do livro a ser removido
 * @returns {Promise} Resultado da operação de remoção
 */
export async function deleteLivro(id) {
  const [result] = await pool.query('DELETE FROM Livro WHERE livro_id = ?', [id]);
  return result;
}

/**
 * Funções para gerenciamento de Reservas
 */

/**
 * Cria uma nova reserva de livro
 * @param {number} usuario_id - ID do usuário que está fazendo a reserva
 * @param {number} livro_id - ID do livro a ser reservado
 * @returns {Promise} Resultado da operação de inserção
 */
export async function createReserva(usuario_id, livro_id) {
  const [result] = await pool.query(
    'INSERT INTO Reserva (usuario_id, livro_id) VALUES (?, ?)',
    [usuario_id, livro_id]
  );
  return result;
}

/**
 * Retorna todas as reservas cadastradas
 * @returns {Promise<Array>} Lista de reservas
 */
export async function getReservas() {
  const [rows] = await pool.query('SELECT * FROM Reserva');
  return rows;
}

/**
 * Busca uma reserva específica pelo ID
 * @param {number} id - ID da reserva
 * @returns {Promise<Object|null>} Dados da reserva ou null se não encontrada
 */
export async function getReservaById(id) {
  const [rows] = await pool.query('SELECT * FROM Reserva WHERE reserva_id = ?', [id]);
  return rows[0];
}

/**
 * Atualiza o status de uma reserva
 * @param {number} id - ID da reserva
 * @param {string} status - Novo status da reserva
 * @returns {Promise} Resultado da operação de atualização
 */
export async function updateReservaStatus(id, status) {
  const escapedStatus = escapeSpecialChars(status);
  const [result] = await pool.query(
    'UPDATE Reserva SET status = ? WHERE reserva_id = ?',
    [escapedStatus, id]
  );
  return result;
}

/**
 * Remove uma reserva do banco de dados
 * @param {number} id - ID da reserva a ser removida
 * @returns {Promise} Resultado da operação de remoção
 */
export async function deleteReserva(id) {
  const [result] = await pool.query('DELETE FROM Reserva WHERE reserva_id = ?', [id]);
  return result;
}

/**
 * Funções para gerenciamento de Empréstimos
 */

/**
 * Cria um novo empréstimo
 * @param {number} reserva_id - ID da reserva associada
 * @param {Date} data_emprestimo - Data do empréstimo
 * @param {Date} data_devolucao_prevista - Data prevista para devolução
 * @returns {Promise} Resultado da operação de inserção
 */
export async function createEmprestimo(reserva_id, data_emprestimo, data_devolucao_prevista) {
  const [result] = await pool.query(
    'INSERT INTO Emprestimo (reserva_id, data_emprestimo, data_devolucao_prevista) VALUES (?, ?, ?)',
    [reserva_id, data_emprestimo, data_devolucao_prevista]
  );
  return result;
}

/**
 * Retorna todos os empréstimos cadastrados
 * @returns {Promise<Array>} Lista de empréstimos
 */
export async function getEmprestimos() {
  const [rows] = await pool.query('SELECT * FROM Emprestimo');
  return rows;
}

/**
 * Busca um empréstimo específico pelo ID
 * @param {number} id - ID do empréstimo
 * @returns {Promise<Object|null>} Dados do empréstimo ou null se não encontrado
 */
export async function getEmprestimoById(id) {
  const [rows] = await pool.query('SELECT * FROM Emprestimo WHERE emprestimo_id = ?', [id]);
  return rows[0];
}

/**
 * Atualiza a data de devolução real de um empréstimo
 * @param {number} id - ID do empréstimo
 * @param {Date} data_devolucao_real - Data real da devolução
 * @returns {Promise} Resultado da operação de atualização
 */
export async function updateEmprestimoDevolucao(id, data_devolucao_real) {
  const [result] = await pool.query(
    'UPDATE Emprestimo SET data_devolucao_real = ? WHERE emprestimo_id = ?',
    [data_devolucao_real, id]
  );
  return result;
}

/**
 * Remove um empréstimo do banco de dados
 * @param {number} id - ID do empréstimo a ser removido
 * @returns {Promise} Resultado da operação de remoção
 */
export async function deleteEmprestimo(id) {
  const [result] = await pool.query('DELETE FROM Emprestimo WHERE emprestimo_id = ?', [id]);
  return result;
}