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