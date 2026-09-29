# -*- coding: utf-8 -*-
"""插件仓库构建脚本：src/ -> dist/ -> index.json

用法：
    python tools/build_index.py

它做三件事：
  1. 把 src/<id>/main.js 做极轻量的整理后输出到 dist/<id>.js；
  2. 计算 sha256 与字节数；
  3. 把 src/<id>/plugin.json 的全部元数据**内联**进 index.json。

关于「不压缩」的取舍：
    插件体积本来就只有几 KB，而可读性直接决定了出事故时能不能两分钟定位。
    所以这里只做「去行尾空白 / 合并连续空行」，不做混淆。

关于 index.json 为什么要内联元数据：
    基座启动时只拉这一个文件（几十 KB），就掌握了全部插件的依赖、贡献点、
    激活事件与哈希。这使「上百插件仍然秒开」和「按需懒加载」成为可能 ——
    不需要为了知道有哪些插件而下载或执行任何一个插件。
"""
import hashlib
import io
import json
import os
import sys
from datetime import datetime, timezone

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "src")
DIST = os.path.join(ROOT, "dist")


def sha256_file(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def tidy(body):
    out = []
    blank = 0
    for line in body.split("\n"):
        line = line.rstrip()
        if line == "":
            blank += 1
            if blank > 2:
                continue
        else:
            blank = 0
        out.append(line)
    return "\n".join(out).strip() + "\n"


def main():
    if not os.path.isdir(SRC):
        print("找不到 src/ 目录", file=sys.stderr)
        return 1
    os.makedirs(DIST, exist_ok=True)

    plugins = []
    for pid in sorted(os.listdir(SRC)):
        if pid.startswith("_"):
            continue
        d = os.path.join(SRC, pid)
        mf = os.path.join(d, "plugin.json")
        js = os.path.join(d, "main.js")
        if not (os.path.isfile(mf) and os.path.isfile(js)):
            print("  跳过 %s（缺少 plugin.json 或 main.js）" % pid)
            continue

        meta = json.load(io.open(mf, encoding="utf-8"))
        if meta.get("id") != pid:
            raise SystemExit("目录名与 manifest.id 不一致：%s vs %s" % (pid, meta.get("id")))

        # 构建期共享片段：plugin.json 里的 shared 路径相对 src/。
        # 它会先内联到 main.js 顶部，最终 dist 仍是单文件。
        shared = meta.pop("shared", [])
        parts = []
        for rel in shared:
            sp = os.path.join(SRC, rel)
            if not os.path.isfile(sp):
                raise SystemExit("插件 %s 声明的 shared 文件不存在：%s" % (pid, rel))
            parts.append(tidy(io.open(sp, encoding="utf-8").read()))
        parts.append(tidy(io.open(js, encoding="utf-8").read()))
        body = tidy("\n\n".join(parts))
        dist_path = os.path.join(DIST, pid + ".js")
        io.open(dist_path, "w", encoding="utf-8", newline="\n").write(body)

        meta["sha256"] = sha256_file(dist_path)
        meta["size"] = os.path.getsize(dist_path)
        plugins.append(meta)
        print("  %-16s v%-7s %7d B  %s" % (
            pid, meta["version"], meta["size"], meta["sha256"][:12]))

    index = {
        "schema": 1,
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "owner": "NianFengChat",
        "repo": "NianFengChat-android-plugins",
        "license": "Apache-2.0",
        "note": ("元数据全部内联：基座启动时只拉这一个文件即可掌握全部插件信息，"
                 "不需要下载或执行任何插件。插件本体在 dist/<id>.js。"),
        "plugins": plugins,
    }
    out = os.path.join(ROOT, "index.json")
    io.open(out, "w", encoding="utf-8", newline="\n").write(
        json.dumps(index, ensure_ascii=False, indent=2) + "\n")
    print("\n共 %d 个插件 -> index.json" % len(plugins))
    return 0


if __name__ == "__main__":
    sys.exit(main())
