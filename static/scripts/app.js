import {} from "./socketsEvents.js";
import {} from "./cryptoUtils.js";
import {} from "./chatUtils.js";
import {} from "./audioUtils.js";
import {} from "./imageUtils.js";
//import {} from "./uiControl.js";


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
