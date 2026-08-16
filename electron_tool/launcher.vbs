' launcher.vbs
' Runs the Task Countdown Electron app silently (no console window)
Dim objShell, strDir, strElectron, strApp, strCmd
On Error Resume Next
Set objShell = CreateObject("WScript.Shell")
strDir = Left(WScript.ScriptFullName, InStrRev(WScript.ScriptFullName, "\"))
objShell.CurrentDirectory = strDir

' Define absolute paths to prevent Windows resolving relative paths incorrectly
strElectron = strDir & "node_modules\electron\dist\electron.exe"

' Strip the trailing backslash from the directory path to avoid escaping the closing quote
If Right(strDir, 1) = "\" Then
    strApp = Left(strDir, Len(strDir) - 1)
Else
    strApp = strDir
End If

strCmd = """" & strElectron & """ """ & strApp & """"

objShell.Run strCmd, 1, False

If Err.Number <> 0 Then
    MsgBox "Loi khoi chay: " & Err.Description & " (Code: " & Err.Number & ")" & vbCrLf & "Lenh: " & strCmd, 16, "Task Countdown Error"
End If
Set objShell = Nothing
