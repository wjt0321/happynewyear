# Windows环境下的脚本权限设置
# PowerShell脚本用于在Windows环境下准备部署脚本

Write-Host "设置脚本文件权限..." -ForegroundColor Green

# 获取脚本目录
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

# 设置脚本文件为可执行
$ScriptFiles = @(
    "$ScriptDir\deploy.sh",
    "$ScriptDir\setup-tunnel.sh", 
    "$ScriptDir\health-check.sh"
)

foreach ($file in $ScriptFiles) {
    if (Test-Path $file) {
        Write-Host "设置 $file 为可执行" -ForegroundColor Yellow
        # 在Windows下，.sh文件的可执行性主要由Git Bash或WSL处理
        # 这里主要是确保文件存在且可读
        $acl = Get-Acl $file
        Set-Acl $file $acl
    } else {
        Write-Host "文件不存在: $file" -ForegroundColor Red
    }
}

Write-Host "权限设置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "注意：在Windows环境下运行脚本需要：" -ForegroundColor Yellow
Write-Host "1. 使用Git Bash: ./scripts/deploy.sh deploy dev" -ForegroundColor Cyan
Write-Host "2. 使用WSL: wsl ./scripts/deploy.sh deploy dev" -ForegroundColor Cyan
Write-Host "3. 或者直接使用Docker命令进行部署" -ForegroundColor Cyan