import os
import logging
from flask import Flask, render_template, request, redirect
from flask_socketio import SocketIO, join_room, leave_room, send, emit

app = Flask(__name__)
app.config['SECRET_KEY'] = 'yoursecretkey'
io = SocketIO(app)

# Diretório onde está o app.py
base_dir = os.path.dirname(os.path.abspath(__file__))

# Caminhos completos dos certificados SSL
ssl_cert = os.path.join(base_dir, "ssl/your.certificate.pem")
ssl_key = os.path.join(base_dir, "ssl/your.certificate.com.key")


rooms = {}

@app.before_request
def redirect_to_https():
    if request.url.startswith('http://'):
        return redirect(request.url.replace('http://', 'https://', 1), code=301)

@app.route('/')
def index():
    return render_template('index.html')

@io.on('join')
def on_join(data):
    #username = data['username']
    room = data['room']
    sid = request.sid
    join_room(room)

    if room not in rooms:
        rooms[room] = []
        #rooms[room] = 1
    
    if len(rooms[room]) < 2:
        if request.sid not in rooms[room]:
            rooms[room].append(sid)
            #print(len(rooms[room]))
            print(room, rooms[room])
            
            if len(rooms[room]) == 1:
                #print('Aguardando usuario')
                emit('waiting', {'message': '<i class="fa-solid fa-circle-notch fa-spin"></i>  Aguardando outro usuario...'}, to=sid)
            elif len(rooms[room]) == 2:
                #print('usuarios conectados')
                emit('connected', {'message': 'Usuarios conectados. Gerando chaves criptograficas.'}, to=room)
                #emit('connected', {'message': 'Usuarios conectados. Gerando chaves criptograficas.'}, to=sid)
        else:
            #print('aviso ja conectado')
            emit('already_connected', {'message': 'Voce ja esta conectado...'}, to=sid)
    else:
        #print('aviso sala cheia')
        emit('room_full', {'message': 'Sala esta cheia, escolha outra sala'}, to=sid)

@io.on('disconnect')
def on_leave():
    #room = data['room']
    sid = request.sid

    for room in rooms:
        if sid in rooms[room]:
            leave_room(room)
            rooms[room].remove(sid)
            #print('usuario saiu da sala', room)
            emit('partner_disconnect', {'message': 'O seu amigo se desconectou da conversa...'}, to=room)
            emit('partner_disconnect', {'message': 'Aguardando outro usuario...'}, to=room)

        if len(rooms[room]) == 0:
            #print('usuarios sairam fechando sala', room)
            del rooms[room]



@io.on('exchange_keys')
def key_exchange(data):
    sid = request.sid
    room = data['room']
    public_key = data['public_key']
    partner = [id for id in rooms[room] if id != sid]
    #print('troca de chaves', public_key, partner)
    emit('key_exchange', {'type': 'key_exchange', 'public_key': public_key}, to=partner)

@io.on('encrypted_message')
def encrypted_message_handler(data):
    room = str(data['room'])
    encrypted_message = data['encrypted_message']
    #type = data['type']
    #print('mensagem cripto', encrypted_message)
    #print('para sala', room)
    partner = [id for id in rooms[room] if id != request.sid]
    emit('encrypted_message', {'type': 'encrypted_message', 'encrypted_message': encrypted_message}, to=partner)

@io.on('audio_message')
def encrypted_audio_handler(data):
    room = str(data['room'])
    encrypted_audio = data['encrypted_audio']
    #print('audio cripto', room)
    #print('para sala', room)
    partner = [id for id in rooms[room] if id != request.sid]
    emit('audio_message', {'type': 'audio', 'encrypted_audio': encrypted_audio}, to=partner)

@io.on('image_message')
def encrypted_image_handler(data):
    room = str(data['room'])
    encrypted_image = data['encrypted_image']
    print('image cripto recebida', room)
    #print('para sala', room)
    partner = [id for id in rooms[room] if id != request.sid]
    emit('image_message', {'type': 'image', 'encrypted_image': encrypted_image}, to=partner)



def log_request_info():
    app.logger.info(f"IP: {request.remote_addr}, Metodo: {request.method}, Rota: {request.path}")


if __name__ == '__main__':
    from threading import Thread

    logging.basicConfig(level=logging.INFO)

    def run_http():
        io.run(app, host='0.0.0.0', port=80)

    Thread(target=run_http).start()
    io.run(app, host='0.0.0.0', port=443, ssl_context=(ssl_cert, ssl_key))