'use strict';

function fetcher(url, request, callback) {
  let headers = new Headers();
  headers.append('X-Requested-With', 'Fetch');
  request['headers'] = headers;
  request['credentials'] = 'include';
  request['cache'] = 'no-cache';

  let process = response => {
    if(response.status === 403) {
      // サーバからセッションエラー(403)が返却されたら強制ログアウト
      localStorage.removeItem('name');
      localStorage.removeItem('icon');
      top.location = '/'; // ページをリロードしてログイン画面を表示
      return;
    }
    let contentType = response.headers.get('content-type');
    if(contentType && contentType.indexOf('application/json') !== -1) {
      return response.json().then(json => json);
    }
  };

  fetch(url ,request).then(process).then(callback);
}

var $$ = (id) => document.getElementById(id);

Node.prototype.prependChild = function(e){ this.insertBefore(e,this.firstChild); }

class Feed {
  constructor(raw) {
    this.id = raw.id;
    this.user_id = raw.user_id;
    this.name = raw.name;
    this.feed_type = raw.feed_type;
    this.updated_at = raw.updated_at;
    this.created_at = raw.created_at;
    this.comment = raw.comment;
    this.exif = raw.exif;
    this.image_file_name = raw.image_file_name;
  }

  isText() {
    return this.feed_type == 'text';
  }
  isImage() {
    return this.feed_type == 'image';
  }
  getCaption() {
    return (this.exif.length > 1) ? `${this.exif}にて撮影` : '';
  }

  getPostedDate() {
    let date = new Date(this.created_at);
    return date.toLocaleString()
  }

  build() {
    const compiler = _.template( $$("feed-tmpl").textContent );
    return compiler( { feed: this } );
  }

}
