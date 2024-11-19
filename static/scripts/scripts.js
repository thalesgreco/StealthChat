let socket = io();
let room;
let privateKey, publicKey, sharedKey;
let AESKey;
let chatDiv = document.getElementById('chat');
let statusDiv = document.getElementById('status');

const p = 2147483647;
const g = 5;

privateKey = Math.floor(Math.random() * 100000000);
publicKey = modExp(g, privateKey, p);
//console.log('Private Key', privateKey);
//console.log('Public Key', publicKey);

function modExp(base, exponent, modulus) {
    if (modulus === 1) return 0;
    let result = BigInt(1);
    base = BigInt(base) % BigInt(modulus);
    while (exponent > 0) {
        if (exponent % 2 === 1) { // Se o expoente for ímpar
            result = (result * base) % BigInt(modulus);
        }
        exponent = Math.floor(exponent / 2); // Divide o expoente por 2
        base = (base * base) % BigInt(modulus); // Eleva o base ao quadrado
    }
    return result;
}

function deriveKey(password, roomName, iterations = 100000) {
    const salt = crypto.randomBytes(16).toString('hex'); // Salt aleatório
    const roomHash = hashRoomName(roomName);
    
    return crypto.pbkdf2Sync(password, roomHash + salt, iterations, 32, 'sha512');
}

function stringToInt(message) {
    let bytes = new TextEncoder().encode(message);
    let intValue = BigInt(0);
    for (let i = 0; i < bytes.length; i++) {
        intValue = (intValue << BigInt(8)) + BigInt(bytes[i]);
    }
    return intValue;
}

function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function intToString(intValue) {
    let bytes = [];
    while (intValue > 0) {
        bytes.unshift(Number(intValue & BigInt(255)));
        intValue = intValue >> BigInt(8);
    }
    let decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(bytes));
}

function blobToBase64(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            // Remove o cabeçalho "data:[mimeType];base64," se presente
            const base64Data = reader.result.split(',')[1]; // Pega a parte base64 correta
            resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

function generateSharedKey(partnerKey)
{
    //console.log("partnerkey", partnerKey);
    //console.log("privatekey", privateKey);
    let key = modExp(partnerKey, privateKey, p);
    //console.log("generated shared key", key);
    return key;
}

function addMessageToChat(align, type, user, message) {
    let sanitized = escapeHTML(message);

    // Criar um novo elemento de mensagem (um único div com tudo dentro)
    let messageDiv = document.createElement('div');
    messageDiv.classList.add('row');
    messageDiv.innerHTML = `
        <div class="col d-flex justify-content-${align}">
            <div id="status" class="alert alert-${type} mt-3">
                <strong>${user}:</strong> ${sanitized}
            </div>
        </div>
    `;

    // Adicionar a nova mensagem ao chatDiv sem sobrescrever o conteúdo
    chatDiv.appendChild(messageDiv);
       chatDiv.scrollTop = chatDiv.scrollHeight;
}

function AESEncrypt(msg, key)
{
    //console.log('msg', msg);
    //console.log('key', key);
    const encryptMessage = CryptoJS.AES.encrypt(msg.toString(), key.toString()).toString();
    //console.log('Mensagem Criptografada:', encryptMessage);
    return encryptMessage;
}

function AESDecrypt(msg, key)
{
    //console.log("Mensagem cripto partner", msg)
    const bytes = CryptoJS.AES.decrypt(msg, key.toString());
    //console.log('bytes', bytes);
    const decryptMessage = bytes.toString(CryptoJS.enc.Utf8);
    //console.log('Mensagem Descriptografada:', decryptMessage);
    //console.log('bytes', bytes);
    return decryptMessage;
}


function AESEncryptBlob(blob, key)
{
    //console.log('file', blob);
    //console.log('key', key);
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function () {
            const wordArray = CryptoJS.lib.WordArray.create(reader.result);
            const encrypted = CryptoJS.AES.encrypt(wordArray, key.toString());
            resolve(encrypted.toString());
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(blob)
    });

    //const encryptMessage = CryptoJS.AES.encrypt(file.toString(), key.toString()).toString();
    //console.log('Mensagem Criptografada:', encryptMessage);
    //return encryptMessage;
}

