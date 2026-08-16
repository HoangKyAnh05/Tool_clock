' create_shortcut.vbs
' Visual Basic Script to create Desktop Shortcut for Tool Clock

Dim objShell, objFSO, strRootDir, strElectronDir, strDesktop, strShortcutPath, objShortcut, strIconPath, strTargetExe

Set objShell = CreateObject("WScript.Shell")
Set objFSO = CreateObject("Scripting.FileSystemObject")

' Get Root Directory
strRootDir = objFSO.GetParentFolderName(WScript.ScriptFullName)
strElectronDir = objFSO.BuildPath(strRootDir, "electron_tool")

' Target Desktop Path
strDesktop = objShell.SpecialFolders("Desktop")
strShortcutPath = objFSO.BuildPath(strDesktop, "Tool Clock.lnk")

strTargetExe = objFSO.BuildPath(strElectronDir, "node_modules\electron\dist\electron.exe")
strIconPath = objFSO.BuildPath(strElectronDir, "icon.ico")

If Not objFSO.FileExists(strIconPath) Then
    strIconPath = strTargetExe
End If

If Not objFSO.FileExists(strTargetExe) Then
    MsgBox "Khong tim thay file electron.exe tai: " & vbCrLf & strTargetExe & vbCrLf & vbCrLf & "Vui long kiem tra thu muc electron_tool/node_modules!", 16, "Loi tao Shortcut"
    WScript.Quit 1
End If

Set objShortcut = objShell.CreateShortcut(strShortcutPath)

' Point shortcut directly to electron.exe with '.' argument and working directory
objShortcut.TargetPath = strTargetExe
objShortcut.Arguments = "."
objShortcut.WorkingDirectory = strElectronDir
objShortcut.WindowStyle = 1
objShortcut.Description = "Tool Clock - Task Countdown Application"

If objFSO.FileExists(strIconPath) Then
    objShortcut.IconLocation = strIconPath
End If

objShortcut.Save()

MsgBox "Da tao shortcut 'Tool Clock' tren Desktop thanh cong!", 64, "Tool Clock Shortcut Created"
