const { Client } = require('youtubei');
const youtube = new Client();

export default async function handler(req, res) {
  const { videoid } = req.query;

  if (!videoid) {
    return res.status(400).send('Video ID is required');
  }

  // SSE (Server-Sent Events) のヘッダー設定
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const video = await youtube.getVideo(videoid);
    
    // チャットイベントを受け取ったらクライアントに送信
    video.on('chat', (chat) => {
      const data = JSON.stringify({
        author: chat.author.name,
        message: chat.message.map(m => m.text || "").join("") // メッセージを文字列に結合
      });
      res.write(`data: ${data}\n\n`);
    });

    // チャットの取得を開始
    video.playChat();

    // Vercelのタイムアウト対策（約10秒〜60秒で切れるため、クライアント側で再接続が必要）
    req.on('close', () => {
      video.stopChat(); // 接続が切れたら停止
    });

  } catch (error) {
    console.error(error);
    res.end();
  }
}
