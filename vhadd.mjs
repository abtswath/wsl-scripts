#!/usr/bin/env zx
// add apache virtual host

const errorln = (...text) => {
    process.stderr.write(chalk.red(...text, os.EOL));
    process.exit(1);
}

let serverName = (await question('Server name (*.localtest.me): ')).trim();
if (serverName === '') {
    errorln('Please enter the Server name.');
}
if (!serverName.endsWith('localtest.me')) {
    serverName = `${serverName}.localtest.me`;
}
serverName = serverName;
let aliases = await question('Server Alias (If there is multiple aliases, split them by ","): ');
const directory = (await question('Directory: ', os.EOL)).trim();
if (directory === '') {
    errorln('Please enter the Directory.');
}

const template = `
<Directory ${directory}>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
</Directory>
<VirtualHost *:80>
        # The ServerName directive sets the request scheme, hostname and port that
        # the server uses to identify itself. This is used when creating
        # redirection URLs. In the context of virtual hosts, the ServerName
        # specifies what hostname must appear in the request's Host: header to
        # match this virtual host. For the default virtual host (this file) this
        # value is not decisive as it is used as a last resort host regardless.
        # However, you must set it for any further virtual host explicitly.
        ServerName ${serverName}
        ${aliases.split(',').filter(x => x.trim() !== '').map(x => `${ServerAlias} ${x.trim()}`).join('\n')}

        ServerAdmin webmaster@localhost
        DocumentRoot ${directory}

        # Available loglevels: trace8, ..., trace1, debug, info, notice, warn,
        # error, crit, alert, emerg.
        # It is also possible to configure the loglevel for particular
        # modules, e.g.
        LogLevel crit

        ErrorLog \${APACHE_LOG_DIR}/error.log
        CustomLog \${APACHE_LOG_DIR}/access.log combined

        # For most configuration files from conf-available/, which are
        # enabled or disabled at a global level, it is possible to
        # include a line for only one particular virtual host. For example the
        # following line enables the CGI configuration for this host only
        # after it has been globally disabled with "a2disconf".
        #Include conf-available/serve-cgi-bin.conf
</VirtualHost>
`;
fs.writeFile(`/etc/apache2/sites-available/${serverName}.conf`, template, function (err) {
    if (err !== null) {
        errorln(err);
    }
    within(async () => {
        $.verbose = false;
        cd('/etc/apache2/sites-enabled');
        try {
            await $`ln -s ../sites-available/${serverName}.conf`;
            await $`service apache2 restart`;
        } catch (p) {
            errorln(p.stderr);
        }
    });
});
