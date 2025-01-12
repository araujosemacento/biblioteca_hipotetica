-- Código SQL usado para criar as tabelas do banco de dados
-- Criação da tabela de Usuários
CREATE TABLE Usuario (
    usuario_id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    telefone VARCHAR(20)
);

-- Criação da tabela de Categorias
CREATE TABLE Categoria (
    categoria_id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(50) NOT NULL
);

-- Criação da tabela de Autores
CREATE TABLE Autor (
    autor_id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    nacionalidade VARCHAR(50)
);

-- Criação da tabela de Livros
CREATE TABLE Livro (
    livro_id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    ano_publicacao INT,
    editora VARCHAR(100),
    categoria_id INT,
    FOREIGN KEY (categoria_id) REFERENCES Categoria(categoria_id)
);

-- Criação da tabela de relacionamento entre Livros e Autores (N:N)
CREATE TABLE Livro_Autor (
    livro_id INT,
    autor_id INT,
    PRIMARY KEY (livro_id, autor_id),
    FOREIGN KEY (livro_id) REFERENCES Livro(livro_id),
    FOREIGN KEY (autor_id) REFERENCES Autor(autor_id)
);

-- Criação da tabela de Reservas
CREATE TABLE Reserva (
    reserva_id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    livro_id INT,
    data_reserva DATETIME DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ATIVA',
    FOREIGN KEY (usuario_id) REFERENCES Usuario(usuario_id),
    FOREIGN KEY (livro_id) REFERENCES Livro(livro_id)
);

-- Criação da tabela de Empréstimos
CREATE TABLE Emprestimo (
    emprestimo_id INT PRIMARY KEY AUTO_INCREMENT,
    reserva_id INT,
    data_emprestimo DATETIME NOT NULL,
    data_devolucao_prevista DATETIME NOT NULL,
    data_devolucao_real DATETIME,
    FOREIGN KEY (reserva_id) REFERENCES Reserva(reserva_id)
);

-- Adição de índices para otimização
CREATE INDEX idx_livro_categoria ON Livro(categoria_id);
CREATE INDEX idx_reserva_usuario ON Reserva(usuario_id);
CREATE INDEX idx_reserva_livro ON Reserva(livro_id);
CREATE INDEX idx_emprestimo_reserva ON Emprestimo(reserva_id);