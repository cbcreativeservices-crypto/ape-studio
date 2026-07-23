@echo off
rem ape-dsp golden-vector tests — build with MSVC and run (engine build 2026-07-23).
call "C:\Program Files (x86)\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat" >nul
cd /d "%~dp0"
cl /nologo /std:c++17 /EHsc /O2 /W3 golden_main.cpp /Fe:golden.exe
if errorlevel 1 exit /b 2
golden.exe
exit /b %errorlevel%
