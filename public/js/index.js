'use strict';

var latestFeedId = 0;
var oldestFeedId = 0;

document.addEventListener('DOMContentLoaded', () => {

  (function init() {
    if(!localStorage.getItem('name')) {
      // ログイン・ユーザ登録画面表示
      $('#modal-login').modal({keyboard: false, backdrop: 'static'}).modal('show');
      $$('footer-login').addEventListener('click', () => {
        $$('header-login').textContent = '新規ユーザ登録';
        $$('footer-login').style.visibility = 'hidden';
      });
    } else {
      // メイン画面
      $$('form-text-feed').reset();
      $$('img-profile').src = localStorage.getItem('icon');
      $$('span-self').textContent = localStorage.getItem('name');
      $$('div-new-feeds').style.display = 'none';
      $$('div-old-feeds').style.display = 'none';
      loadInitialFeeds();
      document.body.removeChild($$('mask'));
      setInterval(loadNewFeeds, 6000);
    }
  })();

  // ログアウトボタン
  $$('button-logout').addEventListener('click', function(e) {
    let process = result => {
      localStorage.removeItem('name');
      localStorage.removeItem('icon');
      top.location = '/'; // ログイン画面を表示
    }
    fetcher('/sessions', {method: 'DELETE'}, process);
  });

  // 友人登録ボタン
  $$('form-add-user').addEventListener('submit', (event) => {
    event.preventDefault();
    let body = new FormData();
    body.append('user', $$('input-user-name').value);
    let process = result => {
      if (result.errors) {
        // 友人登録失敗
        $$('div-errors-add-friend').innerHTML = '';
        result.errors.forEach(value => $$('div-errors-add-friend').innerHTML += `<p class="bg-danger text-danger">${value}</p>` );
      } else {
        // 友人登録成功
        top.location = '/'; // メイン画面を再読み込み
      }
    }
    fetcher('/friends', {method: 'POST', body: body}, process);
  });

  // テキストフィード投稿
  $$('form-text-feed').addEventListener('submit', (event) => {
    // テキストが入力されていなければ投稿しない
    if(!$$('input-text-feed').value.length) return;
    event.preventDefault();
    let body = new FormData();
    body.append('comment', $$('input-text-feed').value);
    body.append('feed_type', 'text');
    let process = result => top.location = '/'; // メイン画面を再読み込み
    fetcher('/feeds', {method: 'POST', body: body}, process);
  });

  // 画像フィード投稿
  $$('div-image-drop').addEventListener('dragover', (event) => {
    event.preventDefault();
  });
  $$('div-image-drop').addEventListener('drop', (event) => {
    event.preventDefault();
    $$('div-image-drop').textContent = '画像アップロード中';
    $$('div-image-drop').classList.add('drop-zone-droped');

    let body = new FormData();
    body.append('image', event.dataTransfer.files[0]);
    body.append('feed_type', 'image');
    let process = result => {
      if(result.errors) {
        $$('div-image-drop').textContent = 'ここに画像をドロップ';
        $$('div-image-drop').classList.remove('drop-zone-droped');
        result.errors.forEach(value => alert(value));
      } else {
        top.location = '/'; // メイン画面を再読み込み
      }
    }
    fetcher('/feeds', {method: 'POST', body: body}, process);
  });

  // 初期フィード取得
  function loadInitialFeeds() {
    let process = result => {
      if (result.feeds && result.feeds.length > 0) {
        latestFeedId = result.feeds[0].id;
        oldestFeedId = result.feeds[result.feeds.length-1].id;
        __appendFeeds( createFeedFragment(result.feeds) );
        setTimeout(loadOldFeeds, 1000);
      }
    }
    fetcher('/feeds', {method: 'GET'}, process);
  }

  // 新着フィード取得ボタン
  $$('button-load-new').addEventListener('click', (event) => {
    event.preventDefault();
    loadNewFeeds(true);
  });

  // 過去フィード取得
  function loadNewFeeds(withItems=false) {
    let url = `/feeds/${latestFeedId}/find_new`;
    if(withItems) url += '?include_items=1';
    let process = result => {
      if(result.count > 0) {
        $$('span-new-feed-count').textContent = result.count;
        $$('div-new-feeds').style.display = 'block';
        if (result.feeds && result.feeds.length > 0) {
          latestFeedId = result.feeds[0].id;
          __prependFeeds ( createFeedFragment(result.feeds) );
          $$('span-new-feed-count').textContent = 0;
          $$('div-new-feeds').style.display = 'none';        
        }
      } else {
        $$('span-new-feed-count').textContent = 0;
        $$('div-new-feeds').style.display = 'none';
      }
    }
    fetcher(url, {method: 'GET'}, process);
  }

  // 過去フィード取得ボタン
  $$('button-load-old').addEventListener('click', (event) => {
    event.preventDefault();
    loadOldFeeds(true);
  });

  // 過去フィード取得
  function loadOldFeeds(withItems=false) {
    let url = `/feeds/${oldestFeedId}/find_old`;
    if(withItems) url += '?include_items=1';
    let process = result => {
      $$('div-old-feeds').style.display = (result.count > 0 ? 'block' : 'none');
      if (result.feeds && result.feeds.length > 0) {
        oldestFeedId = result.feeds[result.feeds.length-1].id;
        __appendFeeds( createFeedFragment(result.feeds) );
        $$('div-old-feeds').style.display = 'none';
        setTimeout(loadOldFeeds, 1000);    
      }
    };
    fetcher(url, {method: 'GET'}, process);
  }

  function __appendFeeds(domHtml) {
    $('#div-feeds').append(domHtml);
  }
  function __prependFeeds(domHtml) {
    $('#div-feeds').prepend(domHtml);
  }

  // フィードのDOM生成
  function createFeedFragment(feeds) {
    let feedModels = [];
    feeds.forEach((feed)=>{ feedModels.push( new Feed(feed) );});
    let result = '';
    feedModels.forEach((feed)=>{ result += feed.build(); });

    return result;
  }
});
