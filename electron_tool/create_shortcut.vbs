' create_shortcut.vbs
' Creates a Desktop shortcut silently (no terminal window)
Dim objShell, objFSO, strAppDir, strDesktop, strShortcutPath, objShortcut, strIconPath, strLauncherVbs
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory of this script
strAppDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
objShell.CurrentDirectory = strAppDir

' Define paths
strDesktop = objShell.SpecialFolders("Desktop")
strShortcutPath = objFSO.BuildPath(strDesktop, "Task Countdown.lnk")
strLauncherVbs = objFSO.BuildPath(strAppDir, "launcher.vbs")
if objFSO.FileExists(objFSO.BuildPath(strAppDir, "icon.ico")) then
    strIconPath = objFSO.BuildPath(strAppDir, "icon.ico")
else
    strIconPath = objFSO.BuildPath(strAppDir, "node_modules\electron\dist\electron.exe")
end if

' Create the shortcut pointing to wscript.exe + launcher.vbs
Set objShortcut = objShell.CreateShortcut(strShortcutPath)
objShortcut.TargetPath = objFSO.BuildPath(strAppDir, "node_modules\electron\dist\electron.exe")
objShortcut.Arguments = "."
objShortcut.WorkingDirectory = strAppDir
objShortcut.WindowStyle = 1 ' Normal window when running wscript
objShortcut.Description = "Task Countdown - Daily productivity tracker"
objShortcut.IconLocation = strIconPath

objShortcut.Save()

WScript.Echo "Da tao shortcut 'Task Countdown' tren Desktop thanh cong!"
