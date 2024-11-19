
# StealthChat Free

StealthChat é uma aplicação de chat peer-to-peer (P2P) segura desenvolvida em Flask e Socket.IO com criptografia ponta-a-ponta (E2E) usando JavaScript. O projeto permite a comunicação privada com suporte para mensagens de texto, áudio e envio de imagens criptografadas.

## Visão Geral
StealthChat utiliza técnicas de criptografia como Diffie-Hellman para a troca de chaves e AES para a criptografia de mensagens. As mensagens são mantidas seguras e o servidor não pode descriptografar o conteúdo.

### 3 Camadas de Criptografia
1. **Criptografia de Mensagens (Diffie-Hellman)**: A primeira camada utiliza o método Diffie-Hellman para a troca segura de chaves entre os usuários.
2. **Criptografia da Mensagem com a Senha da Sala**: Após a troca de chaves, a mensagem é criptografada utilizando a chave compartilhada derivada da senha da sala.
3. **Criptografia SSL para Comunicação**: A comunicação entre o servidor e o cliente é protegida por SSL/TLS, garantindo que os dados trocados não possam ser interceptados.

## Principais Funcionalidades
- **Criptografia Ponta-a-Ponta (E2E)**: As mensagens são criptografadas no cliente, garantindo privacidade.
- **Troca de Chaves Segura**: Utiliza o método Diffie-Hellman para gerar uma chave compartilhada.
- **Envio de Imagens e Áudio Seguros**: Suporte para envio de arquivos criptografados.
- **Conexão Segura com Salas**: Proteção baseada em senhas que derivam chaves seguras.
- **Design Responsivo**: Interface amigável construída com Bootstrap.

## Tecnologias Utilizadas
- **Backend**: Flask 3.0.3, Flask-SocketIO
- **Frontend**: HTML5, CSS3, Bootstrap 4.5.2, JavaScript
- **Criptografia**: Crypto-JS para operações AES e funções de derivação de chave
- **Comunicação Segura**: SSL/TLS para criptografia de comunicação entre o servidor e os clientes

## Instalação
Clone este repositório:
```bash
 git clone https://github.com/thalesgreco/stealthchat.git
 cd StealthChat
```

Crie um ambiente virtual:
```bash
python -m venv venv
source venv/bin/activate   # No Linux/MacOS
venv\Scripts\activate      # No Windows
 ```
 
 Instale as dependências:

```bash
pip install -r requirements.txt
```

## Certificado SSL

Para garantir que a comunicação entre o servidor e o cliente seja segura via HTTPS, é necessário adicionar um certificado SSL. O Flask pode ser configurado para rodar sobre HTTPS adicionando os certificados na pasta "ssl" e configurando app.py com os nomes corretos.


## Como Executar

Execute o servidor Flask:

```bash
python app.py
```
Acesse a aplicação no seu navegador em https://127.0.0.1:5000.

## Arquitetura

 - **app.py:** Arquivo principal do servidor backend escrito em Flask.
 - **index.html:** Página principal da aplicação com frontend e lógica JavaScript para criptografia.
 - **requirements.txt:** Lista de dependências Python necessárias para o projeto.

## Dependências

Conforme especificado no arquivo requirements.txt:

 - Flask
 - Flask-SocketIO
 - Crypto-JS (para operações de criptografia no frontend)
 - E outras bibliotecas auxiliares como Blinker, Jinja2, Werkzeug etc.

## Funcionalidades Futuras

 - Melhorar a usabilidade e adicionar suporte a mais formatos de mídia.
   Implementar um sistema de chamadas de áudio seguro.
 - Melhorar a interface gráfica com temas personalizáveis.

## Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues ou fazer pull requests para melhorias e correções.

## Licença

MIT License - Sinta-se à vontade para usar, modificar e distribuir o código conforme necessário.