function AESDecryptBlob(blobType, encryptedBlob, key)
{
    return new Promise((resolve, reject) => {
        const decrypted = CryptoJS.AES.decrypt(encryptedBlob, key.toString());
        const typedArray = CryptoJS.enc.Base64.parse(decrypted.toString(CryptoJS.enc.Base64)).words;
        //const blob = new Blob([new Uint8Array(typedArray)], { type: blobType });
    // Converte o WordArray em um ArrayBuffer que pode ser usado para criar um Blob
        const buffer = new ArrayBuffer(typedArray.length * 4);
        const view = new DataView(buffer);
        typedArray.forEach((word, i) => {
            view.setUint32(i * 4, word);
        });

        // Cria um Blob com o ArrayBuffer resultante
        const blob = new Blob([new Uint8Array(buffer)], { type: blobType });
        
        // Resolve a Promise retornando o Blob descriptografado
        resolve(blob);
    });
}

function encryptMessage(message)
{
    let encrypted = stringToInt(message) * BigInt(sharedKey);
    return encrypted;
}

function decryptMessage(message)
{
    let decrypted = intToString(BigInt(message) / BigInt(sharedKey));
    return decrypted;
}

function joinChat() 
{
    AESKey = CryptoJS.SHA256(document.getElementById("password").value).toString();
    if (!AESKey) 
    {
        alert("Insira uma senha!");
        return;
    }
    room = CryptoJS.SHA256(document.getElementById("room").value).toString();

    if (!room) 
    {
        alert("Insira uma sala!");
        return;
    }

    socket.emit('join', {room: room});
    document.getElementById("login").style.display = "none";
    statusDiv.style.display = "block";
}

socket.on('disconnect', function() {
console.log('Você foi desconectado do servidor.');
// Aqui você pode atualizar a UI, exibir uma mensagem, etc.
});

function establishChat()
{
    console.log('Estabelecendo Chat');
    statusDiv.style.display = "none";
    chatDiv.style.display = "block";
    document.getElementById("messageArea").style.display = "block";
}

function sendMessage()
{
    let message = document.getElementById("messageInput").value;
    if (!message) return;

    let cryptoMessage = AESEncrypt(message, sharedKey);
    let encryptedMessage = AESEncrypt(cryptoMessage, AESKey);

    socket.emit("encrypted_message", {"room": room, "encrypted_message": encryptedMessage});
    addMessageToChat("end", "success", '<i class="fa-solid fa-user-tie"></i>', message);
    document.getElementById("messageInput").value = '';
    //console.log('Mensagem enviada', encryptedMessage);
}

socket.on('waiting', function(data) {
    statusDiv.innerHTML = '';
    statusDiv.innerHTML = data.message;
});

socket.on('room_full', function(data) {
    statusDiv.innerHTML = '';
    statusDiv.innerHTML = data.message;
    alert("A sala esta cheia. Tente outra sala ou aguarde...");
    setTimeout(() => {
        location.reload(); // Reinicia a página após um pequeno atraso
    }, 300);
});

socket.on('partner_disconnect', function(data) {
    addMessageToChat("center", "danger", '<i class="fa-solid fa-triangle-exclamation"></i>', data.message);
    statusDiv.innerHTML = data.message;
    document.getElementById('messageInput').disabled = true;
    document.getElementById('messageInput').placeholder = "Aguardando amigo se conectar...";
});

socket.on('connected', function(data) {
    statusDiv.innerHTML = '';
    statusDiv.innerHTML = data.message;
    socket.emit("exchange_keys", {"room": room, "public_key": AESEncrypt(publicKey, AESKey)})
    return establishChat();
});

socket.on('disconnect', function() {
    //console.log('Você foi desconectado do servidor.');
});

socket.on('connect', function() {
    //console.log("Reconectado ao servidor");

    // Após a reconexão, reentrar na sala automaticamente
    if (room) {
        addMessageToChat("center", "warning", '<i class="fa-solid fa-triangle-exclamation"></i>', "Voce perdeu a conexao e esta sendo reconectado ao chat! Aguarde.");
        socket.emit('join', { room: room });
        //console.log("Reentrando na sala:", room);
    }
});

socket.on('start_key_exchange', function(data) {
    statusDiv.innerHTML = data.message;
    let encryptedKey = AESEncrypt(publicKey, AESKey);
    addMessageToChat("center", "warning", '<i class="fa-solid fa-triangle-exclamation"></i>', "Iniciando seguranca do chat! Aguarde.");
    //console.log('Iniciando Key Exchange', encryptedKey);
    socket.emit('exchange_keys', {'room': room, 'public_key': encryptedKey});
});

