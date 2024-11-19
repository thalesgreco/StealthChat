export function modExp(base, exponent, modulus) {
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

function intToString(intValue) {
    let bytes = [];
    while (intValue > 0) {
        bytes.unshift(Number(intValue & BigInt(255)));
        intValue = intValue >> BigInt(8);
    }
    let decoder = new TextDecoder();
    return decoder.decode(new Uint8Array(bytes));
}

export function blobToBase64(blob) {
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

export function base64ToBlob(base64, mimeType) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
}

export function generateSharedKey(partnerKey)
{
    //console.log("partnerkey", partnerKey);
    //console.log("privatekey", privateKey);
    let key = modExp(partnerKey, privateKey, p);
    //console.log("generated shared key", key);
    return key;
}

export function AESEncrypt(msg, key)
{
    //console.log('msg', msg);
    //console.log('key', key);
    const encryptMessage = CryptoJS.AES.encrypt(msg.toString(), key.toString()).toString();
    //console.log('Mensagem Criptografada:', encryptMessage);
    return encryptMessage;
}

export function AESDecrypt(msg, key)
{
    //console.log("Mensagem cripto partner", msg)
    const bytes = CryptoJS.AES.decrypt(msg, key.toString());
    //console.log('bytes', bytes);
    const decryptMessage = bytes.toString(CryptoJS.enc.Utf8);
    //console.log('Mensagem Descriptografada:', decryptMessage);
    //console.log('bytes', bytes);
    return decryptMessage;
}


export function AESEncryptBlob(blob, key)
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

export function AESDecryptBlob(blobType, encryptedBlob, key)
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

export function encryptMessage(message)
{
    let encrypted = stringToInt(message) * BigInt(sharedKey);
    return encrypted;
}

export function decryptMessage(message)
{
    let decrypted = intToString(BigInt(message) / BigInt(sharedKey));
    return decrypted;
}