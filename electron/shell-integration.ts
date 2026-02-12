import { app } from "electron";
import * as path from "path";
import * as fs from "fs";

export class ShellIntegration {
  private integrationDir: string;

  constructor() {
    this.integrationDir = path.join(
      app.getPath("userData"),
      "shell-integration",
    );
    if (!fs.existsSync(this.integrationDir)) {
      fs.mkdirSync(this.integrationDir, { recursive: true });
    }
  }

  setupZsh(): string {
    // Wrap .zshenv
    const zshenvPath = path.join(this.integrationDir, ".zshenv");
    const zshenvContent = `
if [[ -f "$HOME/.zshenv" ]]; then
  source "$HOME/.zshenv"
fi
`;
    fs.writeFileSync(zshenvPath, zshenvContent);

    // Wrap .zprofile
    const zprofilePath = path.join(this.integrationDir, ".zprofile");
    const zprofileContent = `
if [[ -f "$HOME/.zprofile" ]]; then
  source "$HOME/.zprofile"
fi
`;
    fs.writeFileSync(zprofilePath, zprofileContent);

    // Wrap .zshrc
    const zshrcPath = path.join(this.integrationDir, ".zshrc");
    const zshrcContent = `
# Source original zshrc
if [[ -f "$HOME/.zshrc" ]]; then
  source "$HOME/.zshrc"
fi

# AI Terminal Enhancements
autoload -U colors && colors

# 定义颜色代码
# Cyan: %F{cyan} (对应主题中的亮青色)
# Reset: %f

# 追加颜色设置到 Prompt
# 我们检测 Prompt 是否已经以颜色代码结尾，如果不是，则追加
# 这里简单暴力地追加颜色，这会让用户输入的命令变成青色
export PS1="$PS1%F{cyan}"

# 在命令执行前重置颜色，确保命令输出使用默认颜色（我们在 TerminalView 中设置的淡灰色）
preexec() {
  print -n "\\x1b[0m"
}
`;
    fs.writeFileSync(zshrcPath, zshrcContent);

    return this.integrationDir;
  }
}