socket.on('key_exchange', function(data) {
    if (data.type === "key_exchange") {
        //console.log('Key exchange partner', data.public_key);
        sharedKey = generateSharedKey(AESDecrypt(data.public_key, AESKey));
        if (sharedKey === 0n) {
            alert("Chave compartilhada incompatível. Verifique a SENHA novamente!");
            //socket.emit('disconnect', { room: room });
            setTimeout(() => {
                location.reload(); // Reinicia a página após um pequeno atraso
            }, 1000);
        }
        addMessageToChat("center", "warning", '<i class="fa-solid fa-triangle-exclamation"></i>', "Chat Seguro estabelecido! Voce pode iniciar a conversa.");
        //console.log('Chave trocada', sharedKey);
        addMessageToChat("center", "info", '<i class="fa-solid fa-triangle-exclamation"></i>', `Chave Compartilhada: ${sharedKey}`);
        document.getElementById('messageInput').disabled = false;
        document.getElementById('messageInput').placeholder = "Digite sua mensagem...";
    }
});

socket.on('encrypted_message', function(data) {
    //console.log('mensagem recebida', data);
    if (data.type === "encrypted_message") {
        //console.log('mensagem crypto recebida', data.encrypted_message);
        let message = AESDecrypt(AESDecrypt(data.encrypted_message, AESKey), sharedKey);
        //console.log('mensagem recebida', message);
        addMessageToChat("start", "dark", '<i class="fa-solid fa-user-secret"></i>', message);
    }
});  

socket.onAny((event, data) => {
    //console.log(`Evento recebido: ${event}`, data);
});

//Audio Crypt and Functions to send and receive:
//Audio Vars
let recorder, gumStream;
let audioChunks = [];

let micStatus = false;
const micToggle = document.getElementById('mic-toggle');
const recButton = document.getElementById('record-button');
//const statusText = document.getElementById('status');

$(document).ready(function() {
    // Inicializa o toggle
    $('#mic-toggle').change(function() {
        if ($(this).prop('checked')) {
            // Se o toggle estiver ativado, solicita acesso ao microfone
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then((stream) => {
                    console.log("Acesso ao microfone concedido!");
                    // Aqui você pode iniciar a gravação ou outras ações
                    stream.getAudioTracks()[0].stop(); // Para o microfone após a confirmação
                    recButton.disabled = false;
                    micStatus = true;

                })
                .catch((err) => {
                    // Acesso negado ou erro
                    console.error("Erro ao acessar o microfone: ", err);
                    // Se a permissão for negada, desmarcar o toggle
                    $('#mic-toggle').prop('checked', false).change();
                });
        } else {
            console.log("Microfone desativado.");
            gumStream.getAudioTracks()[0].stop();
            recButton.disabled = true;
            micStatus = false;
            // Aqui você pode parar a gravação ou outras ações, se necessário
        }
    });
});

function startRecording() {
    if (micStatus == false) {
        return alert("O Microfone esta desativado");
    }
    navigator.mediaDevices.getUserMedia({
        audio: true
    }).then(function(stream) {
        gumStream = stream;
        recorder = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
        recorder.ondataavailable = function(e) {
            const audioBlob = new Blob([e.data], { type: 'audio/mp4' });
            const url = URL.createObjectURL(audioBlob);
            let preview = document.createElement('audio');
            preview.controls = true;
            preview.src = url;
            // Chamar criptografia do áudio antes de enviar via socket
            AESEncryptBlob(audioBlob, sharedKey).then(encryptedAudioMessage => {
                // Enviar mensagem criptografada via socket
                socket.emit("audio_message", {
                    "room": room,
                    "encrypted_audio": encryptedAudioMessage,
                    "type": "audio"
                });

                // Adicionar áudio ao chat
                addAudioToChat("end", "success", "Você", url);
            }).catch(err => {
                console.error("Erro ao criptografar áudio:", err);
            });

        };
        recButton.className = "btn btn-danger";
        recButton.innerHtml = "Gravando..."
        recorder.start();
    });
}

function stopRecording() {
    if (recorder && recorder.state === "recording") {
        recorder.stop();
        gumStream.getAudioTracks()[0].stop(); // Para a gravação
        //mediaStream.getTracks().forEach(track => track.stop());
        document.getElementById('record-button').className = "btn btn-warning";
        document.getElementById('record-button').innerHtml = "Gravar Audio"
    }
}

