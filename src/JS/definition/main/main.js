var GUI = require('nw.gui'),
    ftpd = require('ftpd'),
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

var app = {
    init: function() {
        this.bindEvent();
    }, bindEvent: function() {
        document.addEventListener('DOMContentLoaded', this.DOMReady, false);
    }, DOMReady: function() {
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

        $('.textfield').blur(function() {
            var placeholder = $(this).attr('data-placeholder');
            $(this).attr('placeholder', placeholder);
        });

        $('.folder-select').change(function() {
            $('.folder-path').text($(this).val());
        });
    }, launchFTP: function(selector) {
        var launch = document.querySelector(selector);
        launch.addEventListener('click', function() {
            var host = document.querySelector('.textfield-host');
            var password = document.querySelector('.textfield-password');
            var folder = document.querySelector('.folder-select');

            if(host.value !== '' && password.value !== '') {
                server = new ftpd.FtpServer(options.host, {
                    getInitialCwd: function() {
                        return '/';
                    }, getRoot: function() {
                        // return process.cwd();
                        return folder.value;
                    }, pasvPorRangeStart: 1025,
                    pasvPorRangeEnd: 1050,
                    tlsOptions: options.tls,
                    allowUnauthorizedTls: true,
                    useWriteFile: true,
                    useReadFile: true
                });

                server.on('error', function(err) {
                    console.log('FTP server error: ' + err);
                });

                server.on('client:connected', function(connect) {
                    var username = null;
                    console.log('client connected: ' + connect.remoteAddress);

                    connect.on('command:user', function(user, success, failure) {
                        if(user === host.value) {
                            username = user;
                            success();
                        } else {
                            failure();
                        }
                    });

                    connect.on('command:pass', function(pass, success, failure) {
                        if(pass === password.value) {
                            success(username);
                        } else {
                            failure();
                        }
                    });

                    connect.on('command:close', function() {
                        alert('close');
                    });
                });

                server.debugging = 4;
                server.listen(options.port);
                console.log('Listening on port: ' + options.port);
            } else {
                (host.value === '') ? (host.setAttribute('placeholder', 'Required')) : host.value = host.value;
                (password.value === '') ? (password.setAttribute('placeholder', 'Required')) : password.value = password.value;
            }
        });
    }, minimize: function(selector) {
        var minimize = document.querySelector(selector);
        minimize.addEventListener('click', function() {
            GUI.Window.get().minimize();
        });
    }, close: function(selector) {
        var close = document.querySelector(selector);
        close.addEventListener('click', function() {
            GUI.Window.get().close();
        });
    }
};
