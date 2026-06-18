@echo off
echo ========================================
echo VoO / Kaizen V2.0 Migration Tool
echo ========================================
echo.
echo This will:
echo 1. Backup old Vue.js frontend
echo 2. Setup V2.0 Next.js system
echo 3. Reset database with V2.0 schema
echo 4. Create Super Admin user
echo.
set /p confirm="Continue with migration? (yes/no): "

if /i "%confirm%"=="yes" (
    echo.
    echo [1/5] Backing up old frontend...
    if exist frontend (
        if exist frontend-vue-backup (
            echo Removing old backup...
            rmdir /s /q frontend-vue-backup
        )
        echo Creating backup: frontend-vue-backup
        move frontend frontend-vue-backup
        echo ✓ Backup created
    ) else (
        echo No old frontend found, skipping backup
    )

    echo.
    echo [2/5] Resetting database for V2.0...
    cd backend
    call npx prisma db push --force-reset
    
    echo.
    echo [3/5] Seeding V2.0 data...
    call npx tsx prisma/seed.ts
    
    echo.
    echo [4/5] Installing frontend dependencies...
    cd ..
    cd frontend-next
    if not exist node_modules (
        call npm install
    )
    
    cd ..
    
    echo.
    echo [5/5] Migration completed!
    echo.
    echo ========================================
    echo  VoO / Kaizen V2.0 Ready!
    echo ========================================
    echo.
    echo Next steps:
    echo.
    echo 1. Start Backend:
    echo    cd backend
    echo    npm run dev
    echo.
    echo 2. Start Frontend (new terminal):
    echo    cd frontend-next
    echo    npm run dev
    echo.
    echo 3. Login as Super Admin:
    echo    URL: http://localhost:3000
    echo    Username: superadmin
    echo    Password: admin123
    echo.
    echo Available roles:
    echo  - Super Admin (superadmin/admin123)
    echo  - Section Manager (section_manager/manager123)
    echo  - Foreman (foreman01/foreman123)
    echo  - Operator (operator01-05/operator123)
    echo.
    
) else (
    echo.
    echo Migration cancelled.
    echo.
)

pause