function addAudioToChat(align, type, user, audioUrl) {
    const audioMessageDiv = document.createElement('div');
    audioMessageDiv.classname = "row";
    audioMessageDiv.innerHTML += `<div class="col d-flex justify-content-${align}">
        <div class="alert alert-${type} mt-3">
            <strong>${user}:</strong> <audio controls src="${audioUrl}"></audio>
        </div></div>`;
    chatDiv.appendChild(audioMessageDiv);
    chatDiv.scrollTop = chatDiv.scrollHeight;
}

socket.on('audio_message', function(data) {
    // Acessa o áudio enviado pelo socket
    AESDecryptBlob("audio/mp4", data.encrypted_audio, sharedKey)
        .then(decryptedBlob => {
            const reader = new FileReader();
            reader.onload = function () {
                //console.log('Decrypted Blob', reader.result);
                const url = URL.createObjectURL(decryptedBlob); // Cria um URL do Blob
                addAudioToChat("start", "dark", "Amigo", url);
            }
            reader.readAsArrayBuffer(decryptedBlob);
        })
    //if (decryptedBlob instanceof Blob) { // Verifica se é um Blob
    //    const url = URL.createObjectURL(decryptedBlob); // Cria um URL do Blob
    //    addAudioToChat("start", "dark", "Amigo", url); // Adiciona ao chat
    //} else {
   //     console.error("Received data is not a Blob");
   // }
});


//Manipulacao do envio de imagem

//const sendImageButton = document.getElementById('image-button');
//const imageInput = document.getElementById('image-input');

//sendImageButton.addEventListener('click', () => {
//    alert('Em Breve!');
//});

document.getElementById('upload-button').addEventListener('click', () => {
    const input = document.getElementById('image-input');
    const file = input.files[0];

    // Verifica se um arquivo foi selecionado
    if (!file) {
        alert("Por favor, selecione uma imagem.");
        return;
    }

    // Verifica se o arquivo é uma imagem
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validImageTypes.includes(file.type)) {
        alert("Por favor, selecione um arquivo de imagem válido.");
        return;
    }

    // Remove metadados da imagem usando FileReader e Blob
    const reader = new FileReader();
    reader.onload = function(event) {
        const arrayBuffer = event.target.result;

        // Cria um novo Blob sem os metadados
        const cleanedBlob = new Blob([arrayBuffer], { type: file.type });

        // Aqui você pode enviar a imagem via socket ou outra lógica
        sendImage(cleanedBlob);
        const url = URL.createObjectURL(cleanedBlob); // Cria um URL do Blob
        addImageToChat("start", "dark", "Voce", url); // Função para adicionar imagem ao chat

        // Fecha o modal
        $('#uploadModal').modal('hide');
        input.value = ''; // Limpa o input
    };

    reader.readAsArrayBuffer(file); // Lê o arquivo como um ArrayBuffer
});

function sendImage(imageBlob) {
    // Adicione sua lógica para enviar a imagem
    AESEncryptBlob(imageBlob, sharedKey).then(encryptedImage => {
        // Enviar mensagem criptografada via socket
        socket.emit("image_message", {
            "room": room,
            "encrypted_image": encryptedImage,
            "type": "image"
        });
    });
    console.log('Imagem enviada!');
    // Exemplo: socket.emit("image_message", blob);
}

socket.on('image_message', function(data) {
    // Acessa a imagem enviada pelo socket
    AESDecryptBlob("image/jpeg", data.encrypted_image, sharedKey)
        .then(decryptedBlob => {
            const reader = new FileReader();
            reader.onload = function () {
                const url = URL.createObjectURL(decryptedBlob); // Cria um URL do Blob
                addImageToChat("start", "dark", "Amigo", url); // Função para adicionar imagem ao chat
            }
            reader.readAsArrayBuffer(decryptedBlob);
        })
        .catch(err => {
            console.error("Erro ao descriptografar imagem:", err);
        });
});

function addImageToChat(align, type, user, url) {
    //const chatDiv = document.getElementById("chat-div"); // Substitua pelo ID correto do seu chat
    const sanitizedUser = escapeHTML(user);
    const imageHTML = `<img src="${url}" alt="${sanitizedUser}'s image" class="img-fluid" style="max-width: 100%; height: auto;">`;
    
    const messageDiv = `<div class="row"><div class="col d-flex justify-content-${align}"><div class="alert alert-${type} mt-3"><strong>${sanitizedUser}:</strong> ${imageHTML}</div></div></div>`;
    
    chatDiv.innerHTML += messageDiv;
    chatDiv.scrollTop = chatDiv.scrollHeight; // Rolagem para baixo
}