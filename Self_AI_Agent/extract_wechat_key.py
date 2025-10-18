#!/usr/bin/env python3
"""
macOS微信数据库密钥提取工具
自动从钥匙串提取或指导手动操作
"""

import os
import sys
import subprocess
import re

def extract_from_keychain():
    """
    从macOS钥匙串自动提取密钥
    """
    print("🔍 尝试从钥匙串自动提取...\n")
    
    # 尝试搜索微信相关条目
    search_terms = [
        'WeChat',
        'wechat',
        'com.tencent.xinWeChat',
        'com.tencent.wechat',
        '微信'
    ]
    
    for term in search_terms:
        try:
            # 使用security命令查询
            result = subprocess.run(
                ['security', 'find-generic-password', '-w', '-l', term],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0 and result.stdout.strip():
                password = result.stdout.strip()
                
                # 验证是否是64位hex
                if re.match(r'^[0-9a-fA-F]{64}$', password):
                    print(f"✅ 成功提取密钥 (搜索词: {term})\n")
                    return password
                else:
                    print(f"⚠️  找到密码但格式不匹配 (搜索词: {term})")
                    print(f"   长度: {len(password)}, 内容: {password[:20]}...\n")
                    
        except subprocess.TimeoutExpired:
            print(f"⏱  搜索 '{term}' 超时")
        except Exception as e:
            print(f"❌ 搜索 '{term}' 出错: {e}")
    
    return None

def list_all_passwords():
    """
    列出所有包含'wechat'的钥匙串条目
    """
    print("\n📋 列出所有相关钥匙串条目:\n")
    
    try:
        # 导出所有密码（需要授权）
        result = subprocess.run(
            ['security', 'dump-keychain'],
            capture_output=True,
            text=True,
            timeout=10
        )
        
        lines = result.stdout.split('\n')
        wechat_entries = []
        
        for i, line in enumerate(lines):
            if any(term in line.lower() for term in ['wechat', '微信', 'tencent']):
                wechat_entries.append(line)
                # 显示前后5行上下文
                context = lines[max(0, i-2):min(len(lines), i+3)]
                print('---')
                print('\n'.join(context))
                print('---\n')
        
        if not wechat_entries:
            print("❌ 未找到微信相关条目")
        
    except Exception as e:
        print(f"❌ 列出条目失败: {e}")

def manual_instructions():
    """
    提供手动提取指导
    """
    print("\n" + "="*60)
    print("📖 手动提取密钥步骤")
    print("="*60 + "\n")
    
    print("方法1️⃣: 通过钥匙串访问应用 (推荐)")
    print("-" * 60)
    print("1. 打开 '钥匙串访问' 应用")
    print("   路径: /Applications/Utilities/Keychain Access.app")
    print("   或按 Cmd+Space 搜索 'Keychain Access'\n")
    
    print("2. 在右上角搜索框输入以下任一关键词:")
    print("   - WeChat")
    print("   - 微信")
    print("   - com.tencent.xinWeChat\n")
    
    print("3. 找到类型为 '应用程序密码' 或 '互联网密码' 的条目\n")
    
    print("4. 双击该条目，会弹出详情窗口\n")
    
    print("5. 勾选 '显示密码' 复选框")
    print("   系统会要求输入您的Mac登录密码\n")
    
    print("6. 输入密码后，密码框会显示一串字符")
    print("   这就是微信数据库密钥！\n")
    
    print("7. 复制密钥（应该是64位十六进制字符串）\n")
    
    print("\n方法2️⃣: 通过命令行")
    print("-" * 60)
    print("运行以下命令（会弹出授权对话框）:\n")
    print("security find-generic-password -w -l WeChat\n")
    print("或:")
    print("security find-generic-password -w -s com.tencent.xinWeChat\n")
    
    print("\n方法3️⃣: 查看微信数据库位置")
    print("-" * 60)
    print("微信数据库通常在:")
    print("~/Library/Containers/com.tencent.xinWeChat/Data/Library/")
    print("  Application Support/com.tencent.xinWeChat/*/Message/*.db\n")
    
    print("如果数据库有密钥保护，密钥通常存储在钥匙串中\n")

def validate_key(key):
    """
    验证密钥格式
    """
    print(f"\n🔍 验证密钥格式...\n")
    
    if not key:
        print("❌ 密钥为空")
        return False
    
    key = key.strip()
    
    print(f"密钥长度: {len(key)}")
    print(f"密钥预览: {key[:16]}...{key[-16:]}")
    
    # 检查长度
    if len(key) != 64:
        print(f"❌ 长度错误: 期望64位，实际{len(key)}位")
        return False
    
    # 检查字符
    if not re.match(r'^[0-9a-fA-F]+$', key):
        print("❌ 格式错误: 只能包含0-9和a-f")
        invalid_chars = set(c for c in key if c not in '0123456789abcdefABCDEF')
        print(f"   非法字符: {invalid_chars}")
        return False
    
    print("✅ 格式正确！")
    return True

def save_to_env(key):
    """
    保存到环境变量
    """
    print("\n💾 保存密钥...\n")
    
    # 获取shell类型
    shell = os.environ.get('SHELL', '/bin/zsh')
    
    if 'zsh' in shell:
        rc_file = os.path.expanduser('~/.zshrc')
    elif 'bash' in shell:
        rc_file = os.path.expanduser('~/.bashrc')
    else:
        rc_file = os.path.expanduser('~/.profile')
    
    print(f"检测到Shell: {shell}")
    print(f"配置文件: {rc_file}\n")
    
    # 检查是否已存在
    try:
        with open(rc_file, 'r') as f:
            content = f.read()
            if 'WECHAT_DB_KEY' in content:
                print("⚠️  配置文件中已存在 WECHAT_DB_KEY")
                response = input("是否覆盖? (y/N): ")
                if response.lower() != 'y':
                    print("已取消")
                    return False
    except FileNotFoundError:
        pass
    
    # 写入
    try:
        with open(rc_file, 'a') as f:
            f.write(f'\n# WeChat Database Key (Added by extract script)\n')
            f.write(f'export WECHAT_DB_KEY="{key}"\n')
        
        print(f"✅ 已写入 {rc_file}")
        print("\n⚠️  请运行以下命令使其生效:")
        print(f"source {rc_file}")
        print("\n或重新打开终端\n")
        
        return True
        
    except Exception as e:
        print(f"❌ 写入失败: {e}")
        return False

def main():
    print("\n" + "="*60)
    print("🔑 微信数据库密钥提取工具 (macOS)")
    print("="*60 + "\n")
    
    # 尝试自动提取
    key = extract_from_keychain()
    
    if key:
        print(f"密钥: {key}\n")
        
        if validate_key(key):
            response = input("\n是否保存到环境变量? (Y/n): ")
            if response.lower() != 'n':
                if save_to_env(key):
                    print("\n✅ 完成！")
                    print("\n下一步:")
                    print("1. 重新加载配置: source ~/.zshrc")
                    print("2. 验证: echo $WECHAT_DB_KEY")
                    print("3. 运行测试: cd Self_AI_Agent && npx tsx test_wechat_decrypt.ts")
                else:
                    print("\n手动设置:")
                    print(f'export WECHAT_DB_KEY="{key}"')
            sys.exit(0)
    
    # 自动提取失败，提供手动指导
    print("\n❌ 自动提取失败\n")
    
    # 列出所有相关条目
    list_all_passwords()
    
    # 显示手动步骤
    manual_instructions()
    
    # 提供手动输入选项
    print("\n" + "="*60)
    print("📝 手动输入密钥")
    print("="*60 + "\n")
    
    print("如果您已经通过上述方法获取了密钥，请在此输入:")
    print("(直接回车跳过)\n")
    
    manual_key = input("密钥 (64位hex): ").strip()
    
    if manual_key:
        if validate_key(manual_key):
            response = input("\n是否保存到环境变量? (Y/n): ")
            if response.lower() != 'n':
                save_to_env(manual_key)
        else:
            print("\n❌ 密钥格式不正确，请检查后重试")
            sys.exit(1)
    else:
        print("\n💡 提示: 完成手动提取后，再次运行此脚本输入密钥")
    
    print("\n")

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  用户中断")
        sys.exit(1)
