export const metadata = {
  title: 'はじめての英単語バトル | WISE English',
  description: '日本語を見て、合う英単語を4つから選ぶゲーム。時間制限なしの「れんしゅう」、タイムチャレンジ、2人たいせん。',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, overflow: 'hidden' }}>
        <script src="https://cdn.jsdelivr.net/gh/winniek75/wise-xp-sdk@main/wise-xp.js"></script>
        <script src="/wise-game-bridge.js"></script>
        <script dangerouslySetInnerHTML={{ __html: 'window.addEventListener("DOMContentLoaded",function(){window.WiseGame&&window.WiseGame.init({gameId:"phonics-battle"})});' }} />
        {children}
      </body>
    </html>
  );
}
