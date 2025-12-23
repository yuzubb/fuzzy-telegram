const express = require('express');
const { Client } = require('youtubei');
const path = require('path');

const app = express();
const youtube = new Client();
const PORT = process.env.PORT || 3000;

app.use(express.static('public'));

// HTMLを表示するルート
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// チャットをストリーミングするためのエンドポイント (SSE)
app.get('/chat-stream', async (req, res) => {
  const videoId = req.query.videoId;
  if (!videoId) return res.status(400).send('Video ID is required');

  // SSE用のヘッダー設定
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const video = await youtube.getVideo(videoId);
    
    // コメント受信時の処理
    video.on('chat', (chat) => {
      const data = JSON.stringify({
        author: chat.author.name,
        message: chat.message[0]?.text || chat.message // メッセージ形式に合わせて調整
      });
      res.write(`data: ${data}\n\n`); // ブラウザへ送信
    });

    // チャット取得開始
    video.playChat(5000);

    // クライアントが接続を切った時の処理
    req.on('close', () => {
      video.stopChat();
      res.end();
    });

  } catch (error) {
    console.error(error);
    res.write('event: error\ndata: ライブ情報の取得に失敗しました\n\n');
    res.end();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
