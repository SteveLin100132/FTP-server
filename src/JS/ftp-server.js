var ftpd = require('ftpd'),
    fs = require('fs'),
    path = require('path'),
    keyFile,
    certFile,
    server,
    options = {
        host: process.env.IP || '127.0.0.1',
        port: process.env.PORT || 21,
        tls: null
    };

if(process.env.KEY_FILE && process.env.CERT_FILE) {
    console.log('Running as FTP server');

    if(process.env.KEY_FILE.charAt(0) !== '/') {
        keyFile = path.join(__dirname, process.env.KEY_FILE);
    }

    if(process.env.CERT_FILE.charAt(0) !== '/') {
        certFile = path.join(__dirname, process.env.CERT_FILE);
    }

    options.tls = {
        key: fs.readFileSync(keyFile),
        cert: fs.readFileSync(certFile),
        ca: !process.env.CA_FILES ? null :  process.env.CA_FILES.split(':').map(function(f) {
            return fs.readFileSync(f);
        })
    };
} else {
    console.log('====== To Run as FTP server ======');
    console.log('====== Set KEY_FILE: ' + keyFile + ' ======');
    console.log('====== Set CERT_FILE: ' + certFile + ' ======');
}

server = new ftpd.FtpServer(options.host, {
    getInitialCwd: function() {
        return '/';
    }, getRoot: function() {
        return process.cwd();
    }, pasvPorRangeStart: 1025,
    pasvPorRangeEnd: 1050,
    tlsOptions: options.tls,
    allowUnauthorizedTls: true,
    useWriteFile: false,
    useReadFile: false,
    uploadMaxSlurpSize: 7000
});

server.on('error', function(err) {
    console.log('FTP server error: ' + err);
});

server.on('client:connected', function(connect) {
    var username = null;
    console.log('client connected: ' + connect.remoteAddress);

    connect.on('command:user', function(user, success, failure) {
        if(user === 'dllab') {
            username = user;
            success();
        } else {
            failure();
        }
    });

    connect.on('command:pass', function(pass, success, failure) {
        if(pass === '1315') {
            success(username);
        } else {
            failure();
        }
    });
});

server.debugging = 4;
server.listen(options.port);
console.log('Listening on port: ' + options.port);
