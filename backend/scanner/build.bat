@echo off
echo Building VoidScanner...

REM Visual Studio Build Tools path (common locations)
set "MSBUILD_PATH="
if exist "C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\MSBuild.exe" (
    set "MSBUILD_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
) else if exist "C:\Program Files\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe" (
    set "MSBUILD_PATH=C:\Program Files\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
) else if exist "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe" (
    set "MSBUILD_PATH=C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe"
) else if exist "C:\Windows\Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe" (
    set "MSBUILD_PATH=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe"
)

if "%MSBUILD_PATH%"=="" (
    echo MSBuild not found! Please install Visual Studio Build Tools or .NET Framework.
    echo Download from: https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022
    pause
    exit /b 1
)

echo Using MSBuild: %MSBUILD_PATH%

REM Build the project
"%MSBUILD_PATH%" VoidScanner.csproj /p:Configuration=Release /p:Platform="Any CPU" /p:OutputPath=bin\Release\

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful!
    echo Executable created: bin\Release\VoidScanner.exe
    echo.
    
    REM Copy to main directory
    if exist "bin\Release\VoidScanner.exe" (
        copy "bin\Release\VoidScanner.exe" "VoidScanner.exe"
        echo ✅ VoidScanner.exe copied to main directory
        
        REM Ensure bin\Release directory exists and copy there too
        if not exist "bin\Release" mkdir "bin\Release"
        copy "bin\Release\VoidScanner.exe" "bin\Release\VoidScanner.exe"
        echo ✅ VoidScanner.exe ensured in bin\Release directory
    )
) else (
    echo.
    echo ❌ Build failed!
    echo Please check the error messages above.
)

echo.
pause