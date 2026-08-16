' create_shortcut.vbs
' Visual Basic Script to create Desktop Shortcut for Tool Clock

Dim objShell, objFSO, strRootDir, strElectronDir, strDesktop, strShortcutPath, objShortcut, strIconPath, strLauncherVbs, strTargetExe

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get Root Directory
strRootDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
strElectronDir = objFSO.BuildPath(strRootDir, "electron_tool")

' Target Desktop Path
strDesktop = objShell.SpecialFolders("Desktop")
strShortcutPath = objFSO.BuildPath(strDesktop, "Tool Clock.lnk")

strLauncherVbs = objFSO.BuildPath(strElectronDir, "launcher.vbs")
strTargetExe = objFSO.BuildPath(strElectronDir, "node_modules\electron\dist\electron.exe")
strIconPath = objFSO.BuildPath(strElectronDir, "icon.ico")

If Not objFSO.FileExists(strIconPath) Then
    strIconPath = strTargetExe
End If

Set objShortcut = objShell.CreateShortcut(strShortcutPath)

' Use launcher.vbs to open silently without cmd window if available
If objFSO.FileExists(strLauncherVbs) Then
    objShortcut.TargetPath = "wscript.exe"
    objShortcut.Arguments = """" & strLauncherVbs & """"
Else
    objShortcut.TargetPath = strTargetExe
    objShortcut.Arguments = "."
End If

objShortcut.WorkingDirectory = strElectronDir
objShortcut.WindowStyle = 1
objShortcut.Description = "Tool Clock - Application"
If objFSO.FileExists(strIconPath) Then
    objShortcut.IconLocation = strIconPath
End If

objShortcut.Save()

MsgBox "Da tao shortcut 'Tool Clock' tren Desktop thanh cong!", 64, "Tool Clock Shortcut Created"
