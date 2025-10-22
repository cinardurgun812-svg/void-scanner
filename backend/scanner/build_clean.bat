@echo off
echo Building CleanScanner...

set "MSBUILD_PATH=C:\Windows\Microsoft.NET\Framework64\v4.0.30319\MSBuild.exe"

if not exist "%MSBUILD_PATH%" (
    echo MSBuild not found!
    pause
    exit /b 1
)

echo Using MSBuild: %MSBUILD_PATH%

REM Build the project
"%MSBUILD_PATH%" CleanScanner.csproj /p:Configuration=Release /p:Platform="Any CPU"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Build successful!
    echo Executable created: bin\Release\CleanScanner.exe
    echo.
    
    REM Copy to main directory
    if exist "bin\Release\CleanScanner.exe" (
        copy "bin\Release\CleanScanner.exe" "CleanScanner.exe"
        echo ✅ CleanScanner.exe copied to main directory
    )
) else (
    echo.
    echo ❌ Build failed!
)

echo.
pause
