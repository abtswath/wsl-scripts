#!/usr/bin/env zx
// Debian 下切换 sury 源安装的 PHP 版本

const APACHE_MOD_DIR = '/etc/apache2/mods-enabled';

const errorln = (...text) => {
    process.stderr.write(chalk.red(...text, os.EOL));
    process.exit(1);
}

const phpExecutables = fs.readdirSync('/usr/bin').filter((file) => {
    return /php\d./.test(file);
});

const response = await question(['Which version do you select?', ...(phpExecutables.map((x, i) => `${i + 1}. ${x}`)), undefined].join(os.EOL), {
    choices: [...phpExecutables, ...(phpExecutables.map((_, i) => (i + 1).toString()))]
});

let selectedVersion;
if (/\d{1,}/.test(response)) {
    if (phpExecutables[response - 1] === undefined) {
        errorln('You have selected an invalid version.');
    }
    selectedVersion = phpExecutables[response - 1];
} else {
    if (phpExecutables.filter(x => x === response).length <= 0) {
        errorln('You have selected an invalid version.');
    }
    selectedVersion = response;
}
fs.readdir(APACHE_MOD_DIR, async (err, files) => {
    if (err !== null) {
        errorln(err);
    }
    files.filter(x => x.startsWith('php')).forEach(x => fs.rmSync(`${APACHE_MOD_DIR}/${x}`));

    $.verbose = false;
    within(async () => {
        cd(APACHE_MOD_DIR);
        try {
            await Promise.all([
                $`ln -sf /usr/bin/${selectedVersion} /etc/alternatives/php`,
                $`ln -s ../mods-available/${selectedVersion}.conf`,
                $`ln -s ../mods-available/${selectedVersion}.load`,
            ]);
            await $`service apache2 restart`;
        } catch (p) {
            errorln(p.stderr);
        }
    });
});
