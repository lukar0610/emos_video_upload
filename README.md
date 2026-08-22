# emos video upload

> [`emos`](https://emos.best) 的视频上传 `web` 版

# 使用

## 安装 `ffmpeg`

### debian

```bash
apt install ffmpeg
```

## 安装程序

```bash
mkdir /emos_video_upload
wget https://github.com/somebyteorg/emos_video_upload/releases/latest/download/linux_amd64
chmod +x linux_amd64
```

## 配置 `.env`

```bash
cp .env.example .env
```

修改里面的 `PASSWORD` `EMOS_TOKEN` `VIDEO_ROOT`

## 启动

```bash
tmux new -s emos_video_upload
./linux_amd64 server
```

## 其他

如果任务遇到问题 可以删除 `dbdata` 目录后重新运行程序

