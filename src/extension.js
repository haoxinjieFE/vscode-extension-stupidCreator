const vscode = require("vscode");
const StupidCreator = require("./StupidCreator.js");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
    StupidCreator.init();
    context.subscriptions.push(
        vscode.commands.registerCommand("StupidCreator.stop", () => {
            try {
                if (StupidCreator.fileWatch() && StupidCreator.watch()) {
                    StupidCreator.fileWatch().dispose();
                    StupidCreator.watch().dispose();
                }
            } catch (e) {
                console.log(e);
            }
            vscode.window.showErrorMessage(
                "StupidCreator 已经停止运行在您的 vscode 上"
            );
        })
    );
    context.subscriptions.push(StupidCreator.fileWatch());
    context.subscriptions.push(StupidCreator.watch());
}

function deactivate() {
    StupidCreator.fileWatch().dispose();
    StupidCreator.watch().dispose();
}

module.exports = {
    activate,
    deactivate
};