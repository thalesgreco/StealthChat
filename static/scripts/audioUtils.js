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