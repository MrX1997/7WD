const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("appShell", {
  onMenuAction(handler) {
    const listener = (_event, action) => handler(action);
    ipcRenderer.on("menu-action", listener);
    return () => ipcRenderer.removeListener("menu-action", listener);
  },
  quit() {
    ipcRenderer.send("quit-app");
  },
});
