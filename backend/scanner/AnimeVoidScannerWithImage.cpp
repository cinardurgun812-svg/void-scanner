#include <windows.h>
#include <gdiplus.h>
#include <wininet.h>
#include <string>
#include <sstream>
#include <random>
#include <ctime>
#include <vector>

#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "wininet.lib")

using namespace Gdiplus;
using namespace std;

// Global variables
HWND hMainWindow;
HWND hStartButton;
HWND hProgressBar;
HWND hStatusLabel;
bool isScanning = false;
string pinCode;
int animationFrame = 0;
vector<POINT> rainDrops;
Image* animeImage = NULL;

// Function declarations
LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam);
void InitializeWindow();
void DrawAnimeCharacter(HDC hdc, RECT rect);
void DrawRainEffect(HDC hdc, RECT rect);
void OnStartButtonClick();
DWORD WINAPI PerformScan(LPVOID lpParam);
string GenerateRandomPin();
string TakeScreenshot();
void SendResults(const string& screenshotPath);
void UpdateProgress(int value, const string& status);

int WINAPI WinMain(HINSTANCE hInstance, HINSTANCE hPrevInstance, LPSTR lpCmdLine, int nCmdShow)
{
    // Initialize GDI+
    GdiplusStartupInput gdiplusStartupInput;
    ULONG_PTR gdiplusToken;
    GdiplusStartup(&gdiplusToken, &gdiplusStartupInput, NULL);

    // Load anime image
    animeImage = Image::FromFile(L"anime.jpg.jpg");

    // Initialize rain drops
    srand((unsigned int)time(NULL));
    for (int i = 0; i < 200; i++)
    {
        POINT drop;
        drop.x = rand() % 700;
        drop.y = rand() % 500;
        rainDrops.push_back(drop);
    }

    // Register window class
    WNDCLASSEX wc = {};
    wc.cbSize = sizeof(WNDCLASSEX);
    wc.style = CS_HREDRAW | CS_VREDRAW;
    wc.lpfnWndProc = WindowProc;
    wc.hInstance = hInstance;
    wc.hCursor = LoadCursor(NULL, IDC_ARROW);
    wc.hbrBackground = (HBRUSH)(COLOR_WINDOW + 1);
    wc.lpszClassName = L"AnimeVoidScanner";
    wc.hIcon = LoadIcon(NULL, IDI_APPLICATION);
    wc.hIconSm = LoadIcon(NULL, IDI_APPLICATION);

    if (!RegisterClassEx(&wc))
    {
        MessageBox(NULL, L"Window registration failed!", L"Error", MB_OK | MB_ICONERROR);
        return 1;
    }

    // Create window
    hMainWindow = CreateWindowEx(
        0,
        L"AnimeVoidScanner",
        L"Void Scanner",
        WS_POPUP | WS_VISIBLE,
        CW_USEDEFAULT, CW_USEDEFAULT,
        700, 500,
        NULL, NULL,
        hInstance, NULL
    );

    if (!hMainWindow)
    {
        MessageBox(NULL, L"Window creation failed!", L"Error", MB_OK | MB_ICONERROR);
        return 1;
    }

    InitializeWindow();

    ShowWindow(hMainWindow, nCmdShow);
    UpdateWindow(hMainWindow);

    // Message loop
    MSG msg = {};
    while (GetMessage(&msg, NULL, 0, 0))
    {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }

    // Cleanup
    if (animeImage) delete animeImage;
    GdiplusShutdown(gdiplusToken);

    return 0;
}

