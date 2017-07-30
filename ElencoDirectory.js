var http = require('http'), 
    url = require('url'), 
    path = require('path'), 
    fs = require('fs'); 
var mimeTypes = { 
    "html": "text/html", 
    "css": "text/css", 
    "jpeg": "image/jpeg", 
    "jpg": "image/jpeg", 
    "png": "image/png" 
    }; 
    // implementiamo ora la verifica sullo stato del file in modo asincrono 
function stato_file(filename, callback)
{ 
   fs.lstat(filename,     
               function(err,stats)
			   {     
                  if (err)
				  {     
                     callback(err);     
                     return;     
                  } 
                  callback(err,stats);     
               });     
} 
function processa(req, res) 
{ 
   // parse prende una url come stringa e ritorna un oggetto  
   var uri = url.parse(req.url).pathname; 
   var filename = path.join(process.cwd(), decodeURI(uri)); 
   stato_file(filename,          
    function(err,stats)
	{     
       if(err)
	   {     
          res.writeHead(404, {'Content-Type':'text/plain'}); 
          res.write('404 Resource Not Found\n'); 
          res.end(); 
          return; 
       }  
       // se la richiesta corrisponde a un file  
       if(stats.isFile())     
       {     
          console.log("I'm processing file" + filename + '\n'); 
          var mimeType = mimeTypes[path.extname(filename).split(".").reverse()[0]]; 
          res.writeHead(200, {'Content-Type': mimeType}); 
          // crea uno stream dal file e lo va a scrivere all'interno di res 
          var fileStream = fs.createReadStream(filename); 
          fileStream.pipe(res);     
       } 
       else if (stats.isDirectory()) 
       { 
          // se la richiesta corrisponde a una directory
          console.log("I'm processing a directory " + uri + '\n'); 
          fs.readdir(uri, function(err,files)
		  {
		     if (err) 
			 {
                res.writeHead(400, {'Content-Type':'text/html'}); 
				console.error("Errore in fs.readdir");
                res.end();				
                return console.error(err);
             }
			 //Estrapola l'elenco dei file contenuti nella directory
             res.writeHead(200, {'Content-Type':'text/html'}); 
             res.write("<p>La risorsa "+uri+" e' una directory \n"); 
             res.write('<ul>Elenco dei file:\n'); 
             files.forEach( function (file)
			 {
                res.write('<li>'+file+'</li>\n');
             });			 
             res.write('</ul>/n</p>\n');
             res.end();     
		  });
       }     
       else     
       {     
          //se la richiesta punta ad altro oggetto: es. symbolic link 
          res.writeHead(403, {'Content-Type': 'text/plain'}); 
          res.write('Request Forbidden \n'); 
          res.end();     
       } 
    });     
} 
console.log("Server is available \n"); 
var port =  process.env.OPENSHIFT_NODEJS_PORT || 8080;   // Port 8080 if you run locally 
var address =  process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1"; // Listening to localhost if you run locally 
var s = http.createServer(processa); 
s.listen(port, address); 