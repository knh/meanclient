var http = require('http');
var htmlparser = require('htmlparser2');
var url = require('url');

var MeanCl = function(config){
	var trimHeaders = function(hdr){
		delete hdr['transfer-encoding'];
		delete hdr['connection'];
		return hdr;
	};
	var pDefaults =function(res){
		var inscript = false;
		var hasHadHeaders = false;
		return {
			'onopentag': function(name, attribs){
				if(name === "script" && attribs.type === "text/variancescript"){
					inscript = true;
				}
			},
			'ontext': function(text){
				if(!hasHadHeaders){
					var headers = JSON.parse((new Buffer(text, 'base64')).toString());
					res.writeHead(headers.status, trimHeaders(headers));
					return;
				}
				if(inscript){
					res.write(new Buffer(text, 'base64'));
				}
			},
			'onclosetag': function(tagname){
				if(tagname === "script"){
				    inscript = false;
				    hasHadHeaders = true;
				}
			},
			'onend': function(){
				res.end();
			}
		}
	};
	
	var writeHeader = function(header){
		header = trimHeaders(header);
		var headerE = JSON.stringify(header);
		return headerE.length + "|" + headerE;
	};
	return function(request, response){
		var parser = new htmlparser.Parser(pDefaults(response));
		var urlp = url.parse(request.url);
		var header = {
			'method':request.method,
			'host':request.headers.host,
			'port':request.port,
			'path':urlp.path,
			'headers':request.headers
		};
		var nHeader = writeHeader(header);
		var req = http.request({
			'hostname':config.remote.host || '127.0.0.1',
			'port':config.remote.port || 80,
			'method': 'POST',
			'headers':{
				'cookie':'__eup=1',
			},
			'path': config.remote.path,
		}, function(res){
			res.on('data', function(chunk){
				parser.write(chunk);
			});
			res.on('end', function(){
				parser.end();
			});
		});
		req.on('error', function(e){
			response.writeHead(500, {});
			response.write("Error: Internal Server Error");
			response.end();
		});
		req.write(nHeader);
		req.end();
	};
}

module.exports = MeanCl;