LRESULT CALLBACK WindowProc(HWND hwnd, UINT uMsg, WPARAM wParam, LPARAM lParam)
{
    switch (uMsg)
    {
    case WM_CREATE:
        return 0;

    case WM_PAINT:
    {
        PAINTSTRUCT ps;
        HDC hdc = BeginPaint(hwnd, &ps);
        
        RECT rect;
        GetClientRect(hwnd, &rect);
        
        // Fill background with black
        HBRUSH blackBrush = CreateSolidBrush(RGB(0, 0, 0));
        FillRect(hdc, &rect, blackBrush);
        DeleteObject(blackBrush);
        
        // Draw anime character
        DrawAnimeCharacter(hdc, rect);
        
        // Draw rain effect
        DrawRainEffect(hdc, rect);
        
        EndPaint(hwnd, &ps);
        return 0;
    }

    case WM_COMMAND:
        if (LOWORD(wParam) == 1) // Start button ID
        {
            OnStartButtonClick();
        }
        return 0;

    case WM_LBUTTONDOWN:
    {
        int x = LOWORD(lParam);
        int y = HIWORD(lParam);
        
        // Check if click is on start button area
        if (x >= 250 && x <= 450 && y >= 200 && y <= 280)
        {
            OnStartButtonClick();
        }
        return 0;
    }

    case WM_TIMER:
        if (wParam == 1) // Animation timer
        {
            animationFrame++;
            
            // Update rain drops
            for (int i = 0; i < rainDrops.size(); i++)
            {
                rainDrops[i].y += 3;
                if (rainDrops[i].y > 500)
                {
                    rainDrops[i].y = 0;
                    rainDrops[i].x = rand() % 700;
                }
            }
            
            InvalidateRect(hwnd, NULL, FALSE);
        }
        return 0;

    case WM_DESTROY:
        PostQuitMessage(0);
        return 0;

    default:
        return DefWindowProc(hwnd, uMsg, wParam, lParam);
    }
}

void InitializeWindow()
{
    // Create start button
    hStartButton = CreateWindow(
        L"BUTTON",
        L"START",
        WS_VISIBLE | WS_CHILD | BS_PUSHBUTTON,
        250, 200, 200, 80,
        hMainWindow,
        (HMENU)1,
        GetModuleHandle(NULL),
        NULL
    );

    // Set button font
    HFONT hFont = CreateFont(24, 0, 0, 0, FW_BOLD, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        DEFAULT_QUALITY, DEFAULT_PITCH | FF_SWISS, L"Arial");
    SendMessage(hStartButton, WM_SETFONT, (WPARAM)hFont, TRUE);

    // Create progress bar
    hProgressBar = CreateWindow(
        PROGRESS_CLASS,
        L"",
        WS_VISIBLE | WS_CHILD | PBS_SMOOTH,
        150, 350, 400, 30,
        hMainWindow,
        NULL,
        GetModuleHandle(NULL),
        NULL
    );

    // Create status label
    hStatusLabel = CreateWindow(
        L"STATIC",
        L"Ready to scan...",
        WS_VISIBLE | WS_CHILD | SS_CENTER,
        300, 300, 200, 20,
        hMainWindow,
        NULL,
        GetModuleHandle(NULL),
        NULL
    );

    // Set label font
    HFONT hLabelFont = CreateFont(12, 0, 0, 0, FW_NORMAL, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        DEFAULT_QUALITY, DEFAULT_PITCH | FF_SWISS, L"Arial");
    SendMessage(hStatusLabel, WM_SETFONT, (WPARAM)hLabelFont, TRUE);

    // Hide progress bar initially
    ShowWindow(hProgressBar, SW_HIDE);

    // Start animation timer
    SetTimer(hMainWindow, 1, 50, NULL);
}

