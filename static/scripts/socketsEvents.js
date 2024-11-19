

export function socketsHandlers(socket, statusDiv, room, publicKey, AESKey, sharedKey, addMessageToChat, addAudioToChat, addImageToChat, AESEncrypt, AESDecrypt, AESDecryptBlob)
{
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

    socket.onAny((event, data) => {
        //console.log(`Evento recebido: ${event}`, data);
    });

}
