function escapeHTML(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
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

function addImageToChat(align, type, user, url) {
    //const chatDiv = document.getElementById("chat-div"); // Substitua pelo ID correto do seu chat
    const sanitizedUser = escapeHTML(user);
    const imageHTML = `<img src="${url}" alt="${sanitizedUser}'s image" class="img-fluid" style="max-width: 100%; height: auto;">`;
    
    const messageDiv = `<div class="row"><div class="col d-flex justify-content-${align}"><div class="alert alert-${type} mt-3"><strong>${sanitizedUser}:</strong> ${imageHTML}</div></div></div>`;
    
    chatDiv.innerHTML += messageDiv;
    chatDiv.scrollTop = chatDiv.scrollHeight; // Rolagem para baixo
}