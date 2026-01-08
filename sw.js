const CACHE_NAME = 'legaltech-officer-dashboard-v2.1.0';
const STATIC_CACHE_URLS = [
  './02yakuin-kanri-improved.html',
  './manifest.json'
];

// Service Worker のインストール
self.addEventListener('install', event => {
  console.log('[Service Worker] インストール中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] ファイルをキャッシュ中...');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[Service Worker] インストール完了');
        return self.skipWaiting();
      })
  );
});

// Service Worker のアクティベート
self.addEventListener('activate', event => {
  console.log('[Service Worker] アクティベート中...');
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] 古いキャッシュを削除:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] アクティベート完了');
        return self.clients.claim();
      })
  );
});

// フェッチイベント（ネットワークリクエスト処理）
self.addEventListener('fetch', event => {
  // HTMLページのリクエストの場合
  if (event.request.destination === 'document') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return caches.match('./02yakuin-kanri-improved.html');
        })
    );
    return;
  }

  // その他のリソースの場合（Cache First戦略）
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }

        return fetch(event.request)
          .then(response => {
            // レスポンスが有効でない場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // レスポンスをクローンしてキャッシュに保存
            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
});

// プッシュ通知（将来の拡張用）
self.addEventListener('push', event => {
  console.log('[Service Worker] プッシュ通知受信:', event);
  
  const options = {
    body: event.data ? event.data.text() : '役員任期の満了予定があります',
    icon: './icon-192.png',
    badge: './icon-72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '確認する',
        icon: './icon-96.png'
      },
      {
        action: 'close',
        title: '後で確認',
        icon: './icon-96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('LegalTech 役員ダッシュボード', options)
  );
});

// 通知クリック処理
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] 通知クリック:', event);
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('./02yakuin-kanri-improved.html')
    );
  }
});

// バックグラウンド同期（将来の拡張用）
self.addEventListener('sync', event => {
  console.log('[Service Worker] バックグラウンド同期:', event);
  
  if (event.tag === 'background-sync-officers') {
    event.waitUntil(doBackgroundSync());
  }
});

// バックグラウンド同期の処理
async function doBackgroundSync() {
  try {
    console.log('[Service Worker] バックグラウンドでデータ同期実行中...');
    // 将来的にサーバーとの同期処理を実装
    return Promise.resolve();
  } catch (error) {
    console.error('[Service Worker] バックグラウンド同期エラー:', error);
    throw error;
  }
}

// エラーハンドリング
self.addEventListener('error', event => {
  console.error('[Service Worker] エラー:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('[Service Worker] 未処理のPromise拒否:', event.reason);
  event.preventDefault();
});

console.log('[Service Worker] LegalTech 役員ダッシュボード Service Worker 読み込み完了');