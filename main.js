const { createServer } = require('http');
const { createReadStream, createWriteStream ,stat } = require('fs');
const multiparty = require('multiparty');
const { promisify } = require('util');
const file = './file.mkv';
const fileInfo = promisify(stat);

const respondWithVideo = async(req,res)=>{
  const { size } = await fileInfo(file);
  const range = req.headers.range;
  console.log("Size: "+size);
  console.log("Range: "+range);
  
  if(range){
      let [start,end] = range.replace(/bytes=/,'').split('-');
      start = parseInt(start,10);
      end = end ? parseInt(end,10) : size-1
      res.writeHead(206,{ // 206 is partial content
          'Content-Range': `bytes ${start}-${end}/${size}`,
          'Accept-Range': 'bytes',
          'Content-Length':(end-start)+1,
          'Content-Type':'video/mp4'
      });
      createReadStream(file,{start,end}).pipe(res);
  }else{
      res.writeHead(200, {
        'Content-Length':size,
        'Content-Type':'video/mp4'
      });
      createReadStream(file).pipe(res);
  }    
}

createServer((req,res)=>{
    if(req.method === "POST"){
        let form = new multiparty.Form();
        form.on('part',(part)=>{ //part is a readable stream
            part.pipe(createWriteStream(`./files/${part.filename}`))
                .on('close',()=>{
                    res.writeHead(200,{'Content-Type':'text/html'});
                    res.end(`<h1>File Uploaded : ${part.filename}</h1>`);
                });
        });          
        form.parse(req);
    }else if(req.url === '/video') { respondWithVideo(req,res); }
    else{ 
        res.writeHead(200,{'Content-Type':'text/html'});
        res.end(`
          <form enctype="multipart/form-data" method="POST" action="/">
            <input type="file" name="file" >
            <button type="submit" >Upload</button>
          </form>
        `);
    }
}).listen(3000,()=>console.log('running...'));