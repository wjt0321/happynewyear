/**
 * Docker环境验证脚本
 * 用于验证Docker配置文件是否正确，无需实际Docker环境
 */

const fs = require('fs');
const path = require('path');

describe('Docker配置文件验证', () => {
  const projectRoot = path.resolve(__dirname, '../../..');
  const backendDir = path.resolve(__dirname, '../..');

  test('Dockerfile应该存在且格式正确', () => {
    const dockerfile = path.join(backendDir, 'Dockerfile');
    expect(fs.existsSync(dockerfile)).toBe(true);

    const dockerfileContent = fs.readFileSync(dockerfile, 'utf8');
    
    // 验证Dockerfile关键指令
    expect(dockerfileContent).toContain('FROM node:18-alpine');
    expect(dockerfileContent).toContain('WORKDIR /app');
    expect(dockerfileContent).toContain('EXPOSE 3000');
    expect(dockerfileContent).toContain('USER nodejs');
    expect(dockerfileContent).toContain('HEALTHCHECK');
    expect(dockerfileContent).toContain('CMD ["node", "dist/index.js"]');
    
    console.log('✅ Dockerfile配置验证通过');
  });

  test('.dockerignore文件应该存在', () => {
    const dockerignore = path.join(backendDir, '.dockerignore');
    expect(fs.existsSync(dockerignore)).toBe(true);

    const dockerignoreContent = fs.readFileSync(dockerignore, 'utf8');
    expect(dockerignoreContent).toContain('node_modules');
    expect(dockerignoreContent).toContain('*.log');
    expect(dockerignoreContent).toContain('.env');
    
    console.log('✅ .dockerignore文件验证通过');
  });

  test('Docker Compose配置文件应该存在且格式正确', () => {
    const composeFiles = [
      'docker-compose.yml',
      'docker-compose.dev.yml', 
      'docker-compose.prod.yml'
    ];

    composeFiles.forEach(file => {
      const filePath = path.join(projectRoot, file);
      expect(fs.existsSync(filePath)).toBe(true);

      // 验证YAML格式（基本检查）
      const content = fs.readFileSync(filePath, 'utf8');
      expect(content).toContain('version:');
      expect(content).toContain('services:');
      
      if (file.includes('prod')) {
        expect(content).toContain('cloudflare-tunnel');
      }
      
      console.log(`✅ ${file} 配置验证通过`);
    });
  });

  test('环境变量模板文件应该存在', () => {
    const envTemplate = path.join(projectRoot, '.env.docker');
    expect(fs.existsSync(envTemplate)).toBe(true);

    const envContent = fs.readFileSync(envTemplate, 'utf8');
    expect(envContent).toContain('BACKEND_PORT');
    expect(envContent).toContain('DATA_PATH');
    expect(envContent).toContain('NODE_ENV');
    expect(envContent).toContain('TUNNEL_TOKEN');
    
    console.log('✅ 环境变量模板文件验证通过');
  });

  test('部署脚本应该存在', () => {
    const scripts = [
      'deploy.sh',
      'setup-tunnel.sh',
      'health-check.sh'
    ];

    scripts.forEach(script => {
      const scriptPath = path.join(projectRoot, 'scripts', script);
      expect(fs.existsSync(scriptPath)).toBe(true);

      const scriptContent = fs.readFileSync(scriptPath, 'utf8');
      expect(scriptContent).toContain('#!/bin/bash');
      
      console.log(`✅ ${script} 脚本验证通过`);
    });
  });

  test('部署文档应该存在', () => {
    const deploymentDoc = path.join(projectRoot, 'DEPLOYMENT.md');
    expect(fs.existsSync(deploymentDoc)).toBe(true);

    const docContent = fs.readFileSync(deploymentDoc, 'utf8');
    expect(docContent).toContain('# 微信小程序新年抽签应用 - 部署指南');
    expect(docContent).toContain('## 系统要求');
    expect(docContent).toContain('## 快速开始');
    
    console.log('✅ 部署文档验证通过');
  });

  test('Docker配置应该包含安全设置', () => {
    const prodCompose = path.join(projectRoot, 'docker-compose.prod.yml');
    const prodContent = fs.readFileSync(prodCompose, 'utf8');
    
    // 验证安全配置
    expect(prodContent).toContain('no-new-privileges');
    expect(prodContent).toContain('read_only');
    expect(prodContent).toContain('security_opt');
    
    console.log('✅ Docker安全配置验证通过');
  });

  test('Docker配置应该包含健康检查', () => {
    const dockerfile = path.join(backendDir, 'Dockerfile');
    const dockerfileContent = fs.readFileSync(dockerfile, 'utf8');
    
    expect(dockerfileContent).toContain('HEALTHCHECK');
    expect(dockerfileContent).toContain('/api/health');
    expect(dockerfileContent).toContain('--interval=30s');
    
    console.log('✅ Docker健康检查配置验证通过');
  });

  test('Docker配置应该包含资源限制', () => {
    const prodCompose = path.join(projectRoot, 'docker-compose.prod.yml');
    const prodContent = fs.readFileSync(prodCompose, 'utf8');
    
    expect(prodContent).toContain('resources:');
    expect(prodContent).toContain('limits:');
    expect(prodContent).toContain('memory:');
    expect(prodContent).toContain('cpus:');
    
    console.log('✅ Docker资源限制配置验证通过');
  });

  test('多阶段构建配置应该正确', () => {
    const dockerfile = path.join(backendDir, 'Dockerfile');
    const dockerfileContent = fs.readFileSync(dockerfile, 'utf8');
    
    expect(dockerfileContent).toContain('FROM node:18-alpine AS builder');
    expect(dockerfileContent).toContain('FROM node:18-alpine AS runtime');
    expect(dockerfileContent).toContain('COPY --from=builder');
    
    console.log('✅ 多阶段构建配置验证通过');
  });

  test('容器用户配置应该正确', () => {
    const dockerfile = path.join(backendDir, 'Dockerfile');
    const dockerfileContent = fs.readFileSync(dockerfile, 'utf8');
    
    expect(dockerfileContent).toContain('addgroup -g 1001 -S nodejs');
    expect(dockerfileContent).toContain('adduser -S nodejs -u 1001');
    expect(dockerfileContent).toContain('USER nodejs');
    expect(dockerfileContent).toContain('chown -R nodejs:nodejs');
    
    console.log('✅ 容器用户配置验证通过');
  });
});