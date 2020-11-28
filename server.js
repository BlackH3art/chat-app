const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const chatServer = require('./lib/chat_server')

const cache = {};


const send404 = (response) => {
  console.log('wywołanie send404');
  response.writeHead(404, {'content-type': 'text/plain'});
  response.write('Error404: file is not found');
  response.end();
}

const sendFile = (res, filePath, fileContents) => {
  res.writeHead(200, {'content-type': mime.getType(path.basename(filePath))});
  res.end(fileContents);
}

const serveStatic = (res, cache, absPath) => {

  if(cache[absPath]) { 
    sendFile(res, absPath, cache[absPath])
  } else {

    let pathExists = fs.existsSync(absPath)

    const responseForPath = (exists) => {
      if (exists) {
        fs.readFile(absPath, (err, data) => {
          if (err) {
            send404(res);
          } else {
            cache[absPath] = data;
            sendFile(res, absPath, data)
          }
        });
      } else {
        send404(res)
      }

    }

    responseForPath(pathExists);
  }
}

const server = http.createServer((req, res) => {
  let filePath = false;

  if (req.url == '/') {
    filePath = 'public/index.html';
  } else {
    filePath = `public${req.url}`;
  }

  let absPath = `./${filePath}`;
  serveStatic(res, cache, absPath);
})


server.listen(3000, () => {
  console.log(`Listening on port: 3000`);
})

chatServer.listen(server);