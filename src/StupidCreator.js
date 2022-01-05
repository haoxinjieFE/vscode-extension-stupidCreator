const {
    workspace,
    window: { showInformationMessage, showErrorMessage }
} = require("vscode");
const fs = require("fs");
const _ = require("path");

class StupidCreator {
    constructor() {
        this.fileWatcher = null;
    }
    init() {
        try {
            const projectPath = workspace.workspaceFolders[0].uri.path

            const { enabled, path, templateDir, projectWhiteList } = this.getConfiguration();
            console.log('%c 🍍 projectWhiteList: ', 'font-size:20px;background-color: #B03734;color:#fff;', projectWhiteList);
            const { createFileSystemWatcher } = workspace;
            if (this.fileWatcher) {
                this.fileWatcher.dispose();
            }
            let atWhitelist = true;
            if (projectWhiteList.length) {
                atWhitelist = projectWhiteList.some(name => {
                    const result = projectPath.toLocaleLowerCase().includes(name.toLocaleLowerCase())
                    return result
                });
            }
            if (!atWhitelist) {
                showErrorMessage("项目未在白名单内，StupidCreator 已经停止运行在您的 vscode 上");
                return
            }
            if (enabled && path) {
                const realPath = `${projectPath}/${path}`;
                fs.exists(realPath, exists => {
                    if (!exists) {
                        showErrorMessage(`未找到 ${path} 文件夹, 请修改 path 字段后重试`);
                    } else {
                        showInformationMessage("StupidCreator 已经运行在您的 vscode 上");
                        const wathDirCreated = createFileSystemWatcher(
                            `${realPath}/**`,
                            false,
                            true,
                            true
                        );

                        this.fileWatcher = wathDirCreated.onDidCreate(url => {
                            try {
                                if (url.path.indexOf(".") <= -1) {
                                    this.writeWxFile(url.path);
                                }
                            } catch (e) {
                                console.log(e);
                            }
                        });
                        if (templateDir) {
                            const templatePath = `${projectPath}/${templateDir}`;
                            fs.exists(templatePath, exists => {
                                if (!exists) {
                                    fs.mkdir(templatePath, {}, err => {
                                        if (err) {
                                            console.log(err);
                                        }
                                    });
                                }
                            });
                        }
                    }
                });
            } else if (typeof enabled !== "boolean" && !enabled) {
                showErrorMessage(`请确保在用户设置里设置 StupidCreator.enabled 为 true`);
            } else if (typeof enabled === "boolean" && enabled === false) {
                showErrorMessage(`"StupidCreator 已经停止运行在您的 vscode 上"`);
            }
        } catch (e) {
            console.log(e);
        }
    }

    getFileName(path) {
        return path.slice(path.lastIndexOf("/") + 1);
    }

    getFileSuffix(s) {
        return s.slice(s.indexOf(".") + 1);
    }

    getConfiguration() {
        return workspace.getConfiguration("StupidCreator");
    }

    findSync(startPath) {
        let result = [];

        function finder(path) {
            let files = fs.readdirSync(path);
            files.forEach((val, index) => {
                let fPath = _.join(path, val);
                let stats = fs.statSync(fPath);
                if (stats.isDirectory()) finder(fPath);
                if (stats.isFile()) result.push(fPath);
            });
        }
        finder(startPath);
        return result;
    }

    delDir(path) {
        let files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach((file, index) => {
                let curPath = path + "/" + file;
                if (fs.statSync(curPath).isDirectory()) {
                    this.delDir(curPath); //递归删除文件夹
                } else {
                    fs.unlinkSync(curPath); //删除文件
                }
            });
        }
    }

    uniqueArray(arr) {
        const newArr = [];
        arr.forEach(item => {
            if (!newArr.includes(item)) {
                newArr.push(item);
            }
        });
        return newArr;
    }

    writeWxFile(path) {
        const { templateDir } = this.getConfiguration();
        const TemplateDirPath = `${
      workspace.workspaceFolders[0].uri.path
    }/${templateDir}`;
        const files = fs.readdirSync(TemplateDirPath)
        if (files.length) {
            files.forEach(file => {
                const fileData = fs.readFileSync(`${TemplateDirPath}/${file}`)
                if (fileData) {
                    fs.writeFile(`${path}/${file}`, fileData, err => {
                        console.log('%c 🌯 err: ', 'font-size:20px;background-color: #ED9EC7;color:#fff;', err);
                    })
                }

            })
        } else {
            showErrorMessage("未找到模板数据, 请检查模板文件夹是否为空");
        }

    }

    fileWatch() {
        return this.fileWatcher;
    }
    watch() {
        return workspace.onDidChangeConfiguration(() => this.init());
    }
}

module.exports = new StupidCreator();