from flask import Flask, render_template, request
from bs4 import BeautifulSoup
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)



# Lista de URLs encontradas con sus descripciones
urls_encontradas = []

# Lista de URLs bloqueadas
urls_bloqueadas = []

def buscar_urls(tema):
    urls = []

    # Realizamos una búsqueda en Google
    url_google = f"https://www.google.com/search?q={tema}"
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4606.81 Safari/537.36'}
    response = requests.get(url_google, headers=headers)
    soup = BeautifulSoup(response.text, 'html.parser')

    # Extraemos los enlaces y descripciones de los resultados de la búsqueda
    links = soup.find_all('div', class_='tF2Cxc')
    for link in links:
        url_tag = link.find('a')
        href = url_tag.get('href')
        if href and href.startswith("http"):
            titulo = url_tag.text
            descripcion_tag = link.find('span', class_='aCOpRe')
            descripcion = descripcion_tag.text if descripcion_tag else "Sin descripción"
            urls.append({
                'url': href,
                'titulo': titulo,
                'descripcion': descripcion
            })

    return urls

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/buscar', methods=['POST'])
def buscar():
    try:
        # Obtener el tema de la solicitud POST
        tema = request.json['tema']
        
        # Obtenemos las URLs relacionadas con el tema
        urls_encontradas = buscar_urls(tema)
        
        # Devolvemos las URLs encontradas como respuesta en formato JSON
        return jsonify({'urls_encontradas': urls_encontradas})  # Aquí está el cambio

    except Exception as e:
        # Imprimir el error completo en la consola
        print(e)
        # Si hay algún error, devolvemos un mensaje de error y un código de estado 500
        return jsonify({'error': 'No se pudo completar la búsqueda'}), 500

@app.route('/bloquear', methods=['POST'])
def bloquear():
    try:
        # Obtener la URL del cuerpo JSON
        url = request.json['url']  # Corregido
        # Agregar la URL a la lista de URLs bloqueadas
        urls_bloqueadas.append(url)
        # Devolver un mensaje indicando que la URL fue bloqueada
        return jsonify({'message': 'URL bloqueada correctamente', 'urls_bloqueadas': urls_bloqueadas})

    except Exception as e:
        # Si hay algún error, devolvemos un mensaje de error y un código de estado 500
        return jsonify({'error': 'No se pudo bloquear la URL'}), 500

if __name__ == '__main__':
    app.run(debug=True)