void DrawAnimeCharacter(HDC hdc, RECT rect)
{
    Graphics graphics(hdc);
    
    if (animeImage)
    {
        // Draw anime image
        graphics.DrawImage(animeImage, 0, 0, 700, 500);
    }
    else
    {
        // Fallback: Draw simple anime character
        SolidBrush redBrush(Color(255, 255, 0, 0));
        
        // Head
        graphics.FillEllipse(&redBrush, 300, 100, 100, 100);
        
        // Body
        graphics.FillRectangle(&redBrush, 320, 200, 60, 100);
        
        // Arms
        graphics.FillRectangle(&redBrush, 280, 220, 40, 20);
        graphics.FillRectangle(&redBrush, 380, 220, 40, 20);
        
        // Legs
        graphics.FillRectangle(&redBrush, 330, 300, 20, 80);
        graphics.FillRectangle(&redBrush, 350, 300, 20, 80);
        
        // Eyes
        graphics.FillEllipse(&redBrush, 320, 130, 15, 15);
        graphics.FillEllipse(&redBrush, 365, 130, 15, 15);
        
        // Hair
        graphics.FillEllipse(&redBrush, 290, 90, 120, 60);
        
        // Katana
        graphics.FillRectangle(&redBrush, 450, 150, 5, 100);
        graphics.FillRectangle(&redBrush, 440, 140, 25, 20);
        
        // Mouth
        graphics.FillEllipse(&redBrush, 340, 160, 20, 10);
    }
}

void DrawRainEffect(HDC hdc, RECT rect)
{
    Graphics graphics(hdc);
    
    // Create semi-transparent black pen for rain
    Pen rainPen(Color(100, 50, 50, 50), 1);

    // Draw rain drops
    for (int i = 0; i < rainDrops.size(); i++)
    {
        graphics.DrawLine(&rainPen, rainDrops[i].x, rainDrops[i].y, rainDrops[i].x, rainDrops[i].y + 30);
    }
}

void OnStartButtonClick()
{
    if (isScanning) return;

    isScanning = true;
    EnableWindow(hStartButton, FALSE);
    ShowWindow(hProgressBar, SW_SHOW);
    
    // Generate PIN
    pinCode = GenerateRandomPin();
    
    // Start scanning in a separate thread
    CreateThread(NULL, 0, PerformScan, NULL, 0, NULL);
}

string GenerateRandomPin()
{
    const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    string pin;
    random_device rd;
    mt19937 gen(rd());
    uniform_int_distribution<> dis(0, chars.length() - 1);
    
    for (int i = 0; i < 8; i++)
    {
        pin += chars[dis(gen)];
    }
    
    return pin;
}

DWORD WINAPI PerformScan(LPVOID lpParam)
{
    try
    {
        // Simulate scanning
        for (int i = 0; i <= 100; i += 10)
        {
            UpdateProgress(i, "Scanning... " + to_string(i) + "%");
            Sleep(500);
        }

        // Take screenshot
        string screenshotPath = TakeScreenshot();
        
        // Send results
        SendResults(screenshotPath);

        UpdateProgress(100, "Scan completed!");

        // Wait 3 seconds then close
        Sleep(3000);
        PostMessage(hMainWindow, WM_CLOSE, 0, 0);
    }
    catch (...)
    {
        UpdateProgress(0, "Error occurred!");
    }

    return 0;
}

