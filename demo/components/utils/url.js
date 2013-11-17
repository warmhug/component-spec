/****************************************************
* author：  hualei
* time：    2013/5/29 17:23:57
* fileName：url.js
*****************************************************/

function Url() {
    this.getDomain = function () {
        return location.host;
    }
    //this.on = 'on' // 重写on方法，抛错
}