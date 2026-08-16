' create_shortcut.vbs
' Creates a Desktop shortcut directly to Electron executable
Dim objShell, objFSO, strAppDir, strDesktop, strShortcutPath, objShortcut, strIconPath, strTargetExe
Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get the directory of this script
strAppDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
objShell.CurrentDirectory = strAppDir

' Define paths
strDesktop = objShell.SpecialFolders("Desktop")
strShortcutPath = objFSO.BuildPath(strDesktop, "Tool Clock.lnk")
strTargetExe = objFSO.BuildPath(strAppDir, "node_modules\electron\dist\electron.exe")

If objFSO.FileExists(objFSO.BuildPath(strAppDir, "icon.ico")) Then
    strIconPath = objFSO.BuildPath(strAppDir, "icon.ico")
Else
    strIconPath = strTargetExe
End If

If Not objFSO.FileExists(strTargetExe) Then
    MsgBox "Khong tim thay file electron.exe!", 16, "Loi tao Shortcut"
    WScript.Quit 1
End If

Set objShortcut = objShell.CreateShortcut(strShortcutPath)
objShortcut.TargetPath = strTargetExe
objShortcut.Arguments = "."
objShortcut.WorkingDirectory = strAppDir
objShortcut.WindowStyle = 1
objShortcut.Description = "Tool Clock - Task Countdown Application"
objShortcut.IconLocation = strIconPath

objShortcut.Save()

MsgBox "Da tao shortcut 'Tool Clock' tren Desktop thanh cong!", 64, "Task Countdown"