string TakeScreenshot()
{
    try
    {
        // Get screen dimensions
        int screenWidth = GetSystemMetrics(SM_CXSCREEN);
        int screenHeight = GetSystemMetrics(SM_CYSCREEN);

        // Create device context
        HDC hScreenDC = GetDC(NULL);
        HDC hMemoryDC = CreateCompatibleDC(hScreenDC);

        // Create bitmap
        HBITMAP hBitmap = CreateCompatibleBitmap(hScreenDC, screenWidth, screenHeight);
        HBITMAP hOldBitmap = (HBITMAP)SelectObject(hMemoryDC, hBitmap);

        // Copy screen to bitmap
        BitBlt(hMemoryDC, 0, 0, screenWidth, screenHeight, hScreenDC, 0, 0, SRCCOPY);

        // Save bitmap to file
        string filename = "void_screenshot_" + to_string(time(NULL)) + ".bmp";
        string filepath = string(getenv("TEMP")) + "\\" + filename;
        
        BITMAPFILEHEADER bmfh;
        BITMAPINFOHEADER bmih;
        BITMAP bm;
        
        GetObject(hBitmap, sizeof(BITMAP), &bm);
        
        bmih.biSize = sizeof(BITMAPINFOHEADER);
        bmih.biWidth = bm.bmWidth;
        bmih.biHeight = bm.bmHeight;
        bmih.biPlanes = 1;
        bmih.biBitCount = 24;
        bmih.biCompression = BI_RGB;
        bmih.biSizeImage = 0;
        bmih.biXPelsPerMeter = 0;
        bmih.biYPelsPerMeter = 0;
        bmih.biClrUsed = 0;
        bmih.biClrImportant = 0;
        
        bmfh.bfType = 0x4D42;
        bmfh.bfSize = sizeof(BITMAPFILEHEADER) + sizeof(BITMAPINFOHEADER) + bm.bmWidth * bm.bmHeight * 3;
        bmfh.bfReserved1 = 0;
        bmfh.bfReserved2 = 0;
        bmfh.bfOffBits = sizeof(BITMAPFILEHEADER) + sizeof(BITMAPINFOHEADER);
        
        HANDLE hFile = CreateFileA(filepath.c_str(), GENERIC_WRITE, 0, NULL, CREATE_ALWAYS, FILE_ATTRIBUTE_NORMAL, NULL);
        if (hFile != INVALID_HANDLE_VALUE)
        {
            DWORD dwBytesWritten;
            WriteFile(hFile, &bmfh, sizeof(BITMAPFILEHEADER), &dwBytesWritten, NULL);
            WriteFile(hFile, &bmih, sizeof(BITMAPINFOHEADER), &dwBytesWritten, NULL);
            
            // Write bitmap data
            BYTE* pBits = new BYTE[bm.bmWidth * bm.bmHeight * 3];
            GetDIBits(hScreenDC, hBitmap, 0, bm.bmHeight, pBits, (BITMAPINFO*)&bmih, DIB_RGB_COLORS);
            WriteFile(hFile, pBits, bm.bmWidth * bm.bmHeight * 3, &dwBytesWritten, NULL);
            delete[] pBits;
            
            CloseHandle(hFile);
        }

        // Clean up
        SelectObject(hMemoryDC, hOldBitmap);
        DeleteObject(hBitmap);
        DeleteDC(hMemoryDC);
        ReleaseDC(NULL, hScreenDC);

        return filepath;
    }
    catch (...)
    {
        return "";
    }
}

void SendResults(const string& screenshotPath)
{
    try
    {
        HINTERNET hInternet = InternetOpenA("VoidScanner", INTERNET_OPEN_TYPE_DIRECT, NULL, NULL, 0);
        if (hInternet)
        {
            HINTERNET hConnect = InternetOpenUrlA(hInternet, "http://localhost:5005/api/scan-results", NULL, 0, INTERNET_FLAG_RELOAD, 0);
            if (hConnect)
            {
                // Prepare JSON data
                string results = "VOID SCANNER - C++ NATIVE SCAN COMPLETED\n" +
                               "Scan Date: " + to_string(time(NULL)) + "\n" +
                               "System: Windows\n" +
                               "Scanner: C++ Native with Anime Image\n" +
                               "Screenshot: " + screenshotPath;
                
                string json = "{\"pin\":\"" + pinCode + "\",\"results\":\"" + results + "\",\"screenshot\":\"\"}";
                
                // Send POST request
                const char* data = json.c_str();
                DWORD dataSize = strlen(data);
                
                HttpSendRequestA(hConnect, "Content-Type: application/json\r\nX-API-Key: VOID_SCANNER_API_KEY_2025", -1, (LPVOID)data, dataSize);
                
                InternetCloseHandle(hConnect);
            }
            InternetCloseHandle(hInternet);
        }
    }
    catch (...)
    {
        // Silent fail
    }
}

void UpdateProgress(int value, const string& status)
{
    // Update progress bar
    SendMessage(hProgressBar, PBM_SETPOS, value, 0);
    
    // Update status label
    SetWindowTextA(hStatusLabel, status.c_str());
}